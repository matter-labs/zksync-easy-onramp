import { QuoteOptions, QuoteStepTokenSwap, } from "@app/common/quotes";
import { SupportedTokenRepository, } from "@app/db/repositories";
import { ProvidersQuoteService, } from "@app/providers";
import { SwapsService, } from "@app/swaps";
import { getFiatTokenAmount, getTokenAmountFromFiat, } from "@app/tokens/utils";
import { Injectable, } from "@nestjs/common";

@Injectable()
export class QuoteService {
  constructor(
    private readonly swaps: SwapsService,
    private readonly providersQuoteService: ProvidersQuoteService,
    private readonly supportedTokenRepository: SupportedTokenRepository,
  ) {}

  // TODO: handle when token is already available on provider without swap
  async getQuotes(options: QuoteOptions,) {
    await this.providersQuoteService.waitForStateReady();

    // TODO: optimize SQL request to only fetch where token chain id matches, and only take unique tokens
    const supportedTokens = (await this.supportedTokenRepository.find({ relations: ["token",], },))
      .filter((e,) => e.token.chainId === options.chainId,);

    const uniqueTokens = supportedTokens.reduce((acc, item,) => {
      if (!acc.some((e,) => e.tokenId === item.tokenId,)) {
        acc.push(item,);
      }
      return acc;
    }, [] as typeof supportedTokens,);

    const availableSwapRoutes = (await Promise.all(uniqueTokens.map(async ({ token, },) => {
      const initialToken_amountUsd = getFiatTokenAmount(
        options.amount,
        {
          decimals: options.token.decimals,
          price: options.token.usdPrice,
        },
      );
      const swapToken_amount = getTokenAmountFromFiat(
        initialToken_amountUsd,
        {
          decimals: token.decimals,
          price: token.usdPrice,
        },
      );
      console.log({
        options_amount: options.amount,
        options_fiatAmount: options.fiatAmount,
        inital: { token: { ...token, }, amount: initialToken_amountUsd, },
        swap: { token: { ...options.token, }, amount: swapToken_amount, },
      },);
      const swapQuote = await this.swaps.getQuote({
        fromChainId: options.chainId,
        toChainId: options.chainId,
        fromToken: token.address,
        toToken: options.token.address,
        fromAmount: swapToken_amount,
        fromAddress: options.to,
        toAddress: options.to,
      },);
      return {
        token,
        swapQuote,
      };
    },),)).filter((e,) => e.swapQuote,);

    const quotes = (await Promise.all(supportedTokens.map(async (supportedToken,) => {
      const swap = availableSwapRoutes.find((e,) => e.token.id === supportedToken.token.id,);
      if (!swap) return []; // No swap route available

      const quotes = await this.providersQuoteService.getProviderQuotes(
        supportedToken.providerKey,
        {
          ...options,
          token: swap.token, // Use the token from the swap route
        },
      );
      if (!quotes.length) return []; // No onramp quotes available

      const lifiTokenSwapStep: QuoteStepTokenSwap = {
        type: "lifi_token_swap",
        swapQuote: swap.swapQuote,
      };
      
      return quotes.map((quote,) => {
        if (quote.pay.maxAmountUnits && quote.pay.maxAmountFiat) {
          quote.pay.maxAmountUnits = getTokenAmountFromFiat(
            quote.pay.maxAmountFiat,
            {
              decimals: options.token.decimals,
              price: options.token.usdPrice,
            },
          );
        }
        if (quote.pay.minAmountUnits && quote.pay.minAmountFiat) {
          quote.pay.maxAmountUnits = getTokenAmountFromFiat(
            quote.pay.maxAmountFiat,
            {
              decimals: options.token.decimals,
              price: options.token.usdPrice,
            },
          );
        }

        // TODO: finish this. Can't find total fee in usd...
        // quote.pay.totalFeeUsd += swap.swapQuote.estimate.

        const estimateSwapFiatDiffFactor = () => {
          // The best way would be to reestimate the LiFi quote based on onramp amount
          // but that would create way too many requests and take too much time
          // Therefore to estimate final amount we can estimate how much percentage we lose after swap
          // We use percentage because estimated swap amounts are different
          const fromAmountUSD = parseFloat(swap.swapQuote.estimate.fromAmountUSD,);
          const toAmountUSD = parseFloat(swap.swapQuote.estimate.toAmountUSD,);
          const diffFactor = fromAmountUSD / toAmountUSD;
          return diffFactor;
        };
        const swapFiatDiffFactor = estimateSwapFiatDiffFactor();
        quote.receive.token = options.token;
        quote.receive.amountFiat = quote.receive.amountFiat * swapFiatDiffFactor;
        quote.receive.amountUnits = getTokenAmountFromFiat(
          quote.receive.amountFiat,
          {
            decimals: options.token.decimals,
            price: options.token.usdPrice,
          },
        );

        quote.steps.push(lifiTokenSwapStep,);

        return quote;
      },);
    },),)).flat();

    // TODO: add smarter sorting (include factors like gas costs, kyc, payment methods, etc.)
    return [...quotes,].sort((a, b,) => b.receive.amountFiat - a.receive.amountFiat,);
  }
}
