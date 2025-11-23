import { motion } from "framer-motion";
import { blockNonNumericKeys } from "../utils/numbers.js";
import CountUp from "./CountUp.jsx";

export default function AmountInputs({
  currency,
  robuxInput,
  usdInput,
  robuxTaxPct,
  afterTaxRobux,
  onRobuxChange,
  onUsdChange,
  onOpenTaxSettings,
  onActiveMetricChange,
}) {
  return (
    <motion.div className="input-group" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} layout>
      <h3>Amounts</h3>
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
