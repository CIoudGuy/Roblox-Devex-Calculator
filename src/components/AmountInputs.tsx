import { motion } from "framer-motion";
import type { BreakdownKey, CurrencyCode, PaymentMethod, PaymentMethodId } from "../types";
import { blockNonNumericKeys } from "../utils/numbers";
import CurrencySelect from "./CurrencySelect";
import CountUp from "./CountUp";
import PaymentMethodSelect from "./PaymentMethodSelect";

type AmountInputsProps = {
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  robuxInput: string;
  usdInput: string;
  robuxTaxPct: number;
  showBeforeTax: boolean;
  beforeTaxRobux: number;
  afterTaxRobux: number;
  onRobuxChange: (value: string) => void;
  onUsdChange: (value: string) => void;
  onOpenTaxSettings: () => void;
  onToggleTaxView: () => void;
  onActiveMetricChange?: (metric: BreakdownKey) => void;
  paymentMethods: PaymentMethod[];
  paymentMethod: PaymentMethodId;
  onPaymentMethodChange: (id: PaymentMethodId) => void;
  paymentFlatFeeDisplay: string;
  fxFeesEnabled: boolean;
  fxFeeSummary: string;
  onToggleFxFees: () => void;
  showFxToggle: boolean;
  showFxSummary: boolean;
  paymentOpen: boolean;
  onTogglePayment: () => void;
  paymentWarning?: string | null;
  paymentDescription?: string | null;
};

export default function AmountInputs({
  currency,
  onCurrencyChange,
  robuxInput,
  usdInput,
  robuxTaxPct,
  showBeforeTax,
  beforeTaxRobux,
  afterTaxRobux,
  onRobuxChange,
  onUsdChange,
  onOpenTaxSettings,
  onToggleTaxView,
  onActiveMetricChange,
  paymentMethods,
  paymentMethod,
  onPaymentMethodChange,
  paymentFlatFeeDisplay,
  fxFeesEnabled,
  fxFeeSummary,
  onToggleFxFees,
  showFxToggle,
  showFxSummary,
  paymentOpen,
  onTogglePayment,
  paymentWarning,
  paymentDescription,
}: AmountInputsProps) {
  const taxLabel = showBeforeTax ? "Before" : "After";
  const taxValue = showBeforeTax ? afterTaxRobux : beforeTaxRobux;

  return (
    <motion.div className="input-group" layout="position" transition={{ layout: { duration: 0 } }}>
      <div className="input-head">
        <h3>Amounts</h3>
        <CurrencySelect value={currency} onValueChange={onCurrencyChange} />
      </div>
      <label>
        <div className="label-line">
          Robux to cash out <span className="hint-icon" data-tooltip="Your raw Robux before any cuts.">?</span>
        </div>
        <input
          value={robuxInput}
          onChange={(e) => onRobuxChange(e.target.value)}
          onKeyDown={blockNonNumericKeys}
          onFocus={() => onActiveMetricChange?.("gross")}
          type="text"
          inputMode="decimal"
          placeholder="e.g. 125,000"
          pattern="[0-9.,]*"
        />
        <motion.div className="tax-pill" layout>
          <div className="tax-info">
            <button type="button" className="tax-switch" onClick={onToggleTaxView}>
              <span className="muted">Tax:</span>
              <span className="tax-mode-text">{taxLabel}</span>
            </button>
            <button type="button" className="tax-edit-btn" onClick={onOpenTaxSettings}>
              {robuxTaxPct.toFixed(1)}%
            </button>
          </div>
          <CountUp
            value={Number.isFinite(taxValue) ? taxValue : 0}
            formatter={(v) => `${Math.round(v).toLocaleString()} R$`}
          />
        </motion.div>
      </label>

      <div className={`payment-collapse ${paymentOpen ? "is-open" : ""}`}>
        <button
          type="button"
          className={`icon-btn ghost full ${paymentOpen ? "active" : ""}`}
          onClick={onTogglePayment}
          aria-expanded={paymentOpen}
          aria-controls="paymentPanel"
        >
          Payment method
          <span className="hint-icon" data-tooltip="Choose payout method and fees.">?</span>
        </button>
        {paymentOpen && (
          <div id="paymentPanel" className="payment-panel">
            <PaymentMethodSelect
              methods={paymentMethods}
              value={paymentMethod}
              onChange={onPaymentMethodChange}
              flatFeeDisplay={paymentFlatFeeDisplay}
              fxFeesEnabled={fxFeesEnabled}
              fxFeeSummary={fxFeeSummary}
              onToggleFxFees={onToggleFxFees}
              showFxToggle={showFxToggle}
              showFxSummary={showFxSummary}
              warning={paymentWarning}
              description={paymentDescription}
            />
          </div>
        )}
      </div>

      <label>
        <div className="label-line">
          <span id="convertLabel">{`${currency} to Robux`}</span>{" "}
          <span className="hint-icon" data-tooltip="Reverse: cash amount to needed Robux.">?</span>
        </div>
        <div className="convert-inline">
          <input
            value={usdInput}
            onChange={(e) => onUsdChange(e.target.value)}
            onKeyDown={blockNonNumericKeys}
            onFocus={() => onActiveMetricChange?.("convert")}
            type="text"
            inputMode="decimal"
            placeholder={`Enter ${currency}`}
            pattern="[0-9.,]*"
          />
        </div>
      </label>
    </motion.div>
  );
}
