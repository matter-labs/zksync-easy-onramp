import type { PaymentMethod } from "zksync-easy-onramp-sdk";

export function parsePaymentMethod(paymentMethodId: PaymentMethod) {
  switch (paymentMethodId) {
    case "credit_card":
      return "Credit card";
    case "apple_pay_credit":
      return "Apple Pay";
    case "google_pay_credit":
      return "Google Pay";
    case "google_pay_debit":
      return "Google Pay (Debit)";
    case "apple_pay_debit":
      return "Apple Pay (Debit)";
    case "debit_card":
      return "Debit card";
    case "wire":
      return "Wire transfer";
    case "sepa":
      return "SEPA transfer";
    case "pix":
      return "PIX";
    case "ach":
      return "ACH";
    case "koywe":
      return "Koywe";
    default:
      return paymentMethodId;
  }
}
