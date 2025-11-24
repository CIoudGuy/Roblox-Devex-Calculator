import { AnimatePresence, motion } from "framer-motion";
import type { BreakdownItem, BreakdownKey, CurrencyCode, SplitWithAmount, Totals } from "../types";
import CountUp from "./CountUp";

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

type ResultsCardProps = {
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  onExport: () => void;
  isExporting: boolean;
  formatCurrency: (value: number, code?: CurrencyCode) => string;
  hasCollabs: boolean;
  withholdOpen: boolean;
  activeMetric: BreakdownKey;
  setActiveMetric: (metric: BreakdownKey) => void;
  breakdown: BreakdownItem;
  resultValue?: string | number;
  totals: Totals;
  splits: SplitWithAmount[];
};

export default function ResultsCard({
  currency,
  onCurrencyChange: _onCurrencyChange,
  onExport,
  isExporting,
  formatCurrency,
  hasCollabs,
  withholdOpen,
  activeMetric,
  setActiveMetric,
  breakdown,
  resultValue: _resultValue,
  totals,
  splits,
}: ResultsCardProps) {
  return (
    <motion.section className="card wide" id="resultsCard" layout transition={comfySpring}>
      <div>
        <div className="card-head relative">
          <h2>
            Results <span className="hint-icon" data-tooltip="Payouts with your current settings.">?</span>
          </h2>
          <div className="head-actions">
            {/* Export button moved to footer */}
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
        <div className="card-foot no-export">
          <button
            id="exportPng"
            className={`action-btn ${isExporting ? "loading" : ""}`}
            type="button"
            onClick={onExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span>Share Result</span>
                <span className="beta-badge">Beta</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.section >
  );
}
