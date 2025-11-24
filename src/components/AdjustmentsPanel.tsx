import { AnimatePresence, motion } from "framer-motion";
import type { BreakdownKey, Split, Totals } from "../types";
import { blockNonNumericKeys } from "../utils/numbers";

type AdjustmentsPanelProps = {
  totals: Totals;
  splits: Split[];
  splitsOpen: boolean;
  splitsEnabled: boolean;
  onToggleSplits: () => void;
  onAddSplit: () => void;
  onRemoveSplit: (id: string) => void;
  onSplitChange: (id: string, field: "name" | "pct", val: string) => void;
  withhold: number;
  withholdOpen: boolean;
  withholdEnabled: boolean;
  onToggleWithhold: () => void;
  onWithholdChange: (value: number) => void;
  onActiveMetricChange?: (metric: BreakdownKey) => void;
};

export default function AdjustmentsPanel({
  totals,
  splits,
  splitsOpen,
  splitsEnabled,
  onToggleSplits,
  onAddSplit,
  onRemoveSplit,
  onSplitChange,
  withhold,
  withholdOpen,
  withholdEnabled,
  onToggleWithhold,
  onWithholdChange,
  onActiveMetricChange,
}: AdjustmentsPanelProps) {
  return (
    <motion.div
      className="input-group"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05, layout: { duration: 0 } }}
      layout
    >
      <h3>Adjustments</h3>
      {splitsEnabled && (
        <div className="splits">
          <button
            id="splitsToggle"
            className={`icon-btn ghost full ${splitsOpen ? "active" : ""}`}
            type="button"
            onClick={() => {
              onActiveMetricChange?.("split");
              onToggleSplits();
            }}
          >
            Splits <span className="hint-icon" data-tooltip="Give teammates a % cut; you keep the rest.">?</span>
          </button>
          <AnimatePresence initial={false}>
            {splitsOpen && (
              <motion.div
                className="splits-panel is-open"
                initial={{ opacity: 0, y: -4, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.995 }}
                transition={{ duration: 0.2, ease: "easeOut", layout: { duration: 0 } }}
                style={{ overflow: "hidden" }}
                aria-hidden={!splitsOpen}
                layout="position"
              >
                <div className="split-summary-line">
                  <div className="muted small">Your share after splits</div>
                  <div className="share-display">{totals.yourSharePct.toFixed(1)}%</div>
                </div>
                <div className="split-bar" id="splitBar">
                  <div className="split-segment" style={{ width: `${totals.yourSharePct}%`, background: "var(--accent)" }} />
                  {splits.map((split) => (
                    <div
                      key={split.id}
                      className="split-segment"
                      style={{ width: `${Math.max(0, split.pct)}%`, background: "rgba(255,255,255,0.25)" }}
                    />
                  ))}
                </div>
                <div className="splits-list" id="splitList">
                  {splits.map((split) => (
                    <div className="split-card" key={split.id}>
                      <div className="split-inputs">
                        <input
                          className="split-name"
                          value={split.name}
                          onChange={(e) => onSplitChange(split.id, "name", e.target.value)}
                          placeholder="Collaborator name"
                        />
                        <div className="split-percent-wrap">
                          <input
                            className="split-percent"
                            type="text"
                            inputMode="decimal"
                            value={split.pct}
                            onKeyDown={blockNonNumericKeys}
                            onChange={(e) => {
                              onSplitChange(split.id, "pct", e.target.value);
                              onActiveMetricChange?.("split");
                            }}
                            placeholder="0"
                            pattern="[0-9.,]*"
                          />
                        </div>
                      </div>
                      <button className="split-remove" onClick={() => onRemoveSplit(split.id)} type="button" title="Remove">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <button className="split-add-btn" type="button" id="addSplit" onClick={onAddSplit}>
                  + Add collaborator
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {withholdEnabled && (
        <div className="withhold-block">
          <button
            id="withholdToggle"
            className={`icon-btn ghost full ${withholdOpen ? "active" : ""}`}
            type="button"
            onClick={() => {
              onActiveMetricChange?.("withholding");
              onToggleWithhold();
            }}
          >
            Personal withholding (%) <span className="hint-icon" data-tooltip="Hold back some of your share for taxes.">?</span>
          </button>
          <AnimatePresence initial={false}>
            {withholdOpen && (
              <motion.div
                className="withhold-panel is-open"
                initial={{ opacity: 0, y: -4, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.995 }}
                transition={{ duration: 0.2, ease: "easeOut", layout: { duration: 0 } }}
                style={{ overflow: "hidden" }}
                aria-hidden={!withholdOpen}
                layout="position"
              >
                <input
                  id="withhold"
                  type="range"
                  min="0"
                  max="100"
                  value={withhold}
                  onChange={(e) => {
                    onWithholdChange(Number(e.target.value));
                    onActiveMetricChange?.("withholding");
                  }}
                />
                <div className="hint">
                  <span id="withholdValue">{withhold}</span>% held back for taxes you plan to cover.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
