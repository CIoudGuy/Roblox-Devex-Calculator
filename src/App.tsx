import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import BackgroundCanvas from "./components/BackgroundCanvas";
import AmountInputs from "./components/AmountInputs";
import AdjustmentsPanel from "./components/AdjustmentsPanel";
import ResultsCard from "./components/ResultsCard";
import StickyBar from "./components/StickyBar";
import InlineSettings from "./components/InlineSettings";
import BetaNotice from "./components/BetaNotice";
import { currencyList, fxToUsd } from "./data/currencies";
import { DEFAULT_BASE_RATE, INPUT_LIMIT, RATE_PRESETS } from "./constants/rates";
import { clamp, formatCurrency, formatNumberInput, parseNumber } from "./utils/numbers";
import { defaultSplit } from "./utils/splits";
import { useTotals } from "./hooks/useTotals";
import { useIsMobile } from "./hooks/useIsMobile";
import type { BreakdownItem, BreakdownKey, CurrencyCode, FxRates, RatePreset, Split } from "./types";

const STORAGE_KEY = "devex-config-v1";
const BETA_DISMISS_KEY = "devex-beta-dismissed-v1";

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
  const [withholdOpen, setWithholdOpen] = useState<boolean>(false);
  const [splitsOpen, setSplitsOpen] = useState<boolean>(false);
  const [extrasOpen, setExtrasOpen] = useState<boolean>(false);
  const [splitsEnabled, setSplitsEnabled] = useState<boolean>(false);
  const [withholdEnabled, setWithholdEnabled] = useState<boolean>(false);
  const [ratePreset, setRatePreset] = useState<string | null>(RATE_PRESETS[0].id);
  const [baseRateInput, setBaseRateInput] = useState<string>(String(DEFAULT_BASE_RATE));
  const [robuxTaxInput, setRobuxTaxInput] = useState<string>("30");
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
  const [taxHighlight, setTaxHighlight] = useState<boolean>(false);
  const [loadedSettings, setLoadedSettings] = useState<boolean>(false);
  const [showBetaNotice, setShowBetaNotice] = useState<boolean>(false);

  const isMobile = useIsMobile();
  const activeSplits = splitsEnabled ? splits : [];
  const hasCollabs = activeSplits.length > 0;
  const showAdjustments = splitsEnabled || withholdEnabled;

  const baseRate = useMemo<number>(() => {
    const parsed = parseNumber(baseRateInput);
    return parsed > 0 ? parsed : DEFAULT_BASE_RATE;
  }, [baseRateInput]);

  const robuxTaxPct = useMemo<number>(() => clamp(0, parseNumber(robuxTaxInput), 100), [robuxTaxInput]);

  const fee = 5;

  const totals = useTotals({
    robuxInput,
    splits: activeSplits,
    withhold: withholdEnabled ? withhold : 0,
    baseRate,
    fee,
  });

  useEffect(() => {
    setFxStatus("Updating...");
    let isActive = true;
    const fetchRates = async () => {
      try {
        const fetchWithTimeout = (url: string, ms = 5000): Promise<Response> =>
          Promise.race([
            fetch(url),
            new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
          ]);

        const sources = [
          "https://open.er-api.com/v6/latest/USD",
          "https://api.exchangerate.host/latest?base=USD&source=ecb&places=6",
        ];

        let rates: Record<string, number> | null = null;
        let baseCode: CurrencyCode = "USD";
        for (const url of sources) {
          try {
            const res = await fetchWithTimeout(url);
            if (!res.ok) continue;
            const data: any = await res.json();
            // open.er-api.com format
            if (data?.result === "success" && data?.rates) {
              rates = data.rates;
              baseCode = (data.base_code || data.base || "USD").toUpperCase?.() || "USD";
              break;
            }
            // exchangerate.host format
            if (data?.rates) {
              rates = data.rates;
              baseCode = (data.base || "USD").toUpperCase?.() || "USD";
              break;
            }
          } catch {
            continue;
          }
        }

        if (!isActive) return;

        if (!rates) {
          setFxStatus("Offline");
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
        setFxStatus(`Live ${new Date().toLocaleTimeString([], { hour12: false })}`);
      } catch (err) {
        console.warn("FX fetch error", err);
        if (isActive) setFxStatus("Offline");
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

  const afterTaxRobux = useMemo(() => {
    const raw = parseNumber(robuxInput);
    const rate = 1 - robuxTaxPct / 100;
    return Math.max(0, Math.round(raw * rate));
  }, [robuxInput, robuxTaxPct]);

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
    setWithhold(10);
    setWithholdEnabled(false);
    setWithholdOpen(false);
    setSplitsEnabled(false);
    setSplitsOpen(false);
    setSplits([]);
    setRatePreset(RATE_PRESETS[0].id);
    setBaseRateInput(String(DEFAULT_BASE_RATE));
    setRobuxTaxInput("30");
    setActiveMetric("gross");
    setFxRates(fxBaseRates);
    setFxInputs(defaultFx);
    setTaxHighlight(false);
    setFxOverride(false);
  };

  const handleDismissBetaNotice = () => setShowBetaNotice(false);

  const handleDisableBetaNotice = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(BETA_DISMISS_KEY, "1");
      } catch (err) {
        console.warn("Failed to store beta preference", err);
      }
    }
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
        robuxTaxInput: string;
        fxOverride: boolean;
        fxInputs: Record<string, number | string>;
      }>;
      if (data && typeof data === "object") {
        if (typeof data.currency === "string") setCurrency(data.currency);
        if (typeof data.withhold === "number") setWithhold(data.withhold);
        if (typeof data.withholdEnabled === "boolean") setWithholdEnabled(data.withholdEnabled);
        if (typeof data.splitsEnabled === "boolean") setSplitsEnabled(data.splitsEnabled);
        if (typeof data.baseRateInput === "string") setBaseRateInput(data.baseRateInput);
        if (typeof data.ratePreset === "string") setRatePreset(data.ratePreset);
        if (typeof data.robuxTaxInput === "string") setRobuxTaxInput(data.robuxTaxInput);
        if (typeof data.fxOverride === "boolean") setFxOverride(data.fxOverride);
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
      const shouldShow = window.localStorage.getItem(BETA_DISMISS_KEY) !== "1";
      setShowBetaNotice(shouldShow);
    } catch (err) {
      console.warn("Failed to read beta preference", err);
      setShowBetaNotice(true);
    }
  }, []);


  useEffect(() => {
    if (!loadedSettings || typeof window === "undefined") return;
    const payload = {
      currency,
      withhold,
      withholdEnabled,
      splitsEnabled,
      baseRateInput,
      ratePreset,
      robuxTaxInput,
      fxInputs,
      fxOverride,
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
    robuxTaxInput,
    fxInputs,
    fxOverride,
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

  const breakdownMeta: Record<BreakdownKey, BreakdownItem> = {
    gross: {
      label: "Gross payout",
      note: () => "$5 eCheck fee applied.",
      get: (o) => o.totalAfterFee,
    },
    split: {
      label: "After splits",
      note: (o) => `${o.yourSharePct.toFixed(1)}% share after $5 fee.`,
      get: (o) => o.shared,
    },
    withholding: {
      label: "After withholding",
      note: () => "Withholding after $5 fee.",
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
  const resultValue =
    activeMetric === "convert"
      ? convertMeta
        ? `${convertMeta.robuxNeeded.toLocaleString()} Robux`
        : "--"
      : formatDisplayCurrency(breakdown.get(totals));

  const [isExporting, setIsExporting] = useState(false);

  const exportPng = async () => {
    setIsExporting(true);
    // Small delay to allow UI to update (e.g. show spinner)
    await new Promise((resolve) => setTimeout(resolve, 50));

    const originalNode = document.getElementById("resultsCard");
    if (!(originalNode instanceof HTMLElement)) {
      setIsExporting(false);
      return;
    }

    try {
      document.body.classList.add("exporting");
      const container = document.createElement("div");
      container.className = "export-mount";

      const wrapper = document.createElement("div");
      wrapper.className = "export-wrapper";
      const targetWidth = Math.max(900, originalNode.offsetWidth || 0, 720);
      wrapper.style.width = `${targetWidth}px`;

      const clone = originalNode.cloneNode(true) as HTMLElement;
      clone.classList.add("export-card");

      const branding = document.createElement("div");
      branding.className = "export-branding";
      branding.innerText = "https://devex-calculator.dev/";

      wrapper.appendChild(clone);
      wrapper.appendChild(branding);
      container.appendChild(wrapper);
      document.body.appendChild(container);

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const canvas = await html2canvas(wrapper, {
        backgroundColor: "#05060b",
        scale: 2,
        logging: false,
        useCORS: true,
        ignoreElements: (element) => element.classList.contains("no-export"),
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "devex-results.png";
      link.click();

      document.body.removeChild(container);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      document.body.classList.remove("exporting");
      setIsExporting(false);
    }
  };

  const copyNumbers = async () => {
    const summary = [
      `Currency: ${currency}`,
      `Gross: ${formatDisplayCurrency(breakdownMeta.gross.get(totals))}`,
      `After splits: ${formatDisplayCurrency(breakdownMeta.split.get(totals))}`,
      `After withholding: ${formatDisplayCurrency(breakdownMeta.withholding.get(totals))}`,
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
      ? new Date(document.lastModified).toLocaleString([], { hour12: false, timeZoneName: "short" })
      : "N/A";

  const hasModifiedExtras = useMemo(() => {
    const isBaseRateModified = baseRateInput !== String(DEFAULT_BASE_RATE);
    const isTaxModified = robuxTaxInput !== "30";
    return isBaseRateModified || isTaxModified || fxOverride;
  }, [baseRateInput, robuxTaxInput, fxOverride]);

  return (
    <>
      <BackgroundCanvas />
      <BetaNotice open={showBetaNotice} onClose={handleDismissBetaNotice} onDisable={handleDisableBetaNotice} />
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
                  className={`icon-btn ghost extras-toggle ${hasModifiedExtras ? "has-updates" : ""}`}
                  type="button"
                  onClick={() => setExtrasOpen((v) => !v)}
                >
                  {extrasOpen ? "Hide extras" : "Show extras"}
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
                afterTaxRobux={afterTaxRobux}
                onOpenTaxSettings={handleOpenTaxSettings}
                onRobuxChange={(val) => setRobuxInput(formatNumberInput(val, 0, INPUT_LIMIT))}
                onUsdChange={(val) => {
                  const formatted = formatNumberInput(val, 2, INPUT_LIMIT);
                  setUsdInput(formatted);
                  setActiveMetric("convert");
                }}
                onActiveMetricChange={setActiveMetric}
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

            <AnimatePresence initial={false}>
              {extrasOpen && (
                <motion.div
                  className="extras-inline"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  layout
                >
                  <InlineSettings
                    currency={currency}
                    onCurrencyChange={setCurrency}
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
                    robuxTaxInput={robuxTaxInput}
                    onRobuxTaxChange={setRobuxTaxInput}
                    defaultRobuxTax={30}
                    taxHighlight={taxHighlight}
                    onResetAll={handleResetAll}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <ResultsCard
            currency={currency}
            onCurrencyChange={setCurrency}
            onExport={exportPng}
            formatCurrency={formatDisplayCurrency}
            hasCollabs={hasCollabs}
            withholdOpen={withholdOpen}
            activeMetric={activeMetric}
            setActiveMetric={setActiveMetric}
            breakdown={breakdown}
            resultValue={resultValue}
            isExporting={isExporting}
            totals={totals}
            splits={splitsWithAmounts}
          />
        </section>

        <StickyBar onExport={exportPng} onCopy={copyNumbers} />

        <footer className="footer">
          <div className="beta-note">
            <span className="beta-text beta-warning">Still in beta - expect changes.</span>
            <span className="beta-text">Last updated: {lastUpdated}</span>
            <span className="beta-text small">FX status: {fxStatus || "Live"}</span>
            <a className="repo-link" href="https://github.com/CIoudGuy/Roblox-Devex-Calculator" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </div>
        </footer>
      </motion.main>
    </>
  );
}
