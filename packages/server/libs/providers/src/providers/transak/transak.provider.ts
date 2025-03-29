import {
  isChainIdSupported, SupportedChainId, supportedChains,
} from "@app/common/chains";
import {
  ProviderQuoteDto, QuoteOptions, QuoteStepOnrampViaLink,
} from "@app/common/quotes";
import { TimedCache, } from "@app/common/utils/timed-cache";
import {
  KycRequirement,
  PaymentMethod,
  QuoteProviderType,
  RouteType,
} from "@app/db/enums";
import {
  ProviderRepository,
  SupportedCountryRepository,
  SupportedKycRepository,
  SupportedTokenRepository,
} from "@app/db/repositories";
import { TokensService, } from "@app/tokens";
import {
  Injectable, Logger, NotFoundException, 
} from "@nestjs/common";
import { ConfigService, } from "@nestjs/config";
import { $fetch, FetchError, } from "ofetch";
import { getAddress, parseUnits, } from "viem";
import { zksync, } from "viem/chains";
import { l2BaseTokenAddress, legacyEthAddress, } from "viem/zksync";

import { IProvider, } from "../../provider.interface";
import type {
  OrderStatusResponse,
  TransakApiOrderStatusResponse,
  TransakApiResponse,
  TransakCountriesResponse, TransakCryptoCurrenciesResponse, TransakEnvironment, TransakQuoteResponse, 
} from "./type";

const TransakApiEndpoint = (dev = false,) => {
  return dev
    ? "https://api-stg.transak.com/api"
    : "https://api.transak.com/api";
};

function getTransakBaseUrl(dev = false,) {
  return dev
    ? "https://staging-global.transak.com" // staging environment
    : "https://global.transak.com";        // production environment
}

const paymentMethodMap: Record<PaymentMethod, string | null> = {
  [PaymentMethod.CREDIT_CARD]:       "credit_debit_card",
  [PaymentMethod.APPLE_PAY_CREDIT]:  "apple_pay",
  [PaymentMethod.GOOGLE_PAY_CREDIT]: "google_pay",
  [PaymentMethod.DEBIT_CARD]:        "credit_debit_card",
  [PaymentMethod.APPLE_PAY_DEBIT]:   "apple_pay",
  [PaymentMethod.GOOGLE_PAY_DEBIT]:  "google_pay",
  [PaymentMethod.WIRE]:              null,
  [PaymentMethod.PIX]:               null,
  [PaymentMethod.SEPA]:              null,
  [PaymentMethod.ACH]:               null,
  [PaymentMethod.KOYWE]:             null,
};

function mapKycFromCountry(country: { isLightKycAllowed: boolean },): KycRequirement {
  return country.isLightKycAllowed ? KycRequirement.BASIC : KycRequirement.DOCUMENT_BASED;
}

const chainIdToTransakNetworkKey: Record<SupportedChainId, string | undefined> = { [zksync.id]: "zksync", };

@Injectable()
export class TransakProvider implements IProvider {
  readonly meta = {
    key: "transak",
    type: QuoteProviderType.ONRAMP,
    name: "Transak",
    iconUrl: "https://assets.transak.com/images/ui/favicon.png",
  };

  private readonly logger = new Logger(TransakProvider.name,);
  private isProviderInstalled = false;

  private readonly getCountriesData: TimedCache<TransakCountriesResponse>;
  private readonly getCryptoCurrenciesData: TimedCache<TransakCryptoCurrenciesResponse>;
  private readonly getAvailableKycMethods: TimedCache<KycRequirement[]>;

  private readonly keys: Record<TransakEnvironment, { apiKey: string, secretKey: string, }>;
  private readonly accessTokenCache: Record<TransakEnvironment, TimedCache<string>>;

  constructor(
    configService: ConfigService,
    private readonly providerRepository: ProviderRepository,
    private readonly tokens: TokensService,
    private readonly supportedTokenRepository: SupportedTokenRepository,
    private readonly supportedCountryRepository: SupportedCountryRepository,
    private readonly supportedKycRepository: SupportedKycRepository,
  ) {
    this.keys = {
      production: {
        apiKey: configService.get<string>("transak.production.apiKey",),
        secretKey: configService.get<string>("transak.production.secretKey",),
      },
      staging: {
        apiKey: configService.get<string>("transak.staging.apiKey",),
        secretKey: configService.get<string>("transak.staging.secretKey",),
      },
    };
    for (const environment in this.keys) {
      if (!this.keys[environment].apiKey || !this.keys[environment].secretKey) {
        throw new Error(`Transak ${environment} environment API key or Secret key is not set`,);
      }
    }
    
    this.getCountriesData = new TimedCache(
      this._getCountriesData.bind(this,),
      1 * 60 * 60 * 1000, // 1 hour
    );
    this.getCryptoCurrenciesData = new TimedCache(
      this._getCryptoCurrenciesData.bind(this,),
      1 * 60 * 60 * 1000, // 1 hour
    );
    this.getAvailableKycMethods = new TimedCache(
      this._getAvailableKycMethods.bind(this,),
      5 * 60 * 1000, // 5 min
    );
    this.accessTokenCache = {
      production: new TimedCache(() => this.fetchAccessToken("production",), 0,),
      staging: new TimedCache(() => this.fetchAccessToken("staging",), 0,),
    };
  }

  private async installProvider(): Promise<void> {
    if (this.isProviderInstalled) return;
    await this.providerRepository.findOrCreate(this.meta,);
    this.isProviderInstalled = true;
  }

  private async _getCountriesData() {
    const response = await $fetch<TransakApiResponse<TransakCountriesResponse>>(`${TransakApiEndpoint()}/v2/countries`,);
    return response.response;
  }

  private async _getCryptoCurrenciesData() {
    const response = await $fetch<TransakApiResponse<TransakCryptoCurrenciesResponse>>(`${TransakApiEndpoint()}/v2/currencies/crypto-currencies`,);
    return response.response;
  }

  private async _getAvailableKycMethods() {
    const availableKyc = await this.supportedKycRepository.find({ where: { providerKey: this.meta.key, }, },);
    return availableKyc.map((e,) => e.kycLevel,);
  }

  async syncRoutes(): Promise<void> {
    await this.installProvider();

    const [ countries, cryptos, ] = await Promise.all([
      this.getCountriesData.execute(),
      this.getCryptoCurrenciesData.execute(),
    ],);

    const provider = await this.providerRepository.findOne({
      where: { key: this.meta.key, },
      relations: [
        "supportedTokens",
        "supportedTokens.token",
        "supportedCountries",
        "supportedKyc",
      ],
    },);

    /* Countries */
    const newSupportedCountries: string[] = countries
      .filter((c,) => c.isAllowed,)
      .map((c,) => c.alpha2.toUpperCase(),);
    const currentCountries = provider.supportedCountries;
    const toDeleteCountries = currentCountries.filter(
      (c,) => !newSupportedCountries.includes(c.countryCode,),
    );
    const toAddCountries = newSupportedCountries.filter(
      (alpha2,) => !currentCountries.some((c,) => c.countryCode === alpha2,),
    );
    if (toDeleteCountries.length) {
      await this.supportedCountryRepository
        .createQueryBuilder("sc",)
        .delete()
        .where("sc.id IN (:...ids)", { ids: toDeleteCountries.map((x,) => x.id,), },)
        .execute();
    }
    if (toAddCountries.length) {
      await this.supportedCountryRepository.addMany(
        toAddCountries.map((countryCode,) => ({
          providerKey: this.meta.key,
          countryCode,
        }),),
      );
    }

    /* KYC */
    const newSupportedKyc = new Set<KycRequirement>();
    for (const c of countries) {
      if (!c.isAllowed) continue;
      const kyc = mapKycFromCountry(c,);
      if (!kyc) continue;
      newSupportedKyc.add(mapKycFromCountry(c,),);
    }
    const currentKyc = provider.supportedKyc;
    const toDeleteKyc = currentKyc.filter(
      (k,) => !newSupportedKyc.has(k.kycLevel,),
    );
    const toAddKyc = Array.from(newSupportedKyc,).filter(
      (kycLevel,) => !currentKyc.some((ck,) => ck.kycLevel === kycLevel,),
    );
    if (toDeleteKyc.length) {
      await this.supportedKycRepository
        .createQueryBuilder("sk",)
        .delete()
        .where("sk.id IN (:...ids)", { ids: toDeleteKyc.map((x,) => x.id,), },)
        .execute();
    }
    if (toAddKyc.length) {
      await this.supportedKycRepository.addMany(
        toAddKyc.map((kycLevel,) => ({
          providerKey: this.meta.key,
          kycLevel,
        }),),
      );
    }

    /* Supported tokens */
    const newSupportedTokenIds = new Set<number>();
    for (const crypto of cryptos) {
      if (!crypto.isAllowed) continue;
      const chainId = parseInt(crypto.network.chainId, 10,);
      if (!isChainIdSupported(chainId,)) continue;
      if (crypto.coinId === "ethereum") crypto.address = l2BaseTokenAddress; // address field is null for `ETHzksync`

      let address = getAddress(crypto.address.toLowerCase(),);
      if (address === legacyEthAddress) address = getAddress(l2BaseTokenAddress,);

      const token = await this.tokens.findOneBy({
        chainId,
        address,
      },);
      if (!token) {
        this.logger.warn(
          `Token ${crypto.symbol} at chainId ${chainId} not found in local DB. Skipping.`,
        );
        continue;
      }

      newSupportedTokenIds.add(token.id,);
    }
    const currentSupportedBuyTokens = provider.supportedTokens.filter(
      (t,) => t.type === RouteType.BUY,
    );
    const toDeleteTokens = currentSupportedBuyTokens.filter(
      (t,) => !newSupportedTokenIds.has(t.token.id,),
    );
    if (toDeleteTokens.length) {
      await this.supportedTokenRepository
        .createQueryBuilder("st",)
        .delete()
        .where("st.id IN (:...ids)", { ids: toDeleteTokens.map((x,) => x.id,), },)
        .execute();
    }
    const toAddTokens = Array.from(newSupportedTokenIds,).filter(
      (id,) => !currentSupportedBuyTokens.some((x,) => x.token.id === id,),
    );
    if (toAddTokens.length) {
      await this.supportedTokenRepository.addMany(
        toAddTokens.map((tokenId,) => ({
          providerKey: this.meta.key,
          tokenId,
          type: RouteType.BUY,
        }),),
      );
    }
  }

  async getQuote(options: QuoteOptions,): Promise<ProviderQuoteDto[]> {
    const chain = supportedChains.find((c,) => c.id === options.chainId,)!;
    const networkKey = chainIdToTransakNetworkKey[chain.id];
    if (!networkKey) {
      this.logger.warn(`Chain ${chain.id} not mapped to Transak’s network`,);
      return [];
    }

    const kycMethods = await this.getAvailableKycMethods.execute();
    const quotes: ProviderQuoteDto[] = [];

    for (const pm of options.paymentMethods) {
      const transakPaymentMethod = paymentMethodMap[pm];
      if (!transakPaymentMethod) continue;

      const quoteQuery = {
        partnerApiKey: options.dev ? this.keys.staging.apiKey : this.keys.production.apiKey,
        fiatCurrency: options.fiatCurrency,
        fiatAmount: String(options.fiatAmount,),
        cryptoCurrency: options.token.symbol,
        isBuyOrSell: options.routeType === RouteType.BUY ? "BUY" : "SELL",
        network: networkKey,
        paymentMethod: transakPaymentMethod,
        quoteCountryCode: options.country,
      };
      const quoteLink = `${TransakApiEndpoint()}/v1/pricing/public/quotes?${new URLSearchParams(quoteQuery,)}`;
      const quote: TransakQuoteResponse | null = await $fetch(quoteLink,)
        .then((res,) => res.response,)
        .catch((err,) => {
          this.logger.error(`Failed to fetch quote from ${this.meta.name} for ${quoteLink}: ${err}`,);
          return null;
        },);
      if (!quote) continue;

      const onrampQuery = {
        apiKey: quoteQuery.partnerApiKey,
        productsAvailed: quoteQuery.isBuyOrSell,
        defaultPaymentMethod: quoteQuery.paymentMethod,
        walletAddress: options.to,
        defaultFiatCurrency: quoteQuery.fiatCurrency,
        defaultFiatAmount: quoteQuery.fiatAmount,
        cryptoCurrencyCode: options.token.symbol,
        network: quoteQuery.network,
      };
      
      const onrampStep: QuoteStepOnrampViaLink = {
        type: "onramp_via_link",
        link: `${getTransakBaseUrl(options.dev,)}?${new URLSearchParams(onrampQuery,)}`,
      };
      const amountUnits = parseUnits(String(quote.cryptoAmount,), options.token.decimals,).toString();
      const amountFiat = quote.cryptoAmount * options.token.usdPrice;

      const quoteDto: ProviderQuoteDto = {
        type: options.routeType,
        provider: this.meta,
        pay: {
          currency: options.fiatCurrency,
          fiatAmount: options.fiatAmount,
          totalFeeFiat: quote.totalFee,
        },
        receive: {
          token: {
            address: options.token.address,
            symbol: options.token.symbol,
            name: options.token.name,
            decimals: options.token.decimals,
          },
          chain: {
            id: chain.id,
            name: chain.name,
          },
          to: options.to,
          amountUnits: amountUnits,
          amountFiat,
        },
        paymentMethods: [pm,],
        kyc: kycMethods,
        steps: [onrampStep,],
        country: options.country,
      };

      quotes.push(quoteDto,);
    }

    return quotes;
  }

  private async fetchAccessToken(env: TransakEnvironment,): Promise<string> {
    const dev = env === "staging" ? true : false;
    const { apiKey, secretKey, } = this.keys[env];
  
    try {
      const response = await $fetch<{ data: { accessToken: string, expiresAt: number } }>(
        `${TransakApiEndpoint(dev,)}/partners/api/v2/refresh-token`,
        {
          method: "POST",
          headers: { "api-secret": secretKey, },
          body: { apiKey, },
        },
      );
  
      const { accessToken, expiresAt, } = response.data;
      const ttl = (expiresAt * 1000) - Date.now() - 5000; // 5s early buffer
  
      // Set the new TTL for the cache
      this.accessTokenCache[env].updateTtl(ttl,);
  
      return accessToken;
    } catch (err) {
      this.logger.error(`Failed to fetch Transak access token (${env}): ${err}`,);
      throw err;
    }
  }

  async getOrderStatus(orderId: string, options: { dev?: boolean } = {},): Promise<OrderStatusResponse> {
    const env = options.dev ? "staging" : "production";
    const accessToken = await this.accessTokenCache[env].execute();
  
    try {
      const response: TransakApiOrderStatusResponse = await $fetch(
        `${TransakApiEndpoint(options.dev,)}/v2/order/${orderId}`,
        { headers: { "access-token": accessToken, }, },
      );
      const lastStatusMessage: string | undefined = response.data.statusHistories[response.data.statusHistories.length - 1].message;
      const includeMessageOnStatus: OrderStatusResponse["status"][] = ["FAILED",];
      
      return {
        status: response.data.status,
        statusMessage: includeMessageOnStatus.includes(response.data.status,) ? lastStatusMessage : undefined,
        isBuyOrSell: response.data.isBuyOrSell,
        fiatCurrency: response.data.fiatCurrency,
        fiatAmount: response.data.fiatAmount,
        amountPaid: response.data.amountPaid,
        cryptoCurrency: response.data.cryptoCurrency,
        cryptoAmount: response.data.cryptoAmount,
        conversionPrice: response.data.conversionPrice,
        totalFeeInFiat: response.data.totalFeeInFiat,
        network: response.data.network,
        autoExpiresAt: response.data.autoExpiresAt,
        createdAt: response.data.statusHistories[0].createdAt,
        completedAt: response.data.completedAt,
      };
    } catch (error) {
      if (error instanceof FetchError) {
        if (error.response.status === 404) {
          throw new NotFoundException(`Order with ID ${orderId} not found on Transak`,);
        }
      }
      throw error;
    }
  }
}