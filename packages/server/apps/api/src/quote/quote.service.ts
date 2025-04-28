import {
  findBestQuote,
  PaymentMethodQuoteDto,
  ProviderQuoteDto, QuoteOptions, QuoteStepTokenSwap,
} from "@app/common/quotes";
import { SupportedToken, Token, } from "@app/db/entities";
import { PaymentMethod, } from "@app/db/enums";
import { SupportedTokenRepository, } from "@app/db/repositories";
import { ProvidersQuoteService, } from "@app/providers";
import { SwapsService, } from "@app/swaps";
import { getFiatTokenAmount, getTokenAmountFromFiat, } from "@app/tokens/utils";
import { LiFiStep, } from "@lifi/sdk";
import { Injectable, Logger, } from "@nestjs/common";

type SwapRoute = {
  token: Token;
  swapQuote: LiFiStep;
};

@Injectable()
export class QuoteService {
  private readonly logger: Logger;

  constructor(
    private readonly swaps: SwapsService,
    private readonly providersQuoteService: ProvidersQuoteService,
    private readonly supportedTokenRepository: SupportedTokenRepository,
  ) {
    this.logger = new Logger(QuoteService.name,);
  }

  async getQuotes(options: QuoteOptions,) {
    await this.providersQuoteService.waitForStateReady();

    const supportedTokens = await this.getSupportedTokens(options.chainId,);
    const uniqueTokens = this.getUniqueTokens(supportedTokens,);

    const availableSwapRoutes = await this.getAvailableSwapRoutes(
      uniqueTokens,
      options,
    );

    const quotes = await this.getProviderQuotesWithSwaps(
      options.services.length <= 0 ? supportedTokens : supportedTokens.filter((e,) =>
        options.services.includes(e.providerKey as any,),
      ),
      availableSwapRoutes,
      options,
    );

    return quotes.sort((a, b,) => findBestQuote(b.paymentMethods,).receive.amountFiat - findBestQuote(a.paymentMethods,).receive.amountFiat,);
  }

  private async getSupportedTokens(chainId: number,) {
    // TODO: optimize SQL request to only fetch where token chain id matches, and only take unique tokens
    return (await this.supportedTokenRepository.find({ relations: ["token",], },))
      .filter((e,) => e.token.chainId === chainId,);
  }

  private getUniqueTokens(supportedTokens: SupportedToken[],) {
    return supportedTokens.reduce((acc, item,) => {
      if (!acc.some((e,) => e.tokenId === item.tokenId,)) {
        acc.push(item,);
      }
      return acc;
    }, [] as typeof supportedTokens,);
  }

  private async getAvailableSwapRoutes(uniqueTokens: SupportedToken[], options: QuoteOptions,) {
    return (await Promise.all(
      uniqueTokens.map(async ({ token, },) => {
        if (token.address.toLowerCase() === options.token.address.toLowerCase()) {
          return null; // Skip if the token is already the requested one
        }

        const initialToken_amountUsd = getFiatTokenAmount(options.amount, {
          decimals: options.token.decimals,
          price: options.token.usdPrice,
        },);

        const swapToken_amount = getTokenAmountFromFiat(
          options.dev ? 0.25 : initialToken_amountUsd, // $0.25 swap amount for testing purposes in dev mode
          {
            decimals: token.decimals,
            price: token.usdPrice,
          },
        );

        const swapQuote = await this.swaps.getQuote({
          fromChainId: options.chainId,
          toChainId: options.chainId,
          fromToken: token.address,
          toToken: options.token.address,
          fromAmount: swapToken_amount,
          fromAddress: options.to,
          toAddress: options.to,
        },);

        return swapQuote ? { token, swapQuote, } : null;
      },),
    )).filter(Boolean,);
  }

  private async getProviderQuotesWithSwaps(supportedTokens: SupportedToken[], availableSwapRoutes: SwapRoute[], options: QuoteOptions,) {
    const quotesWithSwaps: (ProviderQuoteDto | null)[] = (await Promise.all(
      supportedTokens.map(async (supportedToken,) => {
        const swapNeeded = supportedToken.token.id !== options.token.id;
        const swapRoute = availableSwapRoutes.find((e,) => e.token.id === supportedToken.token.id,);
        if (swapNeeded && !swapRoute) return null; // No swap route available

        const providerQuote: ProviderQuoteDto | null = (await this.providersQuoteService.getProviderQuote(
          supportedToken.providerKey,
          {
            ...options,
            token: swapNeeded ? swapRoute.token : options.token,
          },
        ).catch((err,) => {
          this.logger.error(err,);
          this.logger.error(`Failed to get quotes from provider ${supportedToken.providerKey}`,);
          return null;
        },));
        if (!providerQuote) return null; // No onramp quotes available

        providerQuote.paymentMethods.map((quote,) => {
          if (swapNeeded) {
            return this.processSwapQuote(quote, swapRoute, options,);
          } else {
            return quote;
          }
        },);

        return {
          ...providerQuote,
          paymentMethods: this.sortPaymentMethodQuotes(providerQuote.paymentMethods,),
        };
      },),
    ));

    return quotesWithSwaps.filter(Boolean,);
  }

  private processSwapQuote(quote: PaymentMethodQuoteDto, swapRoute: SwapRoute, options: QuoteOptions,) {
    if (quote.pay.maxAmountUnits && quote.pay.maxAmountFiat) {
      quote.pay.maxAmountUnits = getTokenAmountFromFiat(quote.pay.maxAmountFiat, {
        decimals: options.token.decimals,
        price: options.token.usdPrice,
      },);
    }
    if (quote.pay.minAmountUnits && quote.pay.minAmountFiat) {
      quote.pay.maxAmountUnits = getTokenAmountFromFiat(quote.pay.maxAmountFiat, {
        decimals: options.token.decimals,
        price: options.token.usdPrice,
      },);
    }

    const totalGasCostsUsd = swapRoute.swapQuote.estimate.gasCosts?.reduce(
      (acc, item,) => acc + Number(item.amountUSD,),
      0,
    );
    quote.pay.totalFeeFiat += totalGasCostsUsd;

    const swapFiatDiffFactor = this.estimateSwapFiatDiffFactor(swapRoute, totalGasCostsUsd,);
    quote.receive.token = options.token;
    quote.receive.amountFiat *= swapFiatDiffFactor;
    quote.receive.amountUnits = getTokenAmountFromFiat(quote.receive.amountFiat, {
      decimals: options.token.decimals,
      price: options.token.usdPrice,
    },);

    const swapStep: QuoteStepTokenSwap = {
      type: "lifi_token_swap",
      swapQuote: swapRoute.swapQuote,
    };
    quote.steps.push(swapStep,);

    return quote;
  }

  private estimateSwapFiatDiffFactor(swap: SwapRoute, totalGasCostsUsd: number,) {
    const fromAmountUSD = parseFloat(swap.swapQuote.estimate.fromAmountUSD,);
    const toAmountUSD = parseFloat(swap.swapQuote.estimate.toAmountUSD,) - totalGasCostsUsd;
    if (fromAmountUSD === 0 || toAmountUSD <= 0) return 0;
    return toAmountUSD / fromAmountUSD;
  }

  private sortPaymentMethodQuotes = (paymentMethodQuotes: PaymentMethodQuoteDto[],) => {
    // Sort by the order of PaymentMethod enum
    const AvailablePaymentMethods = Object.values(PaymentMethod,);
    return [...paymentMethodQuotes,].sort((a, b,) => {
      return AvailablePaymentMethods.indexOf(a.method,) - AvailablePaymentMethods.indexOf(b.method,);
    },);
  };
}
