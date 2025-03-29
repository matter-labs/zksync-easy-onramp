import { Token, } from "@app/db/entities";
import {
  KycRequirement, PaymentMethod, QuoteProviderType, RouteType,
} from "@app/db/enums";
import { LiFiStep, } from "@lifi/sdk";
import {
  IsArray,
  IsEnum, IsEthereumAddress, IsIn, IsInt, IsISO31661Alpha2, IsOptional, IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import type { Address, } from "viem";

import { supportedChains, } from "../chains";
import { FiatCurrency, supportedFiatCurrencies, } from "../currencies";
import { IsBigintable, } from "../decorators/is-bigintable";
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
  @IsBigintable()
  @MinLength(1,)
  @MaxLength(100,)
  amount?: string;

  @IsOptional()
  @ToNumber()
  @Min(0.001,)
  @Max(Number.MAX_SAFE_INTEGER,)
  fiatAmount?: number;

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
  dev?: boolean;
}

export type QuoteOptions = {
  to: Address;
  chainId: number;
  token: Token;
  amount: string;
  fiatAmount?: number;
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

export type QuoteStepTokenSwap = {
  type: "lifi_token_swap";
  swapQuote: LiFiStep;
};

export type QuoteStep = QuoteStepOnrampViaLink | QuoteStepTokenSwap;

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
    totalFeeFiat: number;
    minAmountUnits?: string;
    minAmountFiat?: number;
    maxAmountUnits?: string;
    maxAmountFiat?: number;
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
    amountFiat: number;
  };
  paymentMethods: PaymentMethod[];
  kyc: KycRequirement[];
  steps: QuoteStep[];
  country?: string;
}

export class QuoteResponseDto {
  quotes: ProviderQuoteDto[];
}
