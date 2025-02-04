import {
  isChainIdSupported, SupportedChainId, supportedChains, 
} from "@app/common/chains";
import {
  ProviderQuoteDto, QuoteOptions, QuoteStepOnrampViaLink, 
} from "@app/common/quotes";
import {
  PaymentMethod, QuoteProviderType,
  RouteType, 
} from "@app/db/enums";
import {
  ProviderRepository, SupportedTokenRepository, TokenRepository, 
} from "@app/db/repositories";
import { Injectable, } from "@nestjs/common";
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

enum ApiEndpoint {
  BLOCKCHAINS = "https://api.kado.money/v1/ramp/blockchains", // has data about available chains and tokens
  QUOTE = "https://api.kado.money/v2/ramp/quote",
}

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

  private isProviderInstalled = false;

  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly supportedTokenRepository: SupportedTokenRepository,
  ) {}

  private async installProvider(): Promise<void> {
    if (this.isProviderInstalled) return;
    await this.providerRepository.findOrCreate(this.meta,);
    this.isProviderInstalled = true;
  }

  async syncRoutes(): Promise<void> {
    await this.installProvider();
    
    const response = await $fetch<KadoApiResponse<{ blockchains: Blockchain[] }>>(ApiEndpoint.BLOCKCHAINS,);
    if (!response.success) {
      throw new Error(`Failed to fetch ${this.meta.key} blockchains. Message: ${response.message}`,);
    }

    const supportedChains = response.data.blockchains
      .filter((blockchain,) => isChainIdSupported(blockchain.officialId,),)
      .map((blockchain,) => ({
        ...blockchain,
        associatedAssets: blockchain.associatedAssets.filter((asset,) => asset.address,),
      }),);
    
    const promises = supportedChains.flatMap((blockchain,) => {
      return blockchain.associatedAssets.flatMap(async (asset,) => {
        // Process token and supported payment methods
        if (!asset.rampProducts.some((product,) => product === "buy",)) {
          return;
        }

        const address = getAddress(asset.address.toLowerCase(),);
        const chainId = parseInt(blockchain.officialId,);
        const token = await this.tokenRepository.findOrCreate({ address, chainId, },);
        
        await this.supportedTokenRepository.upsert({
          providerKey: this.meta.key,
          tokenId: token.id,
          type: RouteType.BUY,
        },);
      },);
    },);

    await Promise.all(promises,);
  }

  async getQuote(options: QuoteOptions,): Promise<ProviderQuoteDto[]> {
    const token = await this.tokenRepository.findOneBy({ address: getAddress(options.token,), },);
    if (!token) return [];

    const chain = supportedChains.find((chain,) => chain.id === options.chainId,)!;

    const response = await $fetch<KadoApiResponse<{
      quote: Quote;
      quotes: Quotes;
      request: RequestDetails
    }>>(ApiEndpoint.QUOTE, {
      query: {
        transactionType: RouteType.BUY,
        amount: options.fiatAmount,
        asset: token.symbol,
        blockchain: chainIdToKadoChainKey[chain.id],
        country: options.country,
        fiatMethod: Object.keys(paymentMethods,)[0],
        currency: options.fiatCurrency,
      },
    },).catch((error,) => {
      if (error instanceof FetchError && error.response.status === 400) {
        const response = error.response as unknown as KadoApiResponse<null>;
        return {
          data: null,
          success: false,
          message: response.message,
        } as KadoApiResponse<null>;
      }
      throw error;
    },);

    if (!response.success) {
      console.warn(`Failed to get quote from ${this.meta.key}. Message: ${response.message}`,);
      return [];
    }

    const baseData = {
      provider: this.meta,
      token,
      chain: {
        id: chain.id,
        name: chain.name,
      },
      country: options.country,
      currency: response.data.request.currency,
      amount: response.data.request.amount,
    };

    const quotes: ProviderQuoteDto[] = [];

    Object.entries(response.data.quotes,).forEach(([ _key, quote, ],) => {
      const paymentMethod = _key as KadoPaymentMethod;
      const mappedPaymentMethod = paymentMethods[paymentMethod];
      if (!options.paymentMethods.includes(mappedPaymentMethod,)) return;

      const paymentLink = new URL("https://app.kado.money",);
      paymentLink.searchParams.set("onPayAmount", baseData.amount.toString(),);
      paymentLink.searchParams.set("onPayCurrency", baseData.currency,);
      paymentLink.searchParams.set("onRevCurrency", token.symbol,);
      paymentLink.searchParams.set("cryptoList", token.symbol,);
      paymentLink.searchParams.set("onToAddress", options.to,);
      paymentLink.searchParams.set("network", chainIdToKadoChainKey[chain.id],);
      paymentLink.searchParams.set("networkList", chainIdToKadoChainKey[chain.id],);
      paymentLink.searchParams.set("product", RouteType.BUY,);
      paymentLink.searchParams.set("productList", RouteType.BUY,);
      paymentLink.searchParams.set("mode", "minimal",);

      const onrampViaLinkStep: QuoteStepOnrampViaLink = {
        type: "onramp_via_link",
        link: paymentLink.href,
      };

      quotes.push({
        type: RouteType.BUY,
        provider: baseData.provider,
        pay: {
          currency: baseData.currency,
          amount: baseData.amount,
          totalFeeUsd: quote.totalFee.amount,
          minAmountUsd: quote.minValue.amount,
          maxAmountUsd: quote.maxValue.amount,
        },
        receive: {
          token: baseData.token,
          chain: baseData.chain,
          amountUnits: parseUnits(quote.receive.unitCount.toString(), baseData.token.decimals,).toString(),
          amountUsd: quote.receive.amount,
        },
        steps: [onrampViaLinkStep,],
        paymentMethods: mappedPaymentMethod ? [mappedPaymentMethod,] : [],
        kyc: [], // TODO: map kyc requirements (available in BLOCKCHAINS endpoint)
        country: baseData.country,
      },);
    },);

    return quotes;
  }
}