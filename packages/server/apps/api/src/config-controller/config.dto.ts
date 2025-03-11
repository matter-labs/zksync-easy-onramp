import type { Token, } from "@app/db/entities";
import type { QuoteProviderType, } from "@app/db/enums";
import {
  IsIn, IsOptional, IsString,
} from "class-validator";

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

export class ConfigOptionsDto {
  @IsOptional()
  @IsString()
  @IsIn([ "marketCap", "usdPrice", ],)
  tokenSort: "marketCap" | "usdPrice";
}
