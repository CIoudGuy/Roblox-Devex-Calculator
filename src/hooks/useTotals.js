import { useMemo } from "react";
import { clamp, parseNumber } from "../utils/numbers.js";

export function useTotals({ robuxInput, splits, withhold, baseRate, fee }) {
  return useMemo(() => {
    const robux = parseNumber(robuxInput);
    const grossRaw = robux * baseRate;
    const totalAfterFee = Math.max(0, grossRaw - fee);
    const totalCuts = splits.reduce((sum, s) => sum + clamp(0, Number(s.pct) || 0, 100), 0);
    const yourSharePct = clamp(0, 100 - totalCuts, 100);
    const shareFraction = yourSharePct / 100;
    const holdFraction = 1 - (withhold || 0) / 100;
    const shared = totalAfterFee * shareFraction;
    const withheld = shared * holdFraction;
    const collaboratorAmounts = splits.map((c) => {
      const pct = clamp(0, Number(c.pct) || 0, 100);
      return { ...c, pct, amount: totalAfterFee * (pct / 100) };
    });

    return { robux, grossRaw, totalAfterFee, shared, withheld, yourSharePct, collaboratorAmounts };
  }, [robuxInput, splits, withhold, baseRate, fee]);
}
