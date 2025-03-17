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
import { Injectable, Logger, } from "@nestjs/common";
import { $fetch, } from "ofetch";
import {
  Address, getAddress, 
} from "viem";
import { mainnet, zksync, } from "viem/chains";
import { l2BaseTokenAddress, legacyEthAddress, } from "viem/zksync";

import { IProvider, } from "../../provider.interface";

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

interface TransakCountriesResponse {
  response: {
    alpha2: string;
    name: string;
    isAllowed: boolean;
    isLightKycAllowed: boolean;
    currencyCode: string;
    supportedDocuments: string[];
  }[];
}

interface TransakCryptoCurrenciesResponse {
  response: {
    _id: string;
    coinId: string;
    symbol: string;
    name: string;
    address: Address;
    isAllowed: boolean;
    network: {
      name: string;
      chainId: string;
    };
  }[];
}

interface TransakQuoteResponse {
  response: {
    quoteId: string;
    conversionPrice: number;
    marketConversionPrice: number;
    slippage: number;
    fiatCurrency: string;
    cryptoCurrency: string;
    paymentMethod: string;
    fiatAmount: number;
    cryptoAmount: number;
    isBuyOrSell: "BUY" | "SELL";
    network: string;
    feeDecimal: number;
    totalFee: number;
    cryptoLiquidityProvider: string;
    notes: string[];
  };
}

const paymentMethodMap: Record<PaymentMethod, string | null> = {
  [PaymentMethod.CREDIT_CARD]:       "credit_debit_card",
  [PaymentMethod.APPLE_PAY_CREDIT]:  "apple_pay",
  [PaymentMethod.GOOGLE_PAY_CREDIT]: "google_pay",
  [PaymentMethod.DEBIT_CARD]:        "credit_debit_card",
  [PaymentMethod.APPLE_PAY_DEBIT]:   "apple_pay",
  [PaymentMethod.GOOGLE_PAY_DEBIT]:  "google_pay",
  [PaymentMethod.WIRE]:              "pm_us_wire_bank_transfer",
  [PaymentMethod.PIX]:               "pm_pix",
  [PaymentMethod.SEPA]:              "sepa_bank_transfer",
  [PaymentMethod.ACH]:               "pm_open_banking",
  [PaymentMethod.KOYWE]:             null,
};

function mapKycFromCountry(country: { isLightKycAllowed: boolean },): KycRequirement {
  return country.isLightKycAllowed ? KycRequirement.BASIC : KycRequirement.DOCUMENT_BASED;
}

const chainIdToTransakNetworkKey: Record<SupportedChainId, string | undefined> = {
  [mainnet.id]: "ethereum",
  [zksync.id]: "zksync",
};

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

  private readonly getCountriesData: TimedCache<TransakCountriesResponse["response"]>;
  private readonly getCryptoCurrenciesData: TimedCache<TransakCryptoCurrenciesResponse["response"]>;

  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly tokens: TokensService,
    private readonly supportedTokenRepository: SupportedTokenRepository,
    private readonly supportedCountryRepository: SupportedCountryRepository,
    private readonly supportedKycRepository: SupportedKycRepository,
  ) {
    this.getCountriesData = new TimedCache(
      this._getCountriesData.bind(this,),
      1 * 60 * 60 * 1000, // 1 hour
    );
    this.getCryptoCurrenciesData = new TimedCache(
      this._getCryptoCurrenciesData.bind(this,),
      1 * 60 * 60 * 1000, // 1 hour
    );
  }

  private async installProvider(): Promise<void> {
    if (this.isProviderInstalled) return;
    await this.providerRepository.findOrCreate(this.meta,);
    this.isProviderInstalled = true;
  }

  private async _getCountriesData() {
    const url = `${TransakApiEndpoint()}/v2/countries`;
    const response = await $fetch<TransakCountriesResponse>(url,);
    return response.response;
  }

  private async _getCryptoCurrenciesData() {
    const url = `${TransakApiEndpoint()}/v2/currencies/crypto-currencies`;
    const response = await $fetch<TransakCryptoCurrenciesResponse>(url,);
    return response.response;
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

    const quotes: ProviderQuoteDto[] = [];

    for (const pm of options.paymentMethods) {
      const transakPaymentMethod = paymentMethodMap[pm];
      if (!transakPaymentMethod) continue;

      const partnerApiKey = process.env.TRANSAK_API_KEY || "YOUR_API_KEY_HERE";

      const baseUrl = getTransakBaseUrl(!!options.dev,);
      const link = new URL(baseUrl,);

      link.searchParams.set("apiKey", partnerApiKey,);

      if (options.routeType === RouteType.BUY) {
        link.searchParams.set("productsAvailed", "BUY",);
      } else if (options.routeType === RouteType.SELL) {
        link.searchParams.set("productsAvailed", "SELL",);
      }

      link.searchParams.set("defaultPaymentMethod", transakPaymentMethod,);
      link.searchParams.set("walletAddress", options.to,);
      link.searchParams.set("defaultFiatCurrency", options.fiatCurrency,);
      link.searchParams.set("defaultFiatAmount", String(options.fiatAmount,),);

      if (options.country) {
        link.searchParams.set("countryCode", options.country,);
      }

      link.searchParams.set("cryptoCurrencyCode", options.token.symbol,);
      link.searchParams.set("network", networkKey,);

      const onrampStep: QuoteStepOnrampViaLink = {
        type: "onramp_via_link",
        link: link.href,
      };

      const quoteDto: ProviderQuoteDto = {
        type: options.routeType,
        provider: this.meta,
        pay: {
          currency: options.fiatCurrency,
          fiatAmount: options.fiatAmount,
          totalFeeUsd: 0, // TODO
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
          amountUnits: cryptoAmountUnits, // TODO
          amountFiat: amountFiatApprox, // TODO
        },
        paymentMethods: [pm,],
        kyc: [ // TODO
          KycRequirement.BASIC,
          KycRequirement.DOCUMENT_BASED,
        ],
        steps: [onrampStep,], // TODO: add swap
        country: options.country,
      };

      quotes.push(quoteDto,);
    }

    return quotes;
  }
}