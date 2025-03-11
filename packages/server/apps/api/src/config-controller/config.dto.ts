import type { Token, } from "@app/db/entities";
import type { QuoteProviderType, } from "@app/db/enums";

export class ConfigResponseDto {
  tokens: Omit<Token, "id">[];
  chains: {
    id: number;
    name: string;
  }[];
  providers: {
    key: string;
    type: QuoteProviderType;
    name: string;
    iconUrl: string;
  }[];
}
