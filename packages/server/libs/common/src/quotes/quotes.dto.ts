import {
  KycRequirement, PaymentMethod, QuoteProviderType, RouteType, 
} from "@app/db/enums";
import {
  IsArray, IsEnum, IsEthereumAddress, IsIn, IsInt, IsISO31661Alpha2, IsOptional, IsString,
  MaxLength,
  MinLength, 
} from "class-validator";
import type { Address, } from "viem";

import { supportedChains, } from "../chains";

const supportedChainIds = supportedChains.map((chain,) => chain.id,);

export class QuoteOptionsDto {
  // @IsEthereumAddress()
  // to: Address;

  @IsInt()
  @IsIn(supportedChainIds,)
  chainId: number;

  @IsEthereumAddress()
  token: Address;

  @IsString()
  @MinLength(1,)
  @MaxLength(100,)
  amount: string; // Sent as string to handle big numbers

  @IsOptional()
  @IsArray()
  @MinLength(1,)
  @IsEnum(QuoteProviderType, { each: true, },)
  providerTypes?: QuoteProviderType[];

  @IsOptional()
  @IsArray()
  @MinLength(1,)
  @IsEnum(PaymentMethod, { each: true, },)
  paymentMethods?: PaymentMethod[];

  @IsOptional()
  @IsEnum(RouteType,)
  routeType?: RouteType;

  @IsOptional()
  @IsISO31661Alpha2()
  country?: string;
}

export class ProviderQuoteDto {
  provider: {
    key: string;
    type: QuoteProviderType;
    name: string;
    iconUrl: string;
  };
  pay: {
    currency: string;
    amount: number;
    totalFeeUsd: number;
    minAmountUnits?: string;
    minAmountUsd?: number;
    maxAmountUnits?: string;
    maxAmountUsd?: number;
  };
  receive: {
    token: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
    };
    chain: {
      id: number;
      name: string;
    };
    amountUnits: string;
    amountUsd: number;
  };
  paymentMethods: PaymentMethod[];
  kyc: KycRequirement[];
  country?: string;
}

export class QuoteResponseDto {
  quotes: ProviderQuoteDto[];
}