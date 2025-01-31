import { Provider, } from "@app/db/entities";
import { QuoteProviderType, } from "@app/db/enums";
import { ProviderRepository, TokenRepository, } from "@app/db/repositories";
import { Injectable, } from "@nestjs/common";
import { In, } from "typeorm";
import { formatUnits, parseUnits, } from "viem";

import {
  ProviderQuoteDto, QuoteOptionsDto, QuoteResponseDto, 
} from "./quote.dto";

@Injectable()
export class QuoteService {
  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly tokenRepository: TokenRepository,
  ) {}

  async getQuotes(options: QuoteOptionsDto,): Promise<QuoteResponseDto> {
    const token = await this.tokenRepository.findOne({
      where: {
        address: options.token,
        chainId: options.chainId,
      },
    },);
    if (!token) return { quotes: [], };
  
    try {
      const amountWei = parseUnits(options.amount, token.decimals,);
      
      const providers = await this.providerRepository.find({
        where: options.providerTypes?.length ? { type: In(options.providerTypes,), } : undefined,
        relations: [
          "supportedTokens",
          "supportedTokens.token",
          "paymentOptions", 
        ],
      },);
  
      const quotes: ProviderQuoteDto[] = [];
  
      for (const provider of providers) {
        try {
          const quote = await this.processProvider(
            provider,
            options,
            amountWei,
            token.decimals,
          );
          if (quote) quotes.push(quote,);
        } catch (error) {
          console.error(`Error processing provider ${provider.key}:`, error,);
        }
      }
  
      return { quotes, };
    } catch (error) {
      console.error("Error parsing amount:", error,);
      return { quotes: [], };
    }
  }  

  private async processProvider(
    provider: Provider,
    options: QuoteOptionsDto,
    amountWei: bigint,
    tokenDecimals: number,
  ): Promise<ProviderQuoteDto | null> {
    // Check token support using the actual token
    const supportedToken = provider.supportedTokens.find((st,) =>
      st.token.address === options.token &&
      st.token.chainId === options.chainId &&
      (!st.countryCode || st.countryCode === options.country),
    );  

    if (!supportedToken) return null;

    // Check payment options for onramp providers
    if (provider.type === QuoteProviderType.ONRAMP && options.country) {
      const hasPaymentOption = provider.paymentOptions.some((po,) =>
        po.countryCode === options.country || !po.countryCode,
      );
      if (!hasPaymentOption) return null;
    }

    // Check amount limits
    if (supportedToken.minAmount && amountWei < supportedToken.minAmount) return null;
    if (supportedToken.maxAmount && amountWei > supportedToken.maxAmount) return null;

    // Calculate fees
    const feePercent = supportedToken.feePercent || 0;
    const feeAmount = (amountWei * BigInt(feePercent * 100,)) / BigInt(10000,);
    const receivedAmountWei = amountWei - feeAmount;

    // Format amounts using token decimals
    const format = (value: bigint,) => formatUnits(value, tokenDecimals,);

    return {
      providerKey: provider.key,
      providerName: provider.name,
      providerType: provider.type,
      paymentOptions: provider.paymentOptions
        .filter((po,) => !options.country || !po.countryCode || po.countryCode === options.country,)
        .map((po,) => po.paymentType,),
      feePercent,
      receivedAmount: format(receivedAmountWei,),
      minAmount: supportedToken.minAmount ? format(supportedToken.minAmount,) : undefined,
      maxAmount: supportedToken.maxAmount ? format(supportedToken.maxAmount,) : undefined,
    };
  }
}