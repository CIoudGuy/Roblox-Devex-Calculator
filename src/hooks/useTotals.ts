import { useMemo } from "react";
import type { Split, Totals } from "../types";
import { clamp, parseNumber } from "../utils/numbers";

interface UseTotalsArgs {
  robuxInput: string;
  splits: Split[];
  withhold: number;
  baseRate: number;
  fee: number;
}

export function useTotals({ robuxInput, splits, withhold, baseRate, fee }: UseTotalsArgs): Totals {
  return useMemo(() => {
    const robux = parseNumber(robuxInput);
    const grossRaw = robux * baseRate;
    const totalAfterFee = Math.max(0, grossRaw - fee);
    const totalCuts = splits.reduce((sum, split) => sum + clamp(0, Number(split.pct) || 0, 100), 0);
    const yourSharePct = clamp(0, 100 - totalCuts, 100);
    const shareFraction = yourSharePct / 100;
    const holdFraction = 1 - (withhold || 0) / 100;
    const shared = totalAfterFee * shareFraction;
    const withheld = shared * holdFraction;
    const collaboratorAmounts = splits.map((collaborator) => {
      const pct = clamp(0, Number(collaborator.pct) || 0, 100);
      return { ...collaborator, pct, amount: totalAfterFee * (pct / 100) };
    });

    return { robux, grossRaw, totalAfterFee, shared, withheld, yourSharePct, collaboratorAmounts };
  }, [robuxInput, splits, withhold, baseRate, fee]);
}
