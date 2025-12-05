export type CurrencyCode = string;

export interface Currency {
  code: CurrencyCode;
  name: string;
  rateToUsd: number;
}

export interface RatePreset {
  id: string;
  label: string;
  value: number;
  hint?: string;
}

export type PaymentMethodId = "local_bank" | "wire" | "check" | "paypal";

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  description?: string;
  flatFeeUsd?: number;
  flatFeeByCurrency?: Partial<Record<CurrencyCode, number>>;
  fxFeeRange: [number, number];
  warning?: string;
}

export interface Split {
  id: string;
  name: string;
  pct: number;
}

export interface SplitWithAmount extends Split {
  amount: number;
}

export interface Totals {
  robux: number;
  grossRaw: number;
  totalAfterFee: number;
  shared: number;
  withheld: number;
  yourSharePct: number;
  flatFeeApplied: number;
  fxFeeApplied: number;
  collaboratorAmounts: SplitWithAmount[];
}

export type BreakdownKey = "gross" | "split" | "withholding" | "convert";

export type FxRates = Record<CurrencyCode, number>;

export interface BreakdownItem {
  label: string;
  note: string | ((totals: Totals) => string);
  get: (totals: Totals) => number;
}
