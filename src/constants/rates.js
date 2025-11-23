export const INPUT_LIMIT = 20_000_000_000;

export const RATE_PRESETS = [
  { id: "new", label: "New rate", value: 0.0038, hint: "Latest Roblox DevEx payout per Robux" },
  { id: "old", label: "Old rate", value: 0.0035, hint: "Previous DevEx payout per Robux" },
];

export const DEFAULT_BASE_RATE = RATE_PRESETS[0].value;
