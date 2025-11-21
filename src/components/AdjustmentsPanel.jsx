import { AnimatePresence, motion } from "framer-motion";

export default function AdjustmentsPanel({
  totals,
  splits,
  splitsOpen,
  onToggleSplits,
  onAddSplit,
  onRemoveSplit,
  onSplitChange,
  withhold,
  withholdOpen,
  onToggleWithhold,
  onWithholdChange,
}) {
  return (
    <motion.div className="input-group" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }}>
      <h3>Adjustments</h3>
      <div className="splits">
        <button id="splitsToggle" className={`icon-btn ghost full ${splitsOpen ? "active" : ""}`} type="button" onClick={onToggleSplits}>
          Splits <span className="hint-icon" data-tooltip="Add collaborators and assign their percentage cuts. Your share is the remainder.">?</span>
        </button>
        <AnimatePresence initial={false}>
          {splitsOpen && (
            <motion.div
              className="splits-panel is-open"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              aria-hidden={!splitsOpen}
            >
              <div className="split-summary-line">
                <div className="muted small">Your share</div>
                <div className="share-display">{totals.yourSharePct.toFixed(1)}%</div>
              </div>
              <div className="split-bar" id="splitBar">
                <div className="split-segment" style={{ width: `${totals.yourSharePct}%`, background: "var(--accent)" }} />
                {splits.map((s) => (
                  <div key={s.id} className="split-segment" style={{ width: `${Math.max(0, s.pct)}%`, background: "rgba(255,255,255,0.25)" }} />
                ))}
              </div>
              <div className="splits-list dark-scroll" id="splitList">
                {splits.map((split) => (
                  <div className="split-row" key={split.id}>
                    <input className="split-name" value={split.name} onChange={(e) => onSplitChange(split.id, "name", e.target.value)} placeholder="Name" />
                    <input
                      className="split-percent"
                      type="text"
                      inputMode="decimal"
                      value={split.pct}
                      onChange={(e) => onSplitChange(split.id, "pct", e.target.value)}
                      placeholder="%"
                    />
                    <button className="split-remove" onClick={() => onRemoveSplit(split.id)} type="button">
                      X
                    </button>
                  </div>
                ))}
              </div>
              <button className="icon-btn ghost" type="button" id="addSplit" onClick={onAddSplit}>
                Add collaborator
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="withhold-block">
        <button id="withholdToggle" className={`icon-btn ghost full ${withholdOpen ? "active" : ""}`} type="button" onClick={onToggleWithhold}>
          Personal withholding (%) <span className="hint-icon" data-tooltip="Percent you set aside for taxes/fees before payout.">?</span>
        </button>
        <AnimatePresence initial={false}>
          {withholdOpen && (
            <motion.div
              className="withhold-panel is-open"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              aria-hidden={!withholdOpen}
            >
              <input id="withhold" type="range" min="0" max="100" value={withhold} onChange={(e) => onWithholdChange(Number(e.target.value))} />
              <div className="hint">
                <span id="withholdValue">{withhold}</span>% held back for taxes/fees you plan to cover.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
