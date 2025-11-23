import { AnimatePresence, motion } from "framer-motion";
import CurrencySelect from "./CurrencySelect.jsx";
import CountUp from "./CountUp.jsx";

const comfySpring = { type: "spring", stiffness: 450, damping: 27 };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: comfySpring },
};

export default function ResultsCard({
  currency,
  onCurrencyChange,
  onExport,
  formatCurrency,
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
    <motion.section className="card wide" id="resultsCard" layout transition={comfySpring}>
      <div>
        <div className="card-head">
          <h2>
            Results <span className="hint-icon" data-tooltip="Payouts with your current settings.">?</span>
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
          <motion.div
            className={`results-grid${hasCollabs ? " has-splits" : ""}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="conversion-box breakdown-box" variants={itemVariants}>
              <div className="breakdown-header">
                <motion.div className="pill-group" role="group" aria-label="Payout breakdown toggle" layout>
                  <motion.button
                    className={`pill-btn ${activeMetric === "gross" ? "active" : ""}`}
                    onClick={() => setActiveMetric("gross")}
                    layout
                    transition={comfySpring}
                  >
                    Gross
                  </motion.button>
                  <AnimatePresence>
                    {hasCollabs && (
                      <motion.button
                        key="split"
                        className={`pill-btn ${activeMetric === "split" ? "active" : ""}`}
                        onClick={() => setActiveMetric("split")}
                        layout
                        initial={{ width: 0, opacity: 0, scale: 0.8, paddingLeft: 0, paddingRight: 0, marginLeft: -4 }}
                        animate={{ width: "auto", opacity: 1, scale: 1, paddingLeft: 12, paddingRight: 12, marginLeft: 0 }}
                        exit={{ width: 0, opacity: 0, scale: 0.8, paddingLeft: 0, paddingRight: 0, marginLeft: -4 }}
                        transition={comfySpring}
                        style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                      >
                        After splits
                      </motion.button>
                    )}
                    {withholdOpen && (
                      <motion.button
                        key="withholding"
                        className={`pill-btn ${activeMetric === "withholding" ? "active" : ""}`}
                        onClick={() => setActiveMetric("withholding")}
                        layout
                        initial={{ width: 0, opacity: 0, scale: 0.8, paddingLeft: 0, paddingRight: 0, marginLeft: -4 }}
                        animate={{ width: "auto", opacity: 1, scale: 1, paddingLeft: 12, paddingRight: 12, marginLeft: 0 }}
                        exit={{ width: 0, opacity: 0, scale: 0.8, paddingLeft: 0, paddingRight: 0, marginLeft: -4 }}
                        transition={comfySpring}
                        style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                      >
                        After withholding
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <motion.button
                    className={`pill-btn ${activeMetric === "convert" ? "active" : ""}`}
                    onClick={() => setActiveMetric("convert")}
                    layout
                    transition={comfySpring}
                  >
                    {currency} to Robux
                  </motion.button>
                </motion.div>
              </div>
              <div className="breakdown-main">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMetric}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <h3 className="breakdown-title">
                      Payout breakdown{" "}
                      <span className="hint-icon" data-tooltip="Pick gross, splits/withholding, or reverse to Robux.">
                        ?
                      </span>
                    </h3>
                    <p className="muted" id="breakdownLabel">
                      {breakdown.label}
                    </p>
                    <div className="conversion-output" id="breakdownValue">
                      {activeMetric === "convert" ? (
                        <CountUp
                          value={breakdown.get(totals)}
                          formatter={(v) => `${Math.round(v).toLocaleString()} Robux`}
                        />
                      ) : (
                        <CountUp
                          value={breakdown.get(totals)}
                          formatter={(v) => formatCurrency(v, currency)}
                        />
                      )}
                    </div>
                    <p className="muted tiny" id="breakdownNote">
                      {typeof breakdown.note === "function" ? breakdown.note(totals) : breakdown.note}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {hasCollabs && (
              <motion.div
                className="conversion-box is-visible"
                id="splitPayoutsBox"
                aria-hidden={!hasCollabs}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <h3>
                  Split payouts <span className="hint-icon" data-tooltip="What each collaborator gets (before your withholding).">?</span>
                </h3>
                <div className="split-payouts" id="splitPayouts">
                  {splits.map((c) => (
                    <div className="split-pill" key={c.id}>
                      <div className="split-dot" />
                      <div>
                        <strong>{c.name || "Collaborator"}</strong>
                        <br />
                        <span className="muted small">{(Number(c.pct) || 0).toFixed(1)}%</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {formatCurrency ? (
                          <CountUp value={c.amount} formatter={(v) => formatCurrency(v, currency)} />
                        ) : (
                          c.amount
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
