import type { CurrencyCode, PaymentMethod, PaymentMethodId } from "../types";

export const DEFAULT_PAYMENT_METHOD_ID: PaymentMethodId = "local_bank";

export const FX_FEE_RANGE_DEFAULT: [number, number] = [0.019, 0.025];

export const paymentMethods: PaymentMethod[] = [
  {
    id: "local_bank",
    label: "Local Bank Transfer / SEPA Transfer",
    flatFeeUsd: 5,
    fxFeeRange: FX_FEE_RANGE_DEFAULT,
  },
  {
    id: "check",
    label: "Check",
    flatFeeUsd: 6,
    fxFeeRange: FX_FEE_RANGE_DEFAULT,
  },
  {
    id: "paypal",
    label: "PayPal",
    flatFeeUsd: 1,
    fxFeeRange: FX_FEE_RANGE_DEFAULT,
  },
  {
    id: "wire",
    label: "Wire Transfer",
    flatFeeUsd: 26,
    flatFeeByCurrency: {
      USD: 26,
      EUR: 20,
      GBP: 20,
    } as Partial<Record<CurrencyCode, number>>,
    fxFeeRange: FX_FEE_RANGE_DEFAULT,
  },
];
