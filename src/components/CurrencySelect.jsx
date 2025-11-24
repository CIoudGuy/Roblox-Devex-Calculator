import * as Select from "@radix-ui/react-select";
import { currencyList } from "../data/currencies.js";

export default function CurrencySelect({ value, onValueChange }) {
  const current = currencyList.find((c) => c.code === value) || currencyList[0];

  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="select-trigger" aria-label="Currency selector">
        <Select.Value aria-label={value}>{current.code}</Select.Value>
        <Select.Icon className="select-icon">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="select-content" position="popper" sideOffset={6}>
          <Select.Viewport className="select-viewport">
            {currencyList.map((c) => (
              <Select.Item className="select-item" key={c.code} value={c.code}>
                <Select.ItemText>
                  <span className="currency-code">{c.code}</span>
                  <span className="currency-name">{c.name}</span>
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
