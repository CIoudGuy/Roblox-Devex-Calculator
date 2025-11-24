import { motion } from "framer-motion";
import type { BreakdownKey, CurrencyCode } from "../types";
import { blockNonNumericKeys } from "../utils/numbers";
import CurrencySelect from "./CurrencySelect";
import CountUp from "./CountUp";

type AmountInputsProps = {
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  robuxInput: string;
  usdInput: string;
  robuxTaxPct: number;
  afterTaxRobux: number;
  onRobuxChange: (value: string) => void;
  onUsdChange: (value: string) => void;
  onOpenTaxSettings: () => void;
  onActiveMetricChange?: (metric: BreakdownKey) => void;
};

export default function AmountInputs({
  currency,
  onCurrencyChange,
  robuxInput,
  usdInput,
  robuxTaxPct,
  afterTaxRobux,
  onRobuxChange,
  onUsdChange,
  onOpenTaxSettings,
  onActiveMetricChange,
}: AmountInputsProps) {
  return (
    <motion.div className="input-group" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} layout>
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
        <div className="tax-pill">
          <div className="tax-info">
            <span>After</span>
            <button type="button" className="tax-edit-btn" onClick={onOpenTaxSettings}>
              {robuxTaxPct.toFixed(1)}%
            </button>
            <span>tax</span>
          </div>
          <div className="tax-result">
            <CountUp value={afterTaxRobux} formatter={(v) => `${Math.round(v).toLocaleString()} R$`} />
          </div>
        </div>
      </label>
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
