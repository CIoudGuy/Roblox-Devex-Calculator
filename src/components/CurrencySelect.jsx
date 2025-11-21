import * as Select from "@radix-ui/react-select";
import { currencyList } from "../data/currencies.js";

export default function CurrencySelect({ value, onValueChange }) {
  const current = currencyList.find((c) => c.code === value) || currencyList[0];

  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="select-trigger" aria-label="Currency selector">
        <Select.Value aria-label={value}>{`${current.code} - ${current.name}`}</Select.Value>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="select-content" position="popper" sideOffset={6}>
          <Select.Viewport className="select-viewport">
            {currencyList.map((c) => (
              <Select.Item className="select-item" key={c.code} value={c.code}>
                <Select.ItemText>{`${c.code} - ${c.name}`}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
