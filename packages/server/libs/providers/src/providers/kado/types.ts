import type { RouteType, } from "@app/db/enums";

type RampProduct = "buy" | "sell";
type Wallet = "metamask" | "manual_deposit" | "manual_input" | "ctrl";
export type KYCLevel = "L0" | "L1" | "L1.5" | "L2";
type Ecosystem = "evm" | string;

export interface BlockchainAsset {
  _id: string;
  name: string;
  description?: string;
  label: string;
  symbol: string;
  stablecoin: boolean;
  usesOsmoRouter?: boolean;
  usesLifiRouter?: boolean;
  usesAvaxRouter?: boolean;
  usesInjectiveRouter?: boolean;
  usesThorSwapRouter?: boolean;
  coingeckoId?: string;
  address?: string | null;
  contractAddress?: string;
  blockExplorerURI?: string;
  decimals: number;
  officialChainId: string;
  precision: number;
  rampProducts: RampProduct[];
  wallets: Wallet[];
  usesPolygonFulfillment?: boolean;
  isNative: boolean;
  avgOffRampTimeInSeconds: number;
  avgOnRampTimeInSeconds: number;
  rpcURI?: string;
  thorSwapInputAssetAddress?: string;
  thorSwapOutputAssetAddress?: string;
  exampleAddress?: string;
  cacheStepAmount?: number;
  bridgeCurrency?: string;
  bridgePaymentRail?: string;
  isSupportedInBridge?: boolean;
  isSupportedInBridgeWithSepa?: boolean;
  payLiquidationAddress?: string;
  providers: string[];
  trustekAssetId?: string;
  trustekNetworkId?: string;
  koyweAssetId?: string;
  squidAssetId?: string;
  squidChainId?: string;
  lifiSymbol?: string;
  kycLevels: KYCLevel[];
  priority?: number;
}

export interface Blockchain {
  _id: string;
  officialId: string;
  origin: string;
  label: string;
  associatedAssets: BlockchainAsset[];
  avgTransactionTimeSeconds: number;
  liveOnRamp: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  ecosystem?: Ecosystem;
}

export interface Config {
  countries: {
    code: string;
    disabled: boolean;
  }[];
  us_states: {
    code: string;
    disabled: boolean;
  }[];
  paymentMethods: {
    method: "Wire Transfer" | "ACH" | "Debit Card" | "Credit Card" | "Apple Pay" | "Google Pay" | "SEPA" | "Bank Transfer" | "PIX";
    txTypes: {
      type: "BUY" | "SELL";
      disabled: boolean;
      currencies: FiatCurrency[];
      countries: string[];
    }[]
  }[];
}

type FiatCurrency = "USD" | string;
type FiatAmount = number;
type TokenSymbol = string;
type TokenAmount = number;
export type PaymentMethod =
  | "credit_card"
  | "apple_pay_credit"
  | "google_pay_credit"
  | "debit_card"
  | "apple_pay_debit"
  | "google_pay_debit"
  | "wire"
  | "pix"
  | "sepa"
  | "ach"
  | "koywe";

export interface RequestDetails {
  blockchain: string;
  asset: TokenSymbol;
  amount: FiatAmount;
  transactionType: RouteType;
  currency: FiatCurrency;
  fiatMethod: PaymentMethod;
  ipCountry: string;
  partner: string;
  reverse: boolean;
}

interface FiatAmountDetails {
  currency: FiatCurrency;
  amount: FiatAmount;
  originalAmount: FiatAmount;
}

interface TokenAmountDetails {
  currency: TokenSymbol;
  amount: TokenAmount;
  originalAmount: TokenAmount;
}

interface FeeDetails {
  currency: FiatCurrency;
  amount: FiatAmount;
  originalAmount: FiatAmount;
  promotionModifier: number;
}

interface PriceDetails {
  symbol: TokenSymbol;
  amount: TokenAmount;
  unit: FiatCurrency;
  price: FiatAmount;
}

interface ReceiveDetails {
  symbol: TokenSymbol;
  unitCount: TokenAmount;
  unit: FiatCurrency;
  amount: FiatAmount;
  originalAmount: FiatAmount;
}

interface FiatValueLimits {
  amount: number;
  unit: FiatCurrency;
}

export interface Quote {
  asset: string;
  baseAmount: FiatValueLimits; // request amount - fees
  price: PriceDetails;
  processingFee: FeeDetails;
  bridgeFee: FeeDetails;
  networkFee: FeeDetails;
  smartContractFee: FeeDetails;
  totalFee: Omit<FeeDetails, "promotionModifier">;
  receiveAmountAfterFees: FiatAmountDetails;
  receiveUnitCountAfterFees: TokenAmountDetails;
  receive: ReceiveDetails;
  feeType: string;
  minValue: FiatValueLimits;
  maxValue: FiatValueLimits;
}

export type Quotes = Partial<Record<PaymentMethod, Quote>>;

export interface KadoApiResponse <T,> {
  data: T;
  success: boolean;
  message: string;
}