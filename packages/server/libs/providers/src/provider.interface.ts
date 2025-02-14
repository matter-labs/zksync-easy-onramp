import type { ProviderQuoteDto, QuoteOptions, } from "@app/common/quotes";
import type { Token, } from "@app/db/entities";
import type { QuoteProviderType, } from "@app/db/enums";

export interface IProvider {
  readonly meta: {
    key: string;
    type: QuoteProviderType;
    name: string;
    iconUrl: string;
  };

  syncRoutes(): Promise<void>;
  getQuote(options: QuoteOptions, token: Token): Promise<ProviderQuoteDto[]>;
}