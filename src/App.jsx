import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import BackgroundCanvas from "./components/BackgroundCanvas.jsx";
import AmountInputs from "./components/AmountInputs.jsx";
import AdjustmentsPanel from "./components/AdjustmentsPanel.jsx";
import ResultsCard from "./components/ResultsCard.jsx";
import StickyBar from "./components/StickyBar.jsx";
import { fxToUsd } from "./data/currencies.js";
import html2canvas from "html2canvas";

const clamp = (min, val, max) => Math.min(Math.max(val, min), max);
const parseNumber = (value) => Number(String(value || "").replace(/,/g, "").trim()) || 0;
const formatCurrency = (value, code = "USD") =>
  Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  });

const INPUT_LIMIT = 20_000_000_000;
const BASE_RATE = 0.0038;
const FEE = 5;

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const defaultSplit = () => ({ id: makeId(), name: "Collaborator", pct: 10 });

export default function App() {
  const [robuxInput, setRobuxInput] = useState("");
  const [usdInput, setUsdInput] = useState("");
  const [withhold, setWithhold] = useState(10);
  const [activeMetric, setActiveMetric] = useState("gross");
  const [splits, setSplits] = useState([]);
  const [currency, setCurrency] = useState("USD");
  const [lastConvertRobux, setLastConvertRobux] = useState(null);
  const [withholdOpen, setWithholdOpen] = useState(false);
  const [splitsOpen, setSplitsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const hasCollabs = splits.length > 0;

  const formatNumberInput = (value, fractionDigits = 0) => {
    let num = parseNumber(value);
    num = Math.min(num, INPUT_LIMIT);
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
    });
  };

  const totals = useMemo(() => {
    const robux = parseNumber(robuxInput);
    const grossRaw = robux * BASE_RATE;
    const totalAfterFee = Math.max(0, grossRaw - FEE);
    const totalCuts = splits.reduce((sum, s) => sum + clamp(0, Number(s.pct) || 0, 100), 0);
    const yourSharePct = clamp(0, 100 - totalCuts, 100);
    const shareFraction = yourSharePct / 100;
    const holdFraction = 1 - withhold / 100;
    const shared = totalAfterFee * shareFraction;
    const withheld = shared * holdFraction;
    const collaboratorAmounts = splits.map((c) => ({
      ...c,
      pct: clamp(0, Number(c.pct) || 0, 100),
      amount: totalAfterFee * ((Number(c.pct) || 0) / 100),
    }));
    return { totalAfterFee, shared, withheld, yourSharePct, collaboratorAmounts };
  }, [robuxInput, splits, withhold]);

  useEffect(() => {
    if (!hasCollabs && activeMetric === "split") setActiveMetric("gross");
  }, [hasCollabs, activeMetric]);

  useEffect(() => {
    if (!withholdOpen && activeMetric === "withholding") setActiveMetric("gross");
  }, [withholdOpen, activeMetric]);

  const breakdownMeta = {
    gross: {
      label: "Gross payout",
      note: `Robux value minus ${formatCurrency(FEE)} eCheck fee.`,
      get: (o) => o.totalAfterFee,
    },
    split: {
      label: "After splits",
      note: `Your share after splits minus ${formatCurrency(FEE)} eCheck fee.`,
      get: (o) => o.shared,
    },
    withholding: {
      label: "After withholding",
      note: `After withholding minus ${formatCurrency(FEE)} eCheck fee.`,
      get: (o) => o.withheld,
    },
    convert: {
      label: `${currency} to Robux`,
      note: "Direct conversion from the entered amount to Robux (ceil).",
      get: () => lastConvertRobux || 0,
    },
  };

  const handleAddSplit = () => {
    setSplitsOpen(true);
    setActiveMetric("split");
    setSplits((prev) => [...prev, defaultSplit()]);
  };

  const handleSplitChange = (id, field, val) => {
    setSplits((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              [field]: field === "pct" ? clamp(0, parseNumber(val), 100) : val,
            }
          : s
      )
    );
  };

  const handleRemoveSplit = (id) => setSplits((prev) => prev.filter((s) => s.id !== id));

  const convertUsdToRobux = (val) => {
    const amt = parseNumber(val);
    if (!amt) {
      setLastConvertRobux(null);
      return;
    }
    const rateToUsd = fxToUsd[currency] || 1;
    const targetUsd = amt * rateToUsd;
    const robuxNeeded = Math.ceil(targetUsd / BASE_RATE);
    setLastConvertRobux(robuxNeeded);
    setActiveMetric("convert");
  };

  const breakdown = breakdownMeta[activeMetric] || breakdownMeta.gross;
  const resultValue =
    activeMetric === "convert"
      ? lastConvertRobux != null
        ? `${lastConvertRobux.toLocaleString()} Robux`
        : "--"
      : formatCurrency(breakdown.get(totals), currency);

  const exportPng = async () => {
    const node = document.getElementById("resultsCard");
    if (!node) return;
    const canvas = await html2canvas(node, {
      backgroundColor: "#05060b",
      scale: window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio || 1,
    });
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "devex-results.png";
    link.click();
  };

  const copyNumbers = async () => {
    const summary = [
      `Currency: ${currency}`,
      `Gross: ${formatCurrency(breakdownMeta.gross.get(totals), currency)}`,
      `After splits: ${formatCurrency(breakdownMeta.split.get(totals), currency)}`,
      `After withholding: ${formatCurrency(breakdownMeta.withholding.get(totals), currency)}`,
      `Withholding: ${withhold}%`,
      splits.length ? `Collaborators: ${splits.length}` : "Collaborators: none",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      console.warn("Clipboard not available");
    }
  };

  const containerVariants = {
    mobile: { gap: 12, padding: "24px 10px 80px" },
    desktop: { gap: 16, padding: "48px clamp(18px, 4vw, 60px) 72px" },
  };

  const splitsWithAmounts = totals.collaboratorAmounts;
  const lastUpdated =
    document.lastModified && !Number.isNaN(Date.parse(document.lastModified))
      ? new Date(document.lastModified).toLocaleString([], { hour12: false, timeZoneName: "short" })
      : "N/A";

  return (
    <>
      <BackgroundCanvas />
      <motion.main
        className="page"
        variants={containerVariants}
        initial={isMobile ? "mobile" : "desktop"}
        animate={isMobile ? "mobile" : "desktop"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      >
        <section className="grid">
          <section className="card wide">
            <div className="card-head">
              <h2>Inputs</h2>
              <button className="collapse-toggle" type="button" data-target="inputsCard">
                Toggle
              </button>
            </div>
            <div className="form-grid" id="inputsCard">
              <AmountInputs
                currency={currency}
                robuxInput={robuxInput}
                usdInput={usdInput}
                onRobuxChange={(val) => setRobuxInput(formatNumberInput(val, 0))}
                onUsdChange={(val) => {
                  const formatted = formatNumberInput(val, 2);
                  setUsdInput(formatted);
                  convertUsdToRobux(formatted);
                }}
              />

              <AdjustmentsPanel
                totals={totals}
                splits={splits}
                splitsOpen={splitsOpen}
                onToggleSplits={() => setSplitsOpen((v) => !v)}
                onAddSplit={handleAddSplit}
                onRemoveSplit={handleRemoveSplit}
                onSplitChange={handleSplitChange}
                withhold={withhold}
                withholdOpen={withholdOpen}
                onToggleWithhold={() => setWithholdOpen((v) => !v)}
                onWithholdChange={setWithhold}
              />
            </div>
          </section>

          <ResultsCard
            currency={currency}
            onCurrencyChange={setCurrency}
            onExport={exportPng}
            formatCurrency={formatCurrency}
            fxStatus="OK"
            hasCollabs={hasCollabs}
            withholdOpen={withholdOpen}
            activeMetric={activeMetric}
            setActiveMetric={setActiveMetric}
            breakdown={breakdown}
            resultValue={resultValue}
            totals={totals}
            splits={splitsWithAmounts}
          />
        </section>

        <StickyBar onExport={exportPng} onCopy={copyNumbers} />

        <footer className="footer">
          <div className="beta-note">
            <span className="beta-text">Still in beta - expect changes.</span>
            <span className="beta-text">Last updated: {lastUpdated}</span>
            <a className="repo-link" href="https://github.com/CIoudGuy/Roblox-Devex-Calculator" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </div>
        </footer>
      </motion.main>
    </>
  );
}
