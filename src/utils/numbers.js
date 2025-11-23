import { INPUT_LIMIT } from "../constants/rates.js";

export const clamp = (min, val, max) => Math.min(Math.max(val, min), max);

export const parseNumber = (value) => Number(String(value ?? "").replace(/,/g, "").trim()) || 0;

export const formatCurrency = (value, code = "USD") =>
  Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  });

export const formatNumberInput = (value, fractionDigits = 0, limit = INPUT_LIMIT) => {
  let num = parseNumber(value);
  num = Math.min(num, limit);
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
};

export const blockNonNumericKeys = (event) => {
  const allowedKeys = [
    "Backspace",
    "Delete",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Tab",
    "Home",
    "End",
    ".",
    ",",
  ];
  if (allowedKeys.includes(event.key)) return;
  if (event.ctrlKey || event.metaKey) return;
  if (event.key >= "0" && event.key <= "9") return;
  event.preventDefault();
};
