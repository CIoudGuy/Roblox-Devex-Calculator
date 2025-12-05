import * as Select from "@radix-ui/react-select";
import type { PaymentMethod, PaymentMethodId } from "../types";

type PaymentMethodSelectProps = {
  methods: PaymentMethod[];
  value: PaymentMethodId;
  onChange: (id: PaymentMethodId) => void;
  flatFeeDisplay: string;
  fxFeesEnabled: boolean;
  fxFeeSummary: string;
  onToggleFxFees: () => void;
  showFxToggle: boolean;
  showFxSummary: boolean;
  warning?: string | null;
  description?: string | null;
};

export default function PaymentMethodSelect({
  methods,
  value,
  onChange,
  flatFeeDisplay,
  fxFeesEnabled,
  fxFeeSummary,
  onToggleFxFees,
  showFxToggle,
  showFxSummary,
  warning,
  description,
}: PaymentMethodSelectProps) {
  const selected = methods.find((m) => m.id === value) || methods[0];

  return (
    <div className="payment-block">
      <div className="payment-header">
        <div className="label-line">
          <span>Payment method</span>
          <span className="hint-icon" data-tooltip="Apply the Tipalti payout fees for your chosen method.">?</span>
        </div>
        {(description || selected.description) && (
          <p className="muted tiny">{description || selected.description}</p>
        )}
      </div>

      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger className="select-trigger" aria-label="Payment method">
          <Select.Value aria-label={selected.label}>{selected.label}</Select.Value>
          <Select.Icon className="select-icon">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="select-content" position="popper" sideOffset={6}>
            <Select.Viewport className="select-viewport">
              {methods.map((method) => (
                <Select.Item className="select-item" key={method.id} value={method.id}>
                  <Select.ItemText>
                    <div className="select-item-title">{method.label}</div>
                    {method.description && <div className="muted tiny">{method.description}</div>}
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <div className="payment-meta">
        <div>
          <p className="muted tiny">Flat fee</p>
          <div className="payment-amount">{flatFeeDisplay}</div>
        </div>
        {showFxToggle ? (
          <div className="fx-toggle-wrap">
            <button
              type="button"
              className={`chip-btn fx-chip ${fxFeesEnabled ? "active" : "ghost"}`}
              onClick={onToggleFxFees}
              title="Foreign exchange fee"
              aria-pressed={fxFeesEnabled}
            >
              <span className="fx-chip__icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.5 6h7m0 0-2-2m2 2-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.5 14h-7m0 0 2 2m-2-2 2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.4 11.2c0-1.215.983-2.2 2.2-2.2.651 0 1.232.287 1.629.737" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <span className="fx-chip__ping" aria-hidden="true" />
              </span>
              <div className="fx-chip__text">
                <span className="fx-chip__label">FX fee</span>
                <span className="fx-chip__state">
                  {fxFeesEnabled ? "On" : "Off"}
                </span>
              </div>
              <span className="fx-chip__pill" aria-hidden="true">
                {fxFeesEnabled ? "Applied" : "Bypass"}
              </span>
              <span className="fx-chip__glow" aria-hidden="true" />
            </button>
            {showFxSummary && <div className="muted tiny fx-note">{fxFeeSummary}</div>}
          </div>
        ) : null}
      </div>

      {warning && <div className="payment-warning">{warning}</div>}
    </div>
  );
}
