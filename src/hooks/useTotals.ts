import { useMemo } from "react";
import type { Split, Totals } from "../types";
import { clamp, parseNumber } from "../utils/numbers";

interface UseTotalsArgs {
  robuxInput: string;
  splits: Split[];
  withhold: number;
  baseRate: number;
  flatFee: number;
  fxFeePct: number;
  applyFxFee: boolean;
}

export function useTotals({
  robuxInput,
  splits,
  withhold,
  baseRate,
  flatFee,
  fxFeePct,
  applyFxFee,
}: UseTotalsArgs): Totals {
  return useMemo(() => {
    const robux = parseNumber(robuxInput);
    const grossRaw = robux * baseRate;
    const flatFeeApplied = Math.max(0, flatFee || 0);
  const fxFeeApplied = applyFxFee ? Math.max(0, grossRaw * (fxFeePct || 0)) : 0;
    const totalAfterFee = Math.max(0, grossRaw - flatFeeApplied - fxFeeApplied);
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

    return {
      robux,
      grossRaw,
      totalAfterFee,
      shared,
      withheld,
      yourSharePct,
      flatFeeApplied,
      fxFeeApplied,
      collaboratorAmounts,
    };
  }, [robuxInput, splits, withhold, baseRate, flatFee, fxFeePct, applyFxFee]);
}
