import { motion } from "framer-motion";

export default function AmountInputs({ currency, robuxInput, usdInput, onRobuxChange, onUsdChange }) {
  return (
    <motion.div className="input-group" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <h3>Amounts</h3>
      <label>
        <div className="label-line">
          Robux to cash out <span className="hint-icon" data-tooltip="How much Robux you plan to cash out via DevEx.">?</span>
        </div>
        <input value={robuxInput} onChange={(e) => onRobuxChange(e.target.value)} type="text" inputMode="decimal" placeholder="e.g. 125,000" />
      </label>
      <label>
        <div className="label-line">
          <span id="convertLabel">{`${currency} to Robux`}</span>{" "}
          <span className="hint-icon" data-tooltip="Convert a cash amount to the Robux needed after splits, withholding, and eCheck fee.">?</span>
        </div>
        <div className="convert-inline">
          <input value={usdInput} onChange={(e) => onUsdChange(e.target.value)} type="text" inputMode="decimal" placeholder={`Enter ${currency}`} />
        </div>
      </label>
    </motion.div>
  );
}
