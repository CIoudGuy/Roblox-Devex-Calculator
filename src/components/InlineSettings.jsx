import { motion } from "framer-motion";
import { blockNonNumericKeys } from "../utils/numbers.js";

export default function InlineSettings({
  currency,
  baseRateInput,
  onBaseRateChange,
  activePreset,
  presets,
  onPresetSelect,
  fxInput,
  onFxChange,
  onResetFx,
  splitsEnabled,
  withholdEnabled,
  onToggleSplitsEnabled,
  onToggleWithholdEnabled,
  robuxTaxInput,
  onRobuxTaxChange,
  defaultRobuxTax,
  taxHighlight,
  onResetAll,
}) {
  return (
    <motion.div className="inline-settings" layout>
      <header className="inline-settings__header">
        <div>
          <p className="eyebrow">Extras</p>
          <h3>Custom rates</h3>
          <p className="muted small">Tune DevEx payouts and exchange rates without leaving the flow.</p>
        </div>
      </header>

      <section className="settings-section">
        <div className="settings-label">
          <div>
            <p className="eyebrow">Payout options</p>
            <h4>
              Optional steps{" "}
              <span className="hint-icon" data-tooltip="Show or hide splits and withholding controls.">
                ?
              </span>
            </h4>
          </div>
        </div>
        <div className="settings-control toggles">

          <button
            className={`toggle-card ${splitsEnabled ? "active" : ""}`}
            type="button"
            onClick={onToggleSplitsEnabled}
            role="switch"
            aria-checked={splitsEnabled}
          >
            <div className="toggle-info">
              <span className="toggle-label">Splits</span>
              <span className="toggle-desc">Distribute to team</span>
            </div>
            <div className="toggle-track">
              <motion.div className="toggle-thumb" layout transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            </div>
          </button>

          <button
            className={`toggle-card ${withholdEnabled ? "active" : ""}`}
            type="button"
            onClick={onToggleWithholdEnabled}
            role="switch"
            aria-checked={withholdEnabled}
          >
            <div className="toggle-info">
              <span className="toggle-label">Withholding</span>
              <span className="toggle-desc">Set aside taxes</span>
            </div>
            <div className="toggle-track">
              <motion.div className="toggle-thumb" layout transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            </div>
          </button>
        </div>

      </section>

      <div className="settings-grid">
        <section className="settings-section">
          <div className="settings-label">
          <div>
            <p className="eyebrow">DevEx rate</p>
            <h4>
              USD per Robux{" "}
              <span className="hint-icon" data-tooltip="Set the DevEx payout per Robux or override it.">
                ?
              </span>
            </h4>
          </div>
        </div>
          <div className="settings-control">
            <div className="preset-row">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`chip-btn ${activePreset === preset.id ? "active" : ""}`}
                  onClick={() => onPresetSelect(preset)}
                >
                  <span>{preset.label}</span>
                  <span className="chip-sub">{preset.value.toFixed(4)}</span>
                </button>
              ))}
            </div>
            <label className="stacked-label">
              <span className="muted tiny">Custom rate</span>
              <input
                value={baseRateInput}
                onChange={(e) => onBaseRateChange(e.target.value)}
                onKeyDown={blockNonNumericKeys}
                inputMode="decimal"
                placeholder="0.0038"
                pattern="[0-9.,]*"
              />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-label">
          <div>
            <p className="eyebrow">Exchange</p>
            <h4>
              {currency} to USD{" "}
              <span className="hint-icon" data-tooltip="FX rate used for conversions and reverse Robux math.">
                ?
              </span>
            </h4>
          </div>
        </div>
          <div className="settings-control">
            <label className="stacked-label">
              <span className="muted tiny">Rate to USD</span>
              <input
                value={fxInput}
                onChange={(e) => onFxChange(e.target.value)}
                inputMode="decimal"
                onKeyDown={blockNonNumericKeys}
                placeholder="1.00"
                pattern="[0-9.,]*"
              />
            </label>
            <button className="chip-btn ghost" type="button" onClick={onResetFx}>
              Reset {currency}
            </button>
          </div>
        </section>

        <section className={`settings-section ${taxHighlight ? "is-highlighted" : ""}`} id="taxSetting">
          <div className="settings-label">
          <div>
            <p className="eyebrow">Robux tax</p>
            <h4>
              Platform cut{" "}
              <span className="hint-icon" data-tooltip="Default platform tax percent for the after-tax helper.">
                ?
              </span>
            </h4>
          </div>
        </div>
          <div className="settings-control">
            <label className="stacked-label">
              <div className="label-row">
                <span className="muted tiny">Tax (%)</span>
                {robuxTaxInput !== String(defaultRobuxTax) && (
                  <button
                    className="reset-link"
                    type="button"
                    onClick={() => onRobuxTaxChange(String(defaultRobuxTax))}
                    title={`Reset to default ${defaultRobuxTax}%`}
                  >
                    Reset
                  </button>
                )}
              </div>
              <input
                type="text"
                value={robuxTaxInput}
                onChange={(e) => onRobuxTaxChange(e.target.value)}
                onKeyDown={blockNonNumericKeys}
                inputMode="decimal"
                placeholder={defaultRobuxTax}
                pattern="[0-9.,]*"
              />
            </label>
          </div>
        </section>
      </div>

      <section className="settings-section">
        <div className="settings-label">
          <div>
            <p className="eyebrow">Reset</p>
            <h4>Restore defaults</h4>
            <p className="muted tiny">Clear saved settings, rates, and toggles (inputs stay local only).</p>
          </div>
        </div>
        <div className="settings-control">
          <button className="chip-btn danger" type="button" onClick={onResetAll}>
            Reset everything
          </button>
        </div>
      </section>
    </motion.div >
  );
}
