import {
  KycRequirement, PaymentMethod, QuoteProviderType, RouteType,
} from "@app/db/enums";
import {
  IsArray, IsBoolean,
  IsEnum, IsEthereumAddress, IsIn, IsInt, IsISO31661Alpha2, IsOptional, IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import type { Address, } from "viem";

import { supportedChains, } from "../chains";
import { FiatCurrency, supportedFiatCurrencies, } from "../currencies";
import { ToBoolean, } from "../decorators/to-boolean";
import { ToNumber, } from "../decorators/to-number";
import { ToStringsArray, } from "../decorators/to-strings-array";

const supportedChainIds = supportedChains.map((chain,) => chain.id,);

export class QuoteOptionsDto {
  @IsEthereumAddress()
  to: Address;

  @ToNumber()
  @IsInt()
  @IsIn(supportedChainIds,)
  chainId: number;

  @IsEthereumAddress()
  token: Address;

  @IsOptional()
  @IsString()
  @MinLength(1,)
  @MaxLength(100,)
  amount?: string;

  @IsOptional()
  @IsString()
  @MinLength(1,)
  @MaxLength(100,)
  fiatAmount?: string;

  @IsOptional()
  @IsString()
  @IsIn(supportedFiatCurrencies,)
  fiatCurrency?: FiatCurrency; // If provided, then amount is in fiat currency, otherwise in token

  @ToStringsArray()
  @IsOptional()
  @IsArray()
  @MinLength(1,)
  @IsEnum(QuoteProviderType, { each: true, },)
  providerTypes?: QuoteProviderType[];

  @ToStringsArray()
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

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  dev?: boolean;
}

export type QuoteOptions = {
  to: Address;
  chainId: number;
  token: Address;
  amount?: string;
  fiatAmount?: string;
  fiatCurrency: FiatCurrency;
  providerTypes: QuoteProviderType[];
  paymentMethods: PaymentMethod[];
  routeType: RouteType;
  country?: string;
  dev?: boolean;
};

export type QuoteStepOnrampViaLink = {
  type: "onramp_via_link";
  link: string;
};

export type QuoteStep = QuoteStepOnrampViaLink;

export class ProviderQuoteDto {
  type: RouteType;
  provider: {
    key: string;
    type: QuoteProviderType;
    name: string;
    iconUrl: string;
  };
  pay: {
    currency: string;
    fiatAmount: number;
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
    to: Address;
    amountUnits: string;
    amountUsd: number;
  };
  paymentMethods: PaymentMethod[];
  kyc: KycRequirement[];
  steps: QuoteStep[];
  country?: string;
}

export class QuoteResponseDto {
  quotes: ProviderQuoteDto[];
}
