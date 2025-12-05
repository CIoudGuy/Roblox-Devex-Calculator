import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BackgroundCanvas from "./components/BackgroundCanvas";
import AmountInputs from "./components/AmountInputs";
import AdjustmentsPanel from "./components/AdjustmentsPanel";
import ResultsCard from "./components/ResultsCard";
import StickyBar from "./components/StickyBar";
import InlineSettings from "./components/InlineSettings";
import BetaNotice from "./components/BetaNotice";
import Feedback from "./components/Feedback";
import ThemeMenu, { type Theme } from "./components/ThemeMenu";
import WelcomeThemeModal from "./components/WelcomeThemeModal";
import { currencyList, fxToUsd } from "./data/currencies";
import { DEFAULT_BASE_RATE, INPUT_LIMIT, RATE_PRESETS } from "./constants/rates";
import { DEFAULT_PAYMENT_METHOD_ID, paymentMethods } from "./constants/payments";
import { clamp, formatCurrency, formatNumberInput, parseNumber } from "./utils/numbers";
import { defaultSplit } from "./utils/splits";
import { useTotals } from "./hooks/useTotals";
import { useIsMobile } from "./hooks/useIsMobile";
import type {
  BreakdownItem,
  BreakdownKey,
  CurrencyCode,
  FxRates,
  PaymentMethod,
  PaymentMethodId,
  RatePreset,
  Split,
} from "./types";

const STORAGE_KEY = "devex-config-v1";
const BETA_DISMISS_KEY = "devex-beta-dismissed-v1";
const DEFAULT_PLATFORM_CUT = "30";
const FX_CACHE_KEY = "devex-fx-cache-v1";

type ConvertMeta = {
  robuxNeeded: number;
  rateToUsd: number;
};

export default function App() {
  const [robuxInput, setRobuxInput] = useState<string>("");
  const [usdInput, setUsdInput] = useState<string>("");
  const [withhold, setWithhold] = useState<number>(10);
  const [activeMetric, setActiveMetric] = useState<BreakdownKey>("gross");
  const [splits, setSplits] = useState<Split[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(DEFAULT_PAYMENT_METHOD_ID);
  const [withholdOpen, setWithholdOpen] = useState<boolean>(false);
  const [splitsOpen, setSplitsOpen] = useState<boolean>(false);
  const [extrasOpen, setExtrasOpen] = useState<boolean>(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("default");
  const [hasChosenTheme, setHasChosenTheme] = useState<boolean>(false);
  const [betaDismissed, setBetaDismissed] = useState<boolean>(false);
  const [betaDismissedSession, setBetaDismissedSession] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const hasSeenWelcome = localStorage.getItem("theme-seen");

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      setHasChosenTheme(true);
    }
    document.documentElement.removeAttribute("data-flat-ui");

    if (!hasSeenWelcome) {
      setTimeout(() => setWelcomeOpen(true), 1000);
    } else {
      setHasChosenTheme(true);
    }
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    localStorage.setItem("theme-seen", "true");
    setHasChosenTheme(true);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleWelcomeClose = () => {
    setWelcomeOpen(false);
    localStorage.setItem("theme-seen", "true");
    setHasChosenTheme(true);
  };
  const [splitsEnabled, setSplitsEnabled] = useState<boolean>(false);
  const [withholdEnabled, setWithholdEnabled] = useState<boolean>(false);
  const [ratePreset, setRatePreset] = useState<string | null>(RATE_PRESETS[0].id);
  const [baseRateInput, setBaseRateInput] = useState<string>(String(DEFAULT_BASE_RATE));
  const [platformTaxInput, setPlatformTaxInput] = useState<string>(DEFAULT_PLATFORM_CUT);
  const [fxBaseRates, setFxBaseRates] = useState<FxRates>(fxToUsd);
  const [fxRates, setFxRates] = useState<FxRates>(fxToUsd);
  const [fxInputs, setFxInputs] = useState<Record<CurrencyCode, string>>(
    () =>
      Object.fromEntries(
        Object.entries(fxToUsd).map(([code, val]) => [code as CurrencyCode, String(val)])
      ) as Record<CurrencyCode, string>
  );
  const [fxOverride, setFxOverride] = useState<boolean>(false);
  const [fxStatus, setFxStatus] = useState<string>("Updating...");
  const [lastFxUpdated, setLastFxUpdated] = useState<number | null>(null);
  const [fxSource, setFxSource] = useState<string | null>(null);
  const [taxHighlight, setTaxHighlight] = useState<boolean>(false);
  const [loadedSettings, setLoadedSettings] = useState<boolean>(false);
  const [showBetaNotice, setShowBetaNotice] = useState<boolean>(false);
  const [showBeforeTax, setShowBeforeTax] = useState<boolean>(false);
  const [fxFeesEnabled, setFxFeesEnabled] = useState<boolean>(true);
  const [feesInUsdOnly, setFeesInUsdOnly] = useState<boolean>(false);
  const [paymentOpen, setPaymentOpen] = useState<boolean>(true);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Etc/GMT-2",
    });

  const isMobile = useIsMobile();
  const activeSplits = splitsEnabled ? splits : [];
  const hasCollabs = activeSplits.length > 0;
  const showAdjustments = splitsEnabled || withholdEnabled;

  const baseRate = useMemo<number>(() => {
    const parsed = parseNumber(baseRateInput);
    return parsed > 0 ? parsed : DEFAULT_BASE_RATE;
  }, [baseRateInput]);

  const platformTaxPct = useMemo<number>(() => clamp(0, parseNumber(platformTaxInput), 100), [platformTaxInput]);
  const robuxTaxPct = platformTaxPct;

  const selectedPayment: PaymentMethod =
    paymentMethods.find((method) => method.id === paymentMethod) || paymentMethods[0];

  const fxToggleVisible = currency !== "USD";
  const flatFee = useMemo(() => {
    const currencyFee = selectedPayment.flatFeeByCurrency?.[currency];
    if (typeof currencyFee === "number") return currencyFee;
    if (typeof selectedPayment.flatFeeUsd === "number") return selectedPayment.flatFeeUsd;
    return 0;
  }, [selectedPayment, currency]);

  const fxFeeRange = selectedPayment.fxFeeRange || [0, 0];
  const [fxFeeMinPct, fxFeeMaxPct] = fxFeeRange;
  const appliedFxFeePct = fxToggleVisible && fxFeesEnabled ? fxFeeMaxPct : 0;

  const totals = useTotals({
    robuxInput,
    splits: activeSplits,
    withhold: withholdEnabled ? withhold : 0,
    baseRate,
    flatFee,
    fxFeePct: appliedFxFeePct,
    applyFxFee: fxToggleVisible && fxFeesEnabled,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = window.localStorage.getItem(FX_CACHE_KEY);
      if (!cached) return;
      const data = JSON.parse(cached) as { rates?: FxRates; ts?: number; source?: string };
      if (!data?.rates || typeof data.rates !== "object") return;
      const merged: FxRates = { ...fxToUsd };
      Object.entries(data.rates).forEach(([code, val]) => {
        const num = parseNumber(val);
        if (num > 0) merged[code as CurrencyCode] = num;
      });
      setFxBaseRates(merged);
      setFxRates(merged);
      if (typeof data.ts === "number" && Number.isFinite(data.ts)) {
        setLastFxUpdated(data.ts);
        setFxSource(data.source || "Cache");
        setFxStatus(`Cached | ${formatDate(data.ts)}`);
      }
      setFxInputs(
        Object.fromEntries(
          Object.entries(merged).map(([code, val]) => [code as CurrencyCode, String(val)])
        ) as Record<CurrencyCode, string>
      );
    } catch (err) {
      console.warn("Failed to load FX cache", err);
    }
  }, []);

  useEffect(() => {
    setFxStatus(
      lastFxUpdated ? `Updating... | last ${formatDate(lastFxUpdated)}` : "Updating..."
    );
    let isActive = true;
    const extractUpdatedTs = (data: any): number | null => {
      if (typeof data?.time_last_update_unix === "number") {
        return data.time_last_update_unix * 1000;
      }
      if (typeof data?.time_last_update === "string") {
        const parsed = Date.parse(data.time_last_update);
        if (Number.isFinite(parsed)) return parsed;
      }
      if (typeof data?.timestamp === "number") {
        return data.timestamp * 1000;
      }
      return null;
    };
    const fetchRates = async () => {
      try {
        const fetchWithTimeout = (url: string, ms = 5000): Promise<Response> =>
          Promise.race([
            fetch(url),
            new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
          ]);

        const sources = [
          { url: "https://api.devex-calculator.dev/", label: "API" },
          { url: "https://open.er-api.com/v6/latest/USD", label: "Fallback (open.er-api)" },
          {
            url: "https://api.exchangerate.host/latest?base=USD&source=ecb&places=6",
            label: "Fallback (exchangerate.host)",
          },
        ];

        let rates: Record<string, number> | null = null;
        let baseCode: CurrencyCode = "USD";
        let sourceLabel: string | null = null;
        let lastData: any = null;
        for (const { url, label } of sources) {
          try {
            const res = await fetchWithTimeout(url);
            if (!res.ok) continue;
            const data: any = await res.json();
            if (data?.result === "success" && data?.conversion_rates) {
              rates = data.conversion_rates;
              baseCode = (data.base_code || data.base || "USD").toUpperCase?.() || "USD";
              sourceLabel = label;
              lastData = data;
              break;
            }
            if (data?.result === "success" && data?.rates) {
              rates = data.rates;
              baseCode = (data.base_code || data.base || "USD").toUpperCase?.() || "USD";
              sourceLabel = label;
              lastData = data;
              break;
            }
            if (data?.rates) {
              rates = data.rates;
              baseCode = (data.base || "USD").toUpperCase?.() || "USD";
              sourceLabel = label;
              lastData = data;
              break;
            }
          } catch {
            continue;
          }
        }

        if (!isActive) return;

        if (!rates) {
          const fallbackStatus = lastFxUpdated
            ? `Failed to update | last ${formatDate(lastFxUpdated)}`
            : "Failed to update";
          setFxStatus(fallbackStatus);
          return;
        }

        const toNumber = (val: unknown) => (typeof val === "number" ? val : Number(val));
        const usdPerBase =
          baseCode === "USD" ? 1 : toNumber(rates?.USD) > 0 ? toNumber(rates.USD) : null;

        const updated = Object.fromEntries(
          currencyList.map(({ code }) => {
            if (code === "USD") return ["USD", 1];
            const rawRate = rates?.[code];
            const parsed = toNumber(rawRate);
            let usdPerUnit = fxToUsd[code] || 1;

            if (parsed > 0) {
              if (baseCode === "USD") {
                usdPerUnit = 1 / parsed;
              } else if (usdPerBase && usdPerBase > 0) {
                usdPerUnit = usdPerBase / parsed;
              } else {
                usdPerUnit = parsed;
              }
            }

            if (!Number.isFinite(usdPerUnit) || usdPerUnit <= 0) {
              usdPerUnit = fxToUsd[code] || 1;
            }

            return [code, Number(usdPerUnit.toFixed(6))];
          })
        ) as FxRates;
        setFxBaseRates(updated);
        setFxRates(updated);
        setFxInputs(
          Object.fromEntries(
            Object.entries(updated).map(([code, val]) => [code as CurrencyCode, String(val)])
          ) as Record<CurrencyCode, string>
        );
        try {
          const updatedAt = extractUpdatedTs(lastData) || Date.now();
          window.localStorage.setItem(
            FX_CACHE_KEY,
            JSON.stringify({ rates: updated, ts: updatedAt, source: sourceLabel || "API" })
          );
        } catch (err) {
          console.warn("Failed to store FX cache", err);
        }
        const updatedAt = extractUpdatedTs(lastData) || Date.now();
        setLastFxUpdated(updatedAt);
        const label = sourceLabel || "API";
        setFxSource(label);
        setFxStatus(`${formatDate(updatedAt)}`);
      } catch (err) {
        console.warn("FX fetch error", err);
        if (isActive) {
          const fallbackStatus = lastFxUpdated
            ? `Failed to update | last ${formatDate(lastFxUpdated)}`
            : "Failed to update";
          setFxStatus(fallbackStatus);
        }
      }
    };
    fetchRates();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasCollabs && activeMetric === "split") setActiveMetric("gross");
  }, [hasCollabs, activeMetric]);

  useEffect(() => {
    if (!splitsEnabled) {
      setSplitsOpen(false);
      if (activeMetric === "split") setActiveMetric("gross");
    }
  }, [splitsEnabled, activeMetric]);

  useEffect(() => {
    if (!withholdEnabled) {
      setWithholdOpen(false);
      if (activeMetric === "withholding") setActiveMetric("gross");
    }
  }, [withholdEnabled, activeMetric]);

  useEffect(() => {
    if (!withholdOpen && activeMetric === "withholding") setActiveMetric("gross");
  }, [withholdOpen, activeMetric]);

  const toggleSplitsEnabled = () =>
    setSplitsEnabled((prev) => {
      const next = !prev;
      if (next) setSplitsOpen(true);
      return next;
    });

  const toggleWithholdEnabled = () =>
    setWithholdEnabled((prev) => {
      const next = !prev;
      if (next) setWithholdOpen(true);
      return next;
    });

  const toggleFeesInUsdOnly = () => setFeesInUsdOnly((prev) => !prev);
  const togglePaymentOpen = () => setPaymentOpen((prev) => !prev);

  const beforeTaxRobux = useMemo(() => {
    const raw = parseNumber(robuxInput);
    const divisor = Math.max(0.01, 1 - platformTaxPct / 100);
    const preTax = raw / divisor;
    return Number.isFinite(preTax) ? Math.max(0, Math.round(preTax)) : 0;
  }, [robuxInput, platformTaxPct]);

  const afterTaxRobux = useMemo(() => {
    const raw = parseNumber(robuxInput);
    const rate = Math.max(0, 1 - platformTaxPct / 100);
    const postTax = raw * rate;
    return Number.isFinite(postTax) ? Math.max(0, Math.round(postTax)) : 0;
  }, [robuxInput, platformTaxPct]);

  const handleOpenTaxSettings = () => {
    setExtrasOpen(true);
    setTaxHighlight(true);
    setTimeout(() => setTaxHighlight(false), 900);
  };

  const handleResetAll = () => {
    const defaultFx = Object.fromEntries(
      Object.entries(fxBaseRates).map(([code, val]) => [code as CurrencyCode, String(val)])
    ) as Record<CurrencyCode, string>;
    setRobuxInput("");
    setUsdInput("");
    setCurrency("USD");
    setPaymentMethod(DEFAULT_PAYMENT_METHOD_ID);
    setWithhold(10);
    setWithholdEnabled(false);
    setWithholdOpen(false);
    setSplitsEnabled(false);
    setSplitsOpen(false);
    setSplits([]);
    setRatePreset(RATE_PRESETS[0].id);
    setBaseRateInput(String(DEFAULT_BASE_RATE));
    setPlatformTaxInput(DEFAULT_PLATFORM_CUT);
    setShowBeforeTax(false);
    setActiveMetric("gross");
    setFxRates(fxBaseRates);
    setFxInputs(defaultFx);
    setTaxHighlight(false);
    setFxOverride(false);
    setShowBeforeTax(false);
    setFxFeesEnabled(true);
    setFeesInUsdOnly(false);
    setPaymentOpen(true);
  };

  const handleDismissBetaNotice = () => {
    setShowBetaNotice(false);
    setBetaDismissedSession(true);
  };

  const handleDisableBetaNotice = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(BETA_DISMISS_KEY, "1");
      } catch (err) {
        console.warn("Failed to store beta preference", err);
      }
    }
    setBetaDismissed(true);
    setShowBetaNotice(false);
  };

  useEffect(() => {
    if (!(extrasOpen && taxHighlight)) return undefined;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = () => {
      const el = document.getElementById("taxSetting");
      const rect = el?.getBoundingClientRect();
      if (el && rect && rect.height > 0 && rect.width > 0) {
        el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      } else if (tries < 60) {
        tries += 1;
        timer = setTimeout(poll, 60);
      }
    };
    timer = setTimeout(poll, 120);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [extrasOpen, taxHighlight]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setLoadedSettings(true);
        return;
      }
      const data = JSON.parse(raw) as Partial<{
        currency: CurrencyCode;
        withhold: number;
        withholdEnabled: boolean;
        splitsEnabled: boolean;
        baseRateInput: string;
        ratePreset: string | null;
        platformTaxInput: string;
        fxOverride: boolean;
        fxInputs: Record<string, number | string>;
        showBeforeTax: boolean;
        paymentMethod: PaymentMethodId;
        fxFeesEnabled: boolean;
        feesInUsdOnly?: boolean;
        robuxTaxAfterInput?: string;
        robuxTaxBeforeInput?: string;
        robuxTaxInput?: string;
      }>;
      if (data && typeof data === "object") {
        if (typeof data.currency === "string") setCurrency(data.currency);
        if (typeof data.paymentMethod === "string") {
          const nextMethod = paymentMethods.find((m) => m.id === data.paymentMethod);
          if (nextMethod) setPaymentMethod(nextMethod.id);
        }
        if (typeof data.withhold === "number") setWithhold(data.withhold);
        if (typeof data.withholdEnabled === "boolean") setWithholdEnabled(data.withholdEnabled);
        if (typeof data.splitsEnabled === "boolean") setSplitsEnabled(data.splitsEnabled);
        if (typeof data.baseRateInput === "string") setBaseRateInput(data.baseRateInput);
        if (typeof data.ratePreset === "string") setRatePreset(data.ratePreset);
        const legacyTax = typeof data.robuxTaxInput === "string" ? data.robuxTaxInput : undefined;
        if (typeof data.platformTaxInput === "string") {
          setPlatformTaxInput(data.platformTaxInput);
        } else if (typeof data.robuxTaxAfterInput === "string") {
          setPlatformTaxInput(data.robuxTaxAfterInput);
        } else if (legacyTax) {
          setPlatformTaxInput(legacyTax);
        }
        if (typeof data.fxOverride === "boolean") setFxOverride(data.fxOverride);
        if (typeof data.showBeforeTax === "boolean") setShowBeforeTax(data.showBeforeTax);
        if (typeof data.fxFeesEnabled === "boolean") setFxFeesEnabled(data.fxFeesEnabled);
        if (typeof data.feesInUsdOnly === "boolean") setFeesInUsdOnly(data.feesInUsdOnly);
        if (typeof data.paymentOpen === "boolean") setPaymentOpen(data.paymentOpen);
        if (data.fxInputs && typeof data.fxInputs === "object") {
          const merged: FxRates = { ...fxToUsd };
          Object.entries(data.fxInputs).forEach(([code, val]) => {
            const num = parseNumber(val);
            merged[code as CurrencyCode] = num > 0 ? num : merged[code as CurrencyCode] || 1;
          });
          setFxRates(merged);
          setFxInputs(
            Object.fromEntries(
              Object.entries(merged).map(([code, val]) => [code as CurrencyCode, String(val)])
            ) as Record<CurrencyCode, string>
          );
        }
      }
    } catch (err) {
      console.warn("Failed to load saved settings", err);
    } finally {
      setLoadedSettings(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const disabled = window.localStorage.getItem(BETA_DISMISS_KEY) === "1";
      setBetaDismissed(disabled);
    } catch (err) {
      console.warn("Failed to read beta preference", err);
      setBetaDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (!hasChosenTheme || betaDismissed || betaDismissedSession) {
      setShowBetaNotice(false);
      return;
    }
    setShowBetaNotice(true);
  }, [hasChosenTheme, betaDismissed, betaDismissedSession]);


  useEffect(() => {
    if (!loadedSettings || typeof window === "undefined") return;
    const payload = {
      currency,
      paymentMethod,
      withhold,
      withholdEnabled,
      splitsEnabled,
      baseRateInput,
      ratePreset,
      platformTaxInput,
    fxInputs,
    fxOverride,
    showBeforeTax,
    fxFeesEnabled,
    feesInUsdOnly,
    paymentOpen,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn("Failed to save settings", err);
    }
  }, [
    loadedSettings,
    currency,
    withhold,
    withholdEnabled,
    splitsEnabled,
    splits,
    baseRateInput,
    ratePreset,
    platformTaxInput,
    fxInputs,
    fxOverride,
    showBeforeTax,
    paymentMethod,
    fxFeesEnabled,
    feesInUsdOnly,
    paymentOpen,
  ]);

  const handleAddSplit = () => {
    setSplitsOpen(true);
    setActiveMetric("split");
    setSplits((prev) => [...prev, defaultSplit()]);
  };

  const handleSplitChange = (id: string, field: "name" | "pct", val: string) => {
    setSplits((prev) =>
      prev.map((split) => {
        if (split.id !== id) return split;
        if (field === "pct") {
          return { ...split, pct: clamp(0, parseNumber(val), 100) };
        }
        return { ...split, name: val };
      })
    );
  };

  const handleRemoveSplit = (id: string) => setSplits((prev) => prev.filter((split) => split.id !== id));

  const handleFxChange = (code: CurrencyCode, value: string) => {
    setFxInputs((prev) => ({ ...prev, [code]: value }));
    const parsed = parseNumber(value);
    setFxRates((prev) => ({ ...prev, [code]: parsed > 0 ? parsed : prev[code] || 1 }));
    setFxOverride(true);
  };

  const resetFxRate = (code: CurrencyCode) => {
    const fallback = fxBaseRates[code] || fxToUsd[code] || 1;
    setFxInputs((prev) => ({ ...prev, [code]: String(fallback) }));
    setFxRates((prev) => ({ ...prev, [code]: fallback }));
    setFxOverride(false);
  };

  const handlePresetSelect = (preset: RatePreset) => {
    setRatePreset(preset.id);
    setBaseRateInput(String(preset.value));
  };

  const selectedRateToUsd = fxRates[currency] && fxRates[currency] > 0 ? fxRates[currency] : 1;

  const toDisplayCurrency = useMemo(
    () => {
      const safeRate = selectedRateToUsd || 1;
      return (usdAmount: number) => usdAmount / safeRate;
    },
    [selectedRateToUsd]
  );

  const formatDisplayCurrency = useMemo(
    () => (value: number) => formatCurrency(toDisplayCurrency(value), currency),
    [toDisplayCurrency, currency]
  );

  const convertMeta = useMemo<ConvertMeta | null>(() => {
    const amt = parseNumber(usdInput);
    if (!amt) return null;
    const targetUsd = amt * selectedRateToUsd;
    const robuxNeeded = Math.ceil(targetUsd / baseRate);
    return { robuxNeeded, rateToUsd: selectedRateToUsd };
  }, [usdInput, selectedRateToUsd, baseRate]);

  const fxFeeRangeText = `${(fxFeeMinPct * 100).toFixed(1)}%-${(fxFeeMaxPct * 100).toFixed(1)}%`;
  const flatFeeDisplay = feesInUsdOnly ? formatCurrency(flatFee, "USD") : formatDisplayCurrency(flatFee);
  const fxFeeAppliedPctText = `${(fxFeeMaxPct * 100).toFixed(1)}%`;
  const fxFeeAppliedValueText = formatDisplayCurrency(totals.fxFeeApplied);
  const fxFeeSummary = !fxToggleVisible
    ? ""
    : totals.grossRaw
      ? fxFeesEnabled
        ? `${fxFeeAppliedPctText} fee (costs ${fxFeeAppliedValueText})`
        : "FX fee off"
      : fxFeesEnabled
        ? `FX fee ${fxFeeRangeText}`
        : "FX fee off";
  const showFxSummary = fxToggleVisible && fxFeeSummary !== "";
  const paymentWarning = selectedPayment.warning || null;
  const paymentDescription = selectedPayment.description || null;

  const breakdownMeta: Record<BreakdownKey, BreakdownItem> = {
    gross: {
      label: "Gross payout",
      note: (o) =>
        `${selectedPayment.label}: -${flatFeeDisplay}${fxToggleVisible && fxFeesEnabled
          ? ` + FX fee ${fxFeeAppliedPctText} (-${formatDisplayCurrency(o.fxFeeApplied)})`
          : ""
        }`,
      get: (o) => o.totalAfterFee,
    },
    split: {
      label: "After splits",
      note: (o) =>
        `${o.yourSharePct.toFixed(1)}% share after ${selectedPayment.label} fees.`,
      get: (o) => o.shared,
    },
    withholding: {
      label: "After withholding",
      note: () => "Withholding after payment and FX fees.",
      get: (o) => o.withheld,
    },
    convert: {
      label: `${currency} to Robux`,
      note: convertMeta
        ? `Using ${currency} -> USD ${convertMeta.rateToUsd.toFixed(4)} and DevEx ${baseRate.toFixed(4)} USD/R$`
        : "Enter an amount to convert instantly.",
      get: () => convertMeta?.robuxNeeded || 0,
    },
  };

  const breakdown = breakdownMeta[activeMetric] || breakdownMeta.gross;

  const copyNumbers = async () => {
    const summary = [
      `Currency: ${currency}`,
      `Payment: ${selectedPayment.label}`,
      `Gross: ${formatDisplayCurrency(breakdownMeta.gross.get(totals))}`,
      `After splits: ${formatDisplayCurrency(breakdownMeta.split.get(totals))}`,
      `After withholding: ${formatDisplayCurrency(breakdownMeta.withholding.get(totals))}`,
      `Flat fee: ${flatFeeDisplay}`,
      `FX fee: ${fxToggleVisible
        ? fxFeesEnabled
          ? `${fxFeeAppliedPctText} (-${formatDisplayCurrency(totals.fxFeeApplied)})`
          : "Off"
        : "Off (USD)"
      }`,
      `DevEx rate: ${baseRate.toFixed(4)} USD/R$`,
      `Withholding: ${withhold}%`,
      splits.length ? `Collaborators: ${splits.length}` : "Collaborators: none",
    ].join("\n");
    try {
      await navigator.clipboard?.writeText(summary);
    } catch {
      console.warn("Clipboard not available");
    }
  };

  const containerVariants = {
    mobile: { gap: 12, padding: "24px 12px 90px" },
    desktop: { gap: 20, padding: "52px clamp(18px, 4vw, 78px) 80px" },
  };

  const splitsWithAmounts = totals.collaboratorAmounts;
  const lastUpdated =
    document.lastModified && !Number.isNaN(Date.parse(document.lastModified))
      ? new Date(document.lastModified).toLocaleString([], {
        hour12: false,
        timeZone: "Etc/GMT-2",
        timeZoneName: "short",
      })
      : "N/A";

  const hasModifiedExtras = useMemo(() => {
    const isBaseRateModified = baseRateInput !== String(DEFAULT_BASE_RATE);
    const isTaxModified = platformTaxInput !== DEFAULT_PLATFORM_CUT;
    const isFeeDisplayModified = feesInUsdOnly;
    return isBaseRateModified || isTaxModified || fxOverride || isFeeDisplayModified;
  }, [baseRateInput, platformTaxInput, fxOverride, feesInUsdOnly]);

  return (
    <>
      <BackgroundCanvas active={theme === "default"} />
      <BetaNotice
        open={showBetaNotice}
        onClose={handleDismissBetaNotice}
        onDisable={handleDisableBetaNotice}
      />
      <motion.main
        className="page"
        variants={containerVariants}
        initial={isMobile ? "mobile" : "desktop"}
        animate={isMobile ? "mobile" : "desktop"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        layout
      >
        <section className="grid">
          <section className="card wide" id="inputsCard">
            <div className="card-head">
              <h2>Inputs</h2>
              <div className="head-actions">
                <button
                  className="icon-btn extras-toggle"
                  type="button"
                  onClick={() => setThemeOpen(true)}
                >
                  Themes
                </button>
                <button
                  className={`icon-btn extras-toggle ${hasModifiedExtras ? "has-updates" : ""}`}
                  type="button"
                  onClick={() => setExtrasOpen(true)}
                >
                  Open extras
                </button>

                <button className="collapse-toggle" type="button" data-target="inputsCard">
                  Toggle
                </button>
              </div>
            </div>
            <div className={`form-grid ${showAdjustments ? "" : "single"}`}>
              <AmountInputs
                currency={currency}
                onCurrencyChange={setCurrency}
                robuxInput={robuxInput}
                usdInput={usdInput}
                robuxTaxPct={robuxTaxPct}
                showBeforeTax={showBeforeTax}
                beforeTaxRobux={beforeTaxRobux}
                afterTaxRobux={afterTaxRobux}
                onToggleTaxView={() => setShowBeforeTax((v) => !v)}
                onOpenTaxSettings={handleOpenTaxSettings}
                onRobuxChange={(val) => setRobuxInput(formatNumberInput(val, 0, INPUT_LIMIT))}
                onUsdChange={(val) => {
                  const formatted = formatNumberInput(val, 2, INPUT_LIMIT);
                  setUsdInput(formatted);
                  setActiveMetric("convert");
                }}
                onActiveMetricChange={setActiveMetric}
                paymentMethods={paymentMethods}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                paymentFlatFeeDisplay={flatFeeDisplay}
                fxFeesEnabled={fxFeesEnabled}
                fxFeeSummary={fxFeeSummary}
                onToggleFxFees={() => setFxFeesEnabled((prev) => !prev)}
                showFxToggle={fxToggleVisible}
                showFxSummary={showFxSummary}
                paymentOpen={paymentOpen}
                onTogglePayment={togglePaymentOpen}
                paymentWarning={paymentWarning}
                paymentDescription={paymentDescription}
              />

              {showAdjustments && (
                <AdjustmentsPanel
                  totals={totals}
                  splits={activeSplits}
                  splitsOpen={splitsOpen}
                  splitsEnabled={splitsEnabled}
                  onToggleSplits={() => setSplitsOpen((v) => !v)}
                  onAddSplit={handleAddSplit}
                  onRemoveSplit={handleRemoveSplit}
                  onSplitChange={handleSplitChange}
                  withhold={withhold}
                  withholdOpen={withholdOpen}
                  withholdEnabled={withholdEnabled}
                  onToggleWithhold={() => setWithholdOpen((v) => !v)}
                  onWithholdChange={setWithhold}
                  onActiveMetricChange={setActiveMetric}
                />
              )}
            </div>

          </section>

          <ResultsCard
            currency={currency}
            formatCurrency={formatDisplayCurrency}
            hasCollabs={hasCollabs}
            withholdOpen={withholdOpen}
            activeMetric={activeMetric}
            setActiveMetric={setActiveMetric}
            breakdown={breakdown}
            totals={totals}
            splits={splitsWithAmounts}
          />
        </section>

        <StickyBar onCopy={copyNumbers} />

        <footer className="footer">
          <div className="beta-note">
            <div className="beta-row">
              <span className="beta-text">Last updated: {lastUpdated}</span>
              <span
                className="beta-text small"
                title={
                  fxSource && fxSource !== "Cache"
                    ? `${fxSource}`
                    : undefined
                }
              >
                Rates status:{" "}
                {fxStatus || (lastFxUpdated ? `${formatDate(lastFxUpdated)}` : "Updating...")}
              </span>
            </div>
            <div className="beta-row">
              <span className="beta-text beta-warning">Still in beta - expect changes.</span>
            </div>
          </div>
        </footer>
      </motion.main>

      <AnimatePresence>
        {extrasOpen && (
          <>
            <motion.div
              className="extras-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExtrasOpen(false)}
            />
            <motion.aside
              className="extras-sidebar"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              role="dialog"
              aria-modal="true"
              aria-label="Extras settings"
            >
              <div className="extras-header">
                <div>
                  <p className="eyebrow">Advanced</p>
                  <h3>Extras</h3>
                  <p className="muted tiny">Custom rates, FX, and tax helpers.</p>
                </div>
                <button
                  className="close-btn"
                  onClick={() => setExtrasOpen(false)}
                  aria-label="Close extras"
                  type="button"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="extras-content dark-scroll">
                <InlineSettings
                  currency={currency}
                  baseRateInput={baseRateInput}
                  onBaseRateChange={(val) => {
                    setRatePreset(null);
                    setBaseRateInput(val);
                  }}
                  activePreset={ratePreset}
                  presets={RATE_PRESETS}
                  onPresetSelect={handlePresetSelect}
                  fxInput={fxInputs[currency] ?? ""}
                  onFxChange={(val) => handleFxChange(currency, val)}
                  onResetFx={() => resetFxRate(currency)}
                  splitsEnabled={splitsEnabled}
                  withholdEnabled={withholdEnabled}
                  onToggleSplitsEnabled={toggleSplitsEnabled}
                  onToggleWithholdEnabled={toggleWithholdEnabled}
                  feesInUsdOnly={feesInUsdOnly}
                  onToggleFeesInUsdOnly={toggleFeesInUsdOnly}
                  platformTax={platformTaxInput}
                  setPlatformTax={setPlatformTaxInput}
                  defaultRobuxTax={Number(DEFAULT_PLATFORM_CUT)}
                  showBeforeTax={showBeforeTax}
                  onToggleTaxView={() => setShowBeforeTax((v) => !v)}
                  taxHighlight={taxHighlight}
                  onResetAll={handleResetAll}
                  extrasOpen={extrasOpen}
                />
                <div className="extras-actions">
                  <a
                    className="repo-link"
                    href="https://github.com/CIoudGuy/Roblox-Devex-Calculator"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <Feedback />
      <ThemeMenu
        isOpen={themeOpen}
        setIsOpen={setThemeOpen}
        currentTheme={theme}
        setTheme={handleSetTheme}
      />
      <WelcomeThemeModal
        isOpen={welcomeOpen}
        onClose={handleWelcomeClose}
        currentTheme={theme}
        setTheme={handleSetTheme}
      />

    </>
  );
}





