import type { ProviderQuoteDto, QuoteOptions, } from "@app/common/quotes";
import type { QuoteProviderType, } from "@app/db/enums";

export interface IProvider {
  readonly meta: {
    key: string;
    type: QuoteProviderType;
    name: string;
    iconUrl: string;
  };

  syncRoutes(): Promise<void>;
  getQuote(options: QuoteOptions): Promise<ProviderQuoteDto[]>;
}