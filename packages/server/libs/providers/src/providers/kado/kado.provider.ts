import {
  isChainIdSupported, SupportedChainId, supportedChains,
} from "@app/common/chains";
import {
  ProviderQuoteDto, QuoteOptions, QuoteStepOnrampViaLink,
} from "@app/common/quotes";
import { TimedCache, } from "@app/common/utils/timed-cache";
import {
  PaymentMethod, QuoteProviderType,
  RouteType,
} from "@app/db/enums";
import { ProviderRepository, SupportedTokenRepository, } from "@app/db/repositories";
import { TokensService, } from "@app/tokens";
import { Injectable, Logger, } from "@nestjs/common";
import { $fetch, FetchError, } from "ofetch";
import { getAddress, parseUnits, } from "viem";
import { mainnet, } from "viem/chains";
import { zksync, } from "viem/zksync";

import { IProvider, } from "../../provider.interface";
import {
  Blockchain, KadoApiResponse,
  PaymentMethod as KadoPaymentMethod,
  Quote,
  Quotes,
  RequestDetails,
} from "./types";

const ApiEndpoint = (dev = false,) => {
  const baseURL = dev ? "https://test-api.kado.money" : "https://api.kado.money";
  return {
    BLOCKCHAINS: `${baseURL}/v1/ramp/blockchains`, // has data about available chains and tokens
    QUOTE: `${baseURL}/v2/ramp/quote`,
  };
};

const chainIdToKadoChainKey: Record<SupportedChainId, string> = {
  [mainnet.id]: "ethereum",
  [zksync.id]: "zksync",
};

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

  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly tokens: TokensService,
    private readonly supportedTokenRepository: SupportedTokenRepository,
  ) {
    this.logger = new Logger(KadoProvider.name,);

    this.getChainsData = new TimedCache(
      this._getChainsData.bind(this,),
      5 * 60 * 1000, // 5 minutes
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

  async syncRoutes(): Promise<void> {
    await this.installProvider();

    const blockchains = await this.getChainsData.execute();

    const supportedChains = blockchains
      .filter((blockchain,) => isChainIdSupported(blockchain.officialId,),)
      .map((blockchain,) => ({
        ...blockchain,
        // Remove invalid assets
        associatedAssets: blockchain.associatedAssets.filter((asset,) => asset.address,),
      }),);

    // Add new tokens and payment methods to DB
    const promises = supportedChains.flatMap((blockchain,) => {
      return blockchain.associatedAssets.flatMap(async (asset,) => {
        if (!asset.rampProducts.some((product,) => product === "buy",)) {
          return;
        }

        const address = getAddress(asset.address.toLowerCase(),);
        const chainId = parseInt(blockchain.officialId,);

        const token = await this.tokens.findOneBy({ address, chainId, },);

        if (!token) {
          this.logger.warn(`Token "${asset.symbol}" ${address} at chainId ${chainId} not found for route`,);
          return;
        }

        const supportedToken = await this.supportedTokenRepository.findOneBy({
          providerKey: this.meta.key,
          tokenId: token.id,
          type: RouteType.BUY,
        },);
        if (!supportedToken) {
          await this.supportedTokenRepository.add({
            providerKey: this.meta.key,
            tokenId: token.id,
            type: RouteType.BUY,
          },);
        }
      },);
    },);

    await Promise.all(promises,);
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

    const response = await $fetch<KadoApiResponse<{
      quote: Quote;
      quotes: Quotes;
      request: RequestDetails
    }>>(ApiEndpoint(options.dev,).QUOTE, { query, },).catch((error,) => {
      if (error instanceof FetchError && error.response.status === 400) {
        const response = error.response as unknown as KadoApiResponse<null>;
        return {
          data: null,
          success: false,
          message: (response as any)?._data?.message || response.message,
        } as KadoApiResponse<null>;
      }
      throw error;
    },);

    if (!response.success) {
      this.logger.error(`Failed to get quote from ${this.meta.name}. Error message: ${response.message}. Query: ${JSON.stringify(query,)}`,);
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
          totalFeeUsd: quote.totalFee.amount,
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
        kyc: [], // TODO: map kyc requirements (available in BLOCKCHAINS endpoint)
        country: baseData.country,
      };

      const paymentLink = options.dev ? new URL("https://sandbox--kado.netlify.app/",) : new URL("https://app.kado.money",);
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
    const getSwapStep = (quote: ProviderQuoteDto,) => {
      const swapStep = quote.steps.find((e,) => e.type === "onramp_via_link",)!;
      return swapStep;
    };
    const combinedQuotes = quotes.reduce((acc, quote,) => {
      const existing = acc.find((existingQuote,) => getSwapStep(existingQuote,).link === getSwapStep(quote,).link,);
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
