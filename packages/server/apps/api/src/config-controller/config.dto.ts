import type { FiatCurrency, } from "@app/common/currencies";
import type { Token, } from "@app/db/entities";
import type { QuoteProviderType, RouteType, } from "@app/db/enums";

export class ConfigResponseDto {
  tokens: Omit<Token, "id" | "createdAt" | "updatedAt">[];
  fiatCurrencies: FiatCurrency[];
  chains: {
    id: number;
    name: string;
  }[];
  providers: {
    key: string;
    type: QuoteProviderType;
    name: string;
    iconUrl: string;
    tokens: {
      type: RouteType;
      token: Omit<Token, "id" | "createdAt" | "updatedAt">;
    }[]
  }[];
}
