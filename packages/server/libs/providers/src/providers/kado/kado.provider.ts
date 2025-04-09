import {
  isChainIdSupported, SupportedChainId, supportedChains,
} from "@app/common/chains";
import {
  ProviderQuoteDto, QuoteOptions, QuoteStepOnrampViaLink,
} from "@app/common/quotes";
import { TimedCache, } from "@app/common/utils/timed-cache";
import {
  KycRequirement,
  PaymentMethod, QuoteProviderType,
  RouteType,
} from "@app/db/enums";
import {
  ProviderRepository, SupportedCountryRepository, SupportedKycRepository, SupportedTokenRepository,
} from "@app/db/repositories";
import { TokensService, } from "@app/tokens";
import { Injectable, Logger, } from "@nestjs/common";
import { ConfigService, } from "@nestjs/config";
import { $fetch, } from "ofetch";
import { getAddress, parseUnits, } from "viem";
import { zksync, } from "viem/chains";
import { l2BaseTokenAddress, legacyEthAddress, } from "viem/zksync";

import { IProvider, } from "../../provider.interface";
import {
  Blockchain, Config, KadoApiResponse,
  KYCLevel,
  PaymentMethod as KadoPaymentMethod,
  Quote,
  Quotes,
  RequestDetails,
} from "./types";

const ApiEndpoint = (dev = false,) => {
  const baseURL = dev ? "https://test-api.kado.money" : "https://api.kado.money";
  return {
    BLOCKCHAINS: `${baseURL}/v1/ramp/blockchains`, // has data about available chains and tokens
    CONFIG: `${baseURL}/v2/public/config`, // has data about supported countries and payment methods
    QUOTE: `${baseURL}/v2/ramp/quote`,
  };
};

const chainIdToKadoChainKey: Record<SupportedChainId, string> = { [zksync.id]: "zksync", };

// set null if you want to explicitly not map a payment method (it will not exclude the quote, just not show the payment method)
const paymentMethods: Record<KadoPaymentMethod, PaymentMethod | null> = {
  credit_card: PaymentMethod.CREDIT_CARD,
  apple_pay_credit: PaymentMethod.APPLE_PAY_CREDIT,
  google_pay_credit: PaymentMethod.GOOGLE_PAY_CREDIT,
  debit_card: PaymentMethod.DEBIT_CARD,
  apple_pay_debit: PaymentMethod.APPLE_PAY_DEBIT,
  google_pay_debit: PaymentMethod.GOOGLE_PAY_DEBIT,
  wire: PaymentMethod.WIRE,
  pix: PaymentMethod.PIX,
  sepa: PaymentMethod.SEPA,
  ach: PaymentMethod.ACH,
  koywe: PaymentMethod.KOYWE,
};
const kycRequirements: Record<KYCLevel, KycRequirement | null> = {
  L0: KycRequirement.NO_KYC,
  L1: KycRequirement.BASIC,
  "L1.5": KycRequirement.DOCUMENT_BASED,
  L2: KycRequirement.DOCUMENT_BASED,
};

@Injectable()
export class KadoProvider implements IProvider {
  readonly meta = {
    key: "kado",
    type: QuoteProviderType.ONRAMP,
    name: "Kado.money",
    iconUrl: "https://kado.money/favicon.ico",
  };

  private readonly logger: Logger;
  private isProviderInstalled = false;
  private readonly getChainsData: TimedCache<Blockchain[]>;
  private readonly getConfigData: TimedCache<Config>;
  private readonly apiKey: string | undefined;

  constructor(
    configService: ConfigService,
    private readonly providerRepository: ProviderRepository,
    private readonly tokens: TokensService,
    private readonly supportedTokenRepository: SupportedTokenRepository,
    private readonly supportedCountryRepository: SupportedCountryRepository,
    private readonly supportedKycRepository: SupportedKycRepository,
  ) {
    this.logger = new Logger(KadoProvider.name,);
    this.apiKey = configService.get<string | undefined>("kadoApiKey",);

    this.getChainsData = new TimedCache(
      this._getChainsData.bind(this,),
      1 * 60 * 60 * 1000, // 1 hour
    );
    this.getConfigData = new TimedCache(
      this._getConfigData.bind(this,),
      1 * 60 * 60 * 1000, // 1 hour
    );
  }

  private async installProvider(): Promise<void> {
    if (this.isProviderInstalled) return;
    await this.providerRepository.findOrCreate(this.meta,);
    this.isProviderInstalled = true;
  }

  private async _getChainsData(): Promise<Blockchain[]> {
    const response = await $fetch<KadoApiResponse<{ blockchains: Blockchain[] }>>(ApiEndpoint().BLOCKCHAINS,);
    if (!response.success) {
      throw new Error(`Failed to fetch ${this.meta.key} blockchains. Message: ${response.message}`,);
    }
    return response.data.blockchains;
  }

  private async _getConfigData(): Promise<Config> {
    const response = await $fetch<KadoApiResponse<Config>>(ApiEndpoint().CONFIG,);
    if (!response.success) {
      throw new Error(`Failed to fetch ${this.meta.key} config. Message: ${response.message}`,);
    }
    return response.data;
  }

  async syncRoutes(): Promise<void> {
    await this.installProvider();

    const [ config, blockchains, ] = await Promise.all([
      this.getConfigData.execute(),
      this.getChainsData.execute(),
    ],);

    const supportedChains = blockchains
      .filter((blockchain,) => isChainIdSupported(blockchain.officialId,),)
      .map((blockchain,) => ({
        ...blockchain,
        // Remove invalid assets
        associatedAssets: blockchain.associatedAssets.filter((asset,) => asset.address,),
      }),);

    const provider = await this.providerRepository.findOne({
      where: { key: this.meta.key, },
      relations: [
        "supportedTokens",
        "supportedTokens.token",
        "supportedCountries",
        "supportedKyc",
      ],
    },);
    const newSupportedTokenIds = new Set<number>();
    const newSupportedKyc = new Set<KycRequirement>();
    await Promise.all(supportedChains.flatMap((blockchain,) => {
      return blockchain.associatedAssets.flatMap(async (asset,) => {
        if (!asset.rampProducts.some((product,) => product === "buy",)) {
          return;
        }

        let address = getAddress(asset.address.toLowerCase(),);
        if (address === legacyEthAddress) address = getAddress(l2BaseTokenAddress,);
        const chainId = parseInt(blockchain.officialId,);

        const token = await this.tokens.findOneBy({ address, chainId, },);

        if (!token) {
          this.logger.warn(`Token "${asset.symbol}" ${address} at chainId ${chainId} not found for ${this.meta.name} route`,);
          return;
        }

        newSupportedTokenIds.add(token.id,);
        asset.kycLevels.forEach((kycLevel,) => {
          if (!kycRequirements[kycLevel]) {
            this.logger.warn(`Unknown kyc level ${kycLevel} for token ${token.symbol}`,);
            return;
          }
          newSupportedKyc.add(kycRequirements[kycLevel],);
        },);
      },);
    },),);

    /* Process supported tokens */
    const currentSupportedBuyTokens = provider.supportedTokens.filter((supportedToken,) => supportedToken.type === RouteType.BUY,);
    const supportedTokensToDelete = currentSupportedBuyTokens
      .filter((supportedToken,) => !newSupportedTokenIds.has(supportedToken.token.id,),);
    const supportedTokensIdsToAdd = Array.from(newSupportedTokenIds,)
      .filter((tokenId,) => !currentSupportedBuyTokens.some((supportedToken,) => supportedToken.token.id === tokenId,),);
    if (supportedTokensToDelete.length) {
      await this.supportedTokenRepository.createQueryBuilder("supportedToken",)
        .delete()
        .where("id IN (:...ids)", { ids: supportedTokensToDelete.map((e,) => e.id,), },)
        .execute();
    }
    if (supportedTokensIdsToAdd.length) {
      await this.supportedTokenRepository.addMany(supportedTokensIdsToAdd.map((tokenId,) => ({
        providerKey: this.meta.key,
        tokenId,
        type: RouteType.BUY,
      }),),);
    }

    /* Process supported KYC */
    const currentSupportedKyc = provider.supportedKyc;
    const supportedKycToDelete = currentSupportedKyc
      .filter((supportedKyc,) => !newSupportedKyc.has(supportedKyc.kycLevel,),);
    const supportedKycToAdd = Array.from(newSupportedKyc,)
      .filter((kycLevel,) => !currentSupportedKyc.some((supportedKyc,) => supportedKyc.kycLevel === kycLevel,),);
    if (supportedKycToDelete.length) {
      await this.supportedKycRepository.createQueryBuilder("supportedKyc",)
        .delete()
        .where("id IN (:...ids)", { ids: supportedKycToDelete.map((e,) => e.id,), },)
        .execute();
    }
    if (supportedKycToAdd.length) {
      await this.supportedKycRepository.addMany(supportedKycToAdd.map((kycLevel,) => ({
        providerKey: this.meta.key,
        kycLevel,
      }),),);
    }

    /* Process supported countries */
    const currentSupportedCountries = provider.supportedCountries;
    const newSupportedCountries = config.countries
      .filter((country,) => !country.disabled,)
      .map((country,) => country.code,);
    const supportedCountriesToDelete = currentSupportedCountries
      .filter((supportedCountry,) => !newSupportedCountries.includes(supportedCountry.countryCode,),);
    const supportedCountriesToAdd = newSupportedCountries
      .filter((countryCode,) => !currentSupportedCountries.some((supportedCountry,) => supportedCountry.countryCode === countryCode,),);
    if (supportedCountriesToDelete.length) {
      await this.supportedCountryRepository.createQueryBuilder("supportedCountry",)
        .delete()
        .where("id IN (:...ids)", { ids: supportedCountriesToDelete.map((e,) => e.id,), },)
        .execute();
    }
    if (supportedCountriesToAdd.length) {
      this.supportedCountryRepository.addMany(supportedCountriesToAdd.map((countryCode,) => ({
        providerKey: this.meta.key,
        countryCode,
      }),),);
    }
  }

  async getQuote(options: QuoteOptions,): Promise<ProviderQuoteDto[]> {
    const chain = supportedChains.find((chain,) => chain.id === options.chainId,)!;

    const query = {
      transactionType: RouteType.BUY,
      amount: options.fiatAmount,
      asset: options.token.symbol,
      blockchain: chainIdToKadoChainKey[chain.id],
      country: options.country,
      fiatMethod: Object.keys(paymentMethods,)[0],
      currency: options.fiatCurrency,
    };

    const url = ApiEndpoint(options.dev,).QUOTE;
    const response: KadoApiResponse<{
      quote: Quote;
      quotes: Quotes;
      request: RequestDetails
    }> = await $fetch(url, { query, },).catch((error,) => {
      return {
        data: null,
        success: false,
        message: (error as any)?.response?._data?.message || (error as any)?.response?.message || error?.message || "Unknown error",
      };
    },);

    if (!response.success) {
      this.logger.error(`Failed to get quote from ${this.meta.name} for ${url}. Error: ${response.message}`,);
      return [];
    }

    const baseData = {
      type: options.routeType,
      provider: this.meta,
      token: options.token,
      chain: {
        id: chain.id,
        name: chain.name,
      },
      to: options.to,
      country: options.country,
      currency: response.data.request.currency,
      amount: response.data.request.amount,
      kadoChainKey: chainIdToKadoChainKey[chain.id],
    };

    const quotes: ProviderQuoteDto[] = [];
    const kycLevels = (await this.supportedKycRepository.find({ where: { providerKey: this.meta.key, }, },))
      .map((e,) => e.kycLevel,);

    /**
     * Response will return a `quote` object based
     * on the default fiatMethod.
     * If there are other available quotes via other methods,
     * they'll be displayed via `quotes`.
    */
    const responseQuotes = {
      ...response.data.quotes ?? {},
      [response.data.request.fiatMethod]: response.data.quote ?? {},
    };

    Object.entries(responseQuotes,).forEach(([ _key, quote, ],) => {
      const paymentMethod = _key as KadoPaymentMethod;
      const mappedPaymentMethod = paymentMethods[paymentMethod];
      if (!options.paymentMethods.includes(mappedPaymentMethod,)) return;

      const serializedQuote: Omit<ProviderQuoteDto, "steps"> = {
        type: baseData.type,
        provider: baseData.provider,
        pay: {
          currency: baseData.currency,
          fiatAmount: baseData.amount,
          totalFeeFiat: quote.totalFee.amount,
          minAmountFiat: quote.minValue.amount,
          maxAmountFiat: quote.maxValue.amount,
        },
        receive: {
          to: baseData.to,
          token: baseData.token,
          chain: baseData.chain,
          amountUnits: parseUnits(quote.receive.unitCount.toString(), baseData.token.decimals,).toString(),
          amountFiat: quote.receive.unitCount * baseData.token.usdPrice,
        },
        paymentMethods: mappedPaymentMethod ? [mappedPaymentMethod,] : [],
        kyc: kycLevels,
        country: baseData.country,
      };

      const paymentLink = options.dev ? new URL("https://sandbox--kado.netlify.app/",) : new URL("https://app.kado.money",);
      if (this.apiKey) paymentLink.searchParams.set("apiKey", this.apiKey,);
      paymentLink.searchParams.set("onPayAmount", serializedQuote.pay.fiatAmount.toString(),);
      paymentLink.searchParams.set("onPayCurrency", serializedQuote.pay.currency,);
      paymentLink.searchParams.set("onRevCurrency", serializedQuote.receive.token.symbol,);
      paymentLink.searchParams.set("cryptoList", serializedQuote.receive.token.symbol,);
      paymentLink.searchParams.set("onToAddress", serializedQuote.receive.to,);
      paymentLink.searchParams.set("network", baseData.kadoChainKey,);
      paymentLink.searchParams.set("networkList", baseData.kadoChainKey,);
      paymentLink.searchParams.set("product", serializedQuote.type,);
      paymentLink.searchParams.set("productList", serializedQuote.type,);
      paymentLink.searchParams.set("mode", "minimal",);

      const onrampViaLinkStep: QuoteStepOnrampViaLink = {
        type: "onramp_via_link",
        link: paymentLink.href,
      };

      quotes.push({
        ...serializedQuote,
        steps: [onrampViaLinkStep,],
      },);
    },);

    // Combine results if link is the same. In that case combine payment types and kyc.
    // For pay/receive amounts, take the best "receive" option
    const getOnrampStep = (quote: ProviderQuoteDto,) => {
      const onrampStep = quote.steps.find((e,) => e.type === "onramp_via_link",)!;
      return onrampStep;
    };

    // Combine results if link is the same. In that case combine payment types and kyc.
    // For pay/receive amounts, take the best "receive" option
    const combinedQuotes = quotes.reduce((acc, quote,) => {
      const existing = acc.find((existingQuote,) => getOnrampStep(existingQuote,).link === getOnrampStep(quote,).link,);
      if (!existing) return [ ...acc, quote, ];

      existing.paymentMethods = Array.from(new Set([ ...existing.paymentMethods, ...quote.paymentMethods, ],),);
      existing.kyc = Array.from(new Set([ ...existing.kyc, ...quote.kyc, ],),);
      if (quote.receive.amountFiat > existing.receive.amountFiat) {
        existing.receive = quote.receive;
        existing.pay = quote.pay;
        existing.steps = quote.steps;
      }

      return acc;
    }, [] as ProviderQuoteDto[],);

    return combinedQuotes;
  }
}
