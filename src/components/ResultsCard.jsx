import { AnimatePresence, motion } from "framer-motion";
import CurrencySelect from "./CurrencySelect.jsx";

export default function ResultsCard({
  currency,
  onCurrencyChange,
  onExport,
  formatCurrency,
  fxNote = "Rates via ECB (~12h)",
  fxStatus = "OK",
  hasCollabs,
  withholdOpen,
  activeMetric,
  setActiveMetric,
  breakdown,
  resultValue,
  totals,
  splits,
}) {
  return (
    <section className="card wide" id="resultsCard">
      <div>
        <div className="card-head">
          <h2>
            Results <span className="hint-icon" data-tooltip="Shows payouts and conversions at the current splits, withholding, and fee.">?</span>
          </h2>
          <div className="head-actions">
            <div className="currency-wrap">
              <CurrencySelect value={currency} onValueChange={onCurrencyChange} />
            </div>
            <button id="exportPng" className="icon-btn slim" type="button" aria-label="Export results as PNG" title="Export PNG" onClick={onExport}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 4h16v14H4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M8 13l3-3 3 3 3-3 2 2v6H4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div id="resultsBody">
          <div className="fx-banner">
            <div className="fx-note-inline">
              {fxNote} <span className="hint-icon" id="fxUpdated" data-tooltip="Rates updating...">{fxStatus}</span>
            </div>
          </div>
          <div className={`results-grid${hasCollabs ? " has-splits" : ""}`}>
            <div className="conversion-box breakdown-box">
              <div className="breakdown-header">
                <div className="pill-group" role="group" aria-label="Payout breakdown toggle">
                  <motion.button
                    className={`pill-btn ${activeMetric === "gross" ? "active" : ""}`}
                    onClick={() => setActiveMetric("gross")}
                    whileTap={{ scale: 0.97 }}
                  >
                    Gross
                  </motion.button>
                  <motion.button
                    className={`pill-btn ${activeMetric === "split" ? "active" : ""} ${!hasCollabs ? "is-hidden" : ""}`}
                    onClick={() => setActiveMetric("split")}
                    whileTap={{ scale: 0.97 }}
                  >
                    After splits
                  </motion.button>
                  <motion.button
                    className={`pill-btn ${activeMetric === "withholding" ? "active" : ""} ${!withholdOpen ? "is-hidden" : ""}`}
                    onClick={() => setActiveMetric("withholding")}
                    whileTap={{ scale: 0.97 }}
                  >
                    After withholding
                  </motion.button>
                  <motion.button
                    className={`pill-btn ${activeMetric === "convert" ? "active" : ""}`}
                    onClick={() => setActiveMetric("convert")}
                    whileTap={{ scale: 0.97 }}
                  >
                    {currency} to Robux
                  </motion.button>
                </div>
              </div>
              <div className="breakdown-main">
                <h3 className="breakdown-title">
                  Payout breakdown{" "}
                  <span className="hint-icon" data-tooltip="Toggle to view payout at each step with splits, withholding, and fee applied.">?</span>
                </h3>
                <p className="muted" id="breakdownLabel">
                  {breakdown.label}
                </p>
                <div className="conversion-output" id="breakdownValue">
                  {resultValue}
                </div>
                <p className="muted tiny" id="breakdownNote">
                  {typeof breakdown.note === "function" ? breakdown.note(totals) : breakdown.note}
                </p>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {hasCollabs && (
                <motion.div
                  className="conversion-box is-visible"
                  id="splitPayoutsBox"
                  aria-hidden={!hasCollabs}
                  initial={{ opacity: 0, x: 10, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <h3>
                    Split payouts <span className="hint-icon" data-tooltip="See how much each collaborator receives before withholding.">?</span>
                  </h3>
                  <div className="split-payouts" id="splitPayouts">
                    {splits.map((c) => (
                      <motion.div className="split-pill" key={c.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                        <div className="split-dot" />
                        <div>
                          <strong>{c.name || "Collaborator"}</strong>
                          <br />
                          <span className="muted small">{(Number(c.pct) || 0).toFixed(1)}%</span>
                        </div>
                        <div style={{ textAlign: "right" }}>{formatCurrency ? formatCurrency(c.amount, currency) : c.amount}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
