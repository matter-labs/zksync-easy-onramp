export enum RouteType {
  BUY = "buy",
  SELL = "sell",
}

export enum QuoteProviderType {
  CEX = "cex",
  ONRAMP = "onramp",
}

export enum PaymentMethod {
  APPLE_PAY_CREDIT = "apple_pay_credit",
  GOOGLE_PAY_CREDIT = "google_pay_credit",
  APPLE_PAY_DEBIT = "apple_pay_debit",
  GOOGLE_PAY_DEBIT = "google_pay_debit",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  WIRE = "wire",
  PIX = "pix",
  SEPA = "sepa",
  ACH = "ach",
  KOYWE = "koywe",
}

export enum KycRequirement {
  NO_KYC = "no_kyc",
  BASIC = "basic",
  DOCUMENT_BASED = "document_based",
}