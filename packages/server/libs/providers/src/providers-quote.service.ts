import { ProviderQuoteDto, QuoteOptionsDto, } from "@app/common/quotes";
import { Injectable, } from "@nestjs/common";

import { ProvidersRegistry, } from "./providers-registry.service";

@Injectable()
export class ProvidersQuoteService {
  constructor(
    private readonly providersRegistry: ProvidersRegistry,
  ) {}

  async getQuotesFromProviders(options: QuoteOptionsDto,): Promise<ProviderQuoteDto[]> {
    const quotes: ProviderQuoteDto[] = (await Promise.all(
      this.providersRegistry.providers.map((provider,) => provider.getQuote(options,),),
    )).flat();
    return quotes;
  };
}