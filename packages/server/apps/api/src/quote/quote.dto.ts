import { QuoteProviderType, } from "@app/db/enums";
import {
  IsArray, IsEnum, IsEthereumAddress, IsInt, IsISO31661Alpha2,IsOptional, IsString, 
} from "class-validator";
import type { Address, } from "viem";

export class QuoteOptionsDto {
  @IsEthereumAddress()
  to: Address;

  @IsInt()
  chainId: number;

  @IsEthereumAddress()
  token: Address;

  @IsString()
  amount: string; // Sent as string to handle big numbers

  @IsOptional()
  @IsArray()
  @IsEnum(QuoteProviderType, { each: true, },)
  providerTypes?: QuoteProviderType[];

  @IsOptional()
  @IsISO31661Alpha2()
  country?: string;
}

export class ProviderQuoteDto {
  providerKey: string;
  providerName: string;
  providerType: QuoteProviderType;
  paymentOptions: string[];
  feePercent: number;
  receivedAmount: string;
  minAmount?: string;
  maxAmount?: string;
}

export class QuoteResponseDto {
  quotes: ProviderQuoteDto[];
}