const state = {
  defaultRate: 0.0038,
  fxToUsd: (window.fxToUsd || { USD: 1 }),
  displayCurrency: "USD",
  eCheckFeeUsd: 5,
};

const clamp = (min, value, max) => Math.min(Math.max(value, min), max);

const parseNumber = (value) =>
  Number(String(value || "").replace(/,/g, "").trim()) || 0;

const formatNumberInput = (input, fractionDigits = 0) => {
  const raw = parseNumber(input.value);
  input.value = raw.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
  return raw;
};

const formatUsdFixed = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

function parseQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const map = { r: "robuxInput", hold: "withhold" };
  Object.entries(map).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const val = params.get(key);
    if (val !== null && val !== "") el.value = val;
  });
}

function initCalculator() {
  const robuxInput = document.getElementById("robuxInput");
  const withhold = document.getElementById("withhold");
  const withholdValue = document.getElementById("withholdValue");
  const splitList = document.getElementById("splitList");
  const addSplitBtn = document.getElementById("addSplit");
  const yourShareDisplay = document.getElementById("yourShareDisplay");
  const splitBar = document.getElementById("splitBar");
  const splitPayoutsBox = document.getElementById("splitPayoutsBox");
  const withholdToggle = document.getElementById("withholdToggle");
  const withholdPanel = document.getElementById("withholdPanel");

  const breakdownValue = document.getElementById("breakdownValue");
  const breakdownLabel = document.getElementById("breakdownLabel");
  const breakdownNote = document.getElementById("breakdownNote");
  const breakdownButtons = Array.from(
    document.querySelectorAll(".pill-btn[data-metric]")
  );
  const exportPngBtn = document.getElementById("exportPng");
  const resultsCard = document.getElementById("resultsCard");
  const fxSelect = document.getElementById("fxSelect");
  const usdInput = document.getElementById("usdInput");
  const convertLabel = document.getElementById("convertLabel");
  const stickyExport = document.getElementById("stickyExport");
  const copyNumbersBtn = document.getElementById("copyNumbers");
  const stickyBar = document.getElementById("stickyBar");
  const lastUpdatedEl = document.getElementById("lastUpdated");
  const fxUpdated = document.getElementById("fxUpdated");
  const resultsGrid = document.querySelector(".results-grid");
  const formatLocalTimestamp = () =>
    new Date().toLocaleString([], { hour12: false, timeZoneName: "short" });
  const touchUpdated = () => {
    if (lastUpdatedEl) lastUpdatedEl.textContent = formatLocalTimestamp();
  };

  parseQueryParams();
  withholdValue.textContent = withhold.value;
  const collaboratorColors = [
    "#8cf5d8",
    "#76c6ff",
    "#f9d66b",
    "#ff9eb6",
    "#9b8df2",
    "#7ee0ff",
    "#f5b971",
    "#7ed5a5",
  ];
  let collaboratorId = 1;

  const readCollaborators = () => {
    if (!splitList) return [];
    return Array.from(splitList.querySelectorAll(".split-row")).map((row, idx) => {
      const nameInput = row.querySelector(".split-name");
      const pctInput = row.querySelector(".split-percent");
      const pct = clamp(0, parseNumber(pctInput?.value), 100);
      return {
        id: row.dataset.id || `${idx}`,
        name: (nameInput?.value || "").trim() || "Collaborator",
        pct,
      };
    });
  };

  const getInputs = () => {
    const collaborators = readCollaborators();
    const totalCuts = collaborators.reduce((sum, c) => sum + c.pct, 0);
    const yourSharePct = clamp(0, 100 - totalCuts, 100);
    return {
      robux: parseNumber(robuxInput.value),
      rate: state.defaultRate,
      holdPct: clamp(0, Number(withhold.value) || 0, 100),
      collaborators,
      yourSharePct,
    };
  };

  const computeOutputs = (inputs) => {
    const grossRaw = inputs.robux * inputs.rate;
    const fee = state.eCheckFeeUsd;
    const totalCuts = inputs.collaborators.reduce((sum, c) => sum + c.pct, 0);
    const yourSharePct = clamp(0, 100 - totalCuts, 100);
    const shareFraction = yourSharePct / 100;
    const holdFraction = 1 - inputs.holdPct / 100;
    const totalAfterFee = Math.max(0, grossRaw - fee);
    const userPreWithhold = totalAfterFee * shareFraction;
    const userAfterWithhold = userPreWithhold * holdFraction;
    const collaboratorAmounts = inputs.collaborators.map((c) => ({
      ...c,
      amount: totalAfterFee * (c.pct / 100),
    }));
    const netFactor = inputs.rate * shareFraction * holdFraction;
    return {
      ...inputs,
      gross: totalAfterFee,
      shared: userPreWithhold,
      withheld: userAfterWithhold,
      afterFee: userAfterWithhold,
      netFactor,
      yourSharePct,
      collaboratorAmounts,
    };
  };

  const formatDisplay = (usdValue) => {
    const rateToUsd = state.fxToUsd[state.displayCurrency] || 1;
    const converted = usdValue / rateToUsd;
    return converted.toLocaleString(undefined, {
      style: "currency",
      currency: state.displayCurrency,
      maximumFractionDigits: 2,
    });
  };

  let activeMetric = "gross";
  let latestOutputs = null;
  let lastConvertRobux = null;
  const currencyNameMap = (window.currencyList || []).reduce((acc, c) => {
    acc[c.code] = c.name || c.code;
    return acc;
  }, {});
  const getCurrencyList = () =>
    window.currencyList && window.currencyList.length
      ? window.currencyList
      : [{ code: "USD", name: "US Dollar" }];

  const populateCurrencies = () => {
    if (!fxSelect) return;
    const list = getCurrencyList();
    fxSelect.innerHTML = "";
    list.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.code;
      opt.textContent = `${c.code} - ${c.name || c.code}`;
      fxSelect.appendChild(opt);
    });
    fxSelect.value = state.displayCurrency;
  };
  populateCurrencies();

  const createSplitRow = (data = {}) => {
    const row = document.createElement("div");
    row.className = "split-row";
    row.dataset.id = data.id || `c${collaboratorId++}`;
    const nameInput = document.createElement("input");
    nameInput.className = "split-name";
    nameInput.placeholder = "Name";
    nameInput.value = data.name || "";

    const pctInput = document.createElement("input");
    pctInput.className = "split-percent";
    pctInput.type = "text";
    pctInput.inputMode = "decimal";
    pctInput.placeholder = "%";
    pctInput.value = data.pct != null ? data.pct : "";

    const removeBtn = document.createElement("button");
    removeBtn.className = "split-remove";
    removeBtn.type = "button";
    removeBtn.textContent = "X";

    const onChange = () => {
      pctInput.value = Math.min(100, Math.max(0, parseNumber(pctInput.value))).toString();
      setActiveMetric("split");
      updateAll();
      convertUsdToRobux();
    };
    nameInput.addEventListener("input", () => {
      updateAll();
      convertUsdToRobux();
    });
    pctInput.addEventListener("input", onChange);
    pctInput.addEventListener("blur", onChange);
    removeBtn.addEventListener("click", () => {
      row.classList.add("fade-out");
      setTimeout(() => {
        row.remove();
        updateAll();
        convertUsdToRobux();
      }, 180);
    });

    row.append(nameInput, pctInput, removeBtn);
    return row;
  };

  if (addSplitBtn) {
    addSplitBtn.addEventListener("click", () => {
      splitList.appendChild(createSplitRow({ name: "Collaborator", pct: 10 }));
      setActiveMetric("split");
      updateAll();
      convertUsdToRobux();
    });
  }

  const breakdownMeta = {
    gross: {
      label: "Gross payout",
      note: () =>
        `Robux value minus ${formatUsdFixed(state.eCheckFeeUsd)} eCheck fee.`,
      get: (o) => o.gross,
    },
    split: {
      label: "After splits",
      note: () =>
        `Your share after splits minus ${formatUsdFixed(
          state.eCheckFeeUsd
        )} eCheck fee.`,
      get: (o) => o.shared,
    },
    withholding: {
      label: "After withholding",
      note: () =>
        `After withholding minus ${formatUsdFixed(
          state.eCheckFeeUsd
        )} eCheck fee.`,
      get: (o) => o.afterFee,
    },
    convert: {
      label: "USD to Robux",
      note: () => "Based on the convert amount with splits, withholding, and fee.",
      get: () => lastConvertRobux || 0,
    },
  };

  const syncWithholdTab = () => {
    // Only show when panel is open
    const isHidden = withholdPanel && withholdPanel.classList.contains("hidden");
    document
      .querySelectorAll('.pill-btn[data-metric="withholding"]')
      .forEach((btn) => btn.classList.toggle("is-hidden", isHidden));
    if (isHidden && activeMetric === "withholding") setActiveMetric("gross");
  };

  const renderBreakdown = (outputs) => {
    if (!breakdownValue) return;
    const meta = breakdownMeta[activeMetric] || breakdownMeta.gross;
    const noteText =
      typeof meta.note === "function" ? meta.note(outputs) : meta.note;
    const label =
      activeMetric === "convert"
        ? `${state.displayCurrency} to Robux`
        : meta.label;
    breakdownLabel.textContent = label;
    if (activeMetric === "convert") {
      breakdownValue.textContent =
        lastConvertRobux != null ? `${lastConvertRobux.toLocaleString()} Robux` : "--";
    } else {
      breakdownValue.textContent = formatDisplay(meta.get(outputs));
    }
    breakdownNote.textContent = noteText;
    breakdownButtons.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.metric === activeMetric)
    );
  };

  const renderSplitBar = (outputs) => {
    if (!splitBar) return;
    splitBar.innerHTML = "";
    const fragments = [];
    const collabs = outputs.collaboratorAmounts || [];
    const userSegment = {
      name: "You",
      pct: outputs.yourSharePct,
      color: "#8cf5d8",
    };
    collabs.forEach((c, idx) => {
      fragments.push({
        pct: c.pct,
        color: collaboratorColors[idx % collaboratorColors.length],
      });
    });
    if (userSegment.pct > 0) fragments.push(userSegment);
    fragments.forEach((seg) => {
      const div = document.createElement("div");
      div.className = "split-segment";
      div.style.width = `${Math.max(seg.pct, 0)}%`;
      div.style.background = seg.color;
      splitBar.appendChild(div);
    });
  };

  const renderSplitPayouts = (outputs) => {
    if (!outputs || !document.getElementById("splitPayouts")) return;
    const list = document.getElementById("splitPayouts");
    const hasCollabs = (outputs.collaboratorAmounts || []).length > 0;
    document
      .querySelectorAll('.pill-btn[data-metric="split"]')
      .forEach((btn) => btn.classList.toggle("is-hidden", !hasCollabs));
    if (splitPayoutsBox) {
      splitPayoutsBox.classList.toggle("is-visible", hasCollabs);
      splitPayoutsBox.setAttribute("aria-hidden", hasCollabs ? "false" : "true");
    }
    if (resultsGrid) resultsGrid.classList.toggle("has-splits", hasCollabs);
    if (!hasCollabs && activeMetric === "split") setActiveMetric("gross");
    if (!hasCollabs) {
      list.innerHTML = "";
      return;
    }
    list.innerHTML = "";
    const rows = [
      ...(outputs.collaboratorAmounts || []).map((c, idx) => ({
        name: c.name,
        pct: c.pct,
        amount: c.amount,
        color: collaboratorColors[idx % collaboratorColors.length],
      })),
    ];
    rows.forEach((row) => {
      const pill = document.createElement("div");
      pill.className = "split-pill";
      const dot = document.createElement("div");
      dot.className = "split-dot";
      dot.style.background = row.color;
      const label = document.createElement("div");
      label.innerHTML = `<strong>${row.name}</strong><br><span class="muted small">${row.pct.toFixed(
        1
      )}%</span>`;
      const amt = document.createElement("div");
      amt.textContent = formatDisplay(row.amount || 0);
      amt.style.textAlign = "right";
      pill.append(dot, label, amt);
      list.appendChild(pill);
    });
  };

  const renderOutputs = (outputs) => {
    latestOutputs = outputs;
    renderBreakdown(outputs);
    if (yourShareDisplay) {
      yourShareDisplay.textContent = `${outputs.yourSharePct.toFixed(1)}%`;
    }
    renderSplitBar(outputs);
    renderSplitPayouts(outputs);
    syncWithholdTab();
  };

  const updateAll = () => {
    const inputs = getInputs();
    const outputs = computeOutputs(inputs);
    renderOutputs(outputs);
    touchUpdated();
    return outputs;
  };

  // Simple rAF debounce for responsiveness
  const rafTask = (fn) => {
    let frame = null;
    return (...args) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        fn(...args);
      });
    };
  };

  const scheduledUpdateAll = rafTask(() => {
    updateAll();
    convertUsdToRobux();
  });
  const scheduledConvert = rafTask(() => convertUsdToRobux(true));

  // Live formatting for numeric inputs
  [robuxInput, usdInput].forEach((el) => {
    el.addEventListener("input", () => {
      formatNumberInput(el, el === usdInput ? 2 : 0);
      if (el === usdInput) {
        scheduledConvert();
      } else {
        scheduledUpdateAll();
      }
    });
  });

  withhold.addEventListener("input", () => {
    withholdValue.textContent = withhold.value;
    updateAll();
    convertUsdToRobux();
  });

  if (withholdToggle && withholdPanel) {
    withholdToggle.addEventListener("click", () => {
      const isHidden = withholdPanel.classList.contains("hidden");
      withholdPanel.classList.toggle("hidden");
      setActiveMetric(isHidden ? "withholding" : "gross");
      if (isHidden) {
        withhold.focus();
      } else if (activeMetric === "withholding") {
        setActiveMetric("gross");
      }
      syncWithholdTab();
    });
    syncWithholdTab();
  }

  const exportPng = async () => {
    if (!window.html2canvas) {
      console.warn("html2canvas missing");
      return;
    }
    updateAll();
    convertUsdToRobux();
    if (fxSelect && fxSelect.value !== state.displayCurrency) {
      fxSelect.value = state.displayCurrency;
    }
    document.body.classList.add("exporting");
    const buildExportNode = () => {
      const wrapper = document.createElement("div");
      wrapper.className = "export-wrapper";
      const clone = resultsCard
        ? resultsCard.cloneNode(true)
        : document.querySelector(".page").cloneNode(true);
      clone.classList.add("export-glow");
      // Remove buttons that aren't needed
      clone.querySelectorAll("button").forEach((btn) => {
        if (!btn.classList.contains("pill-btn")) btn.remove();
      });
      // Convert selects to labels
      clone.querySelectorAll("select").forEach((sel) => {
        const label = document.createElement("div");
        label.className = "export-select";
        let text = "";
        if (fxSelect && fxSelect.options && fxSelect.selectedIndex >= 0) {
          text = fxSelect.options[fxSelect.selectedIndex].textContent || "";
        } else if (sel.options && sel.selectedIndex >= 0) {
          text = sel.options[sel.selectedIndex].textContent || sel.value || "";
        } else {
          text = sel.value || "";
        }
        label.textContent = text;
        sel.replaceWith(label);
      });
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);
      return { node: clone, cleanup: () => wrapper.remove() };
    };

    const { node, cleanup } = buildExportNode();
    try {
      await new Promise((r) => requestAnimationFrame(r));
      const canvas = await window.html2canvas(node, {
        backgroundColor: "#05060b",
        scale: 2,
        useCORS: true,
        ignoreElements: (el) => el.tagName === "CANVAS",
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "devex-results.png";
      link.click();
    } catch (err) {
      console.error("PNG export failed", err);
    } finally {
      cleanup();
      document.body.classList.remove("exporting");
    }
  };
  exportPngBtn.addEventListener("click", exportPng);
  if (stickyExport) stickyExport.addEventListener("click", exportPng);

  const copyNumbers = async () => {
    if (!latestOutputs) updateAll();
    const opts = latestOutputs || computeOutputs(getInputs());
    const convertText =
      lastConvertRobux != null ? `${lastConvertRobux.toLocaleString()} Robux` : "--";
    const parts = [
      `Currency: ${state.displayCurrency}`,
      `Gross: ${formatDisplay(opts.gross)}`,
      `After splits: ${formatDisplay(opts.shared)}`,
      `After withholding + fee: ${formatDisplay(opts.afterFee)}`,
      `Convert (${state.displayCurrency} -> Robux): ${convertText}`,
    ];
    const text = parts.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Clipboard failed", err);
    }
  };
  if (copyNumbersBtn) copyNumbersBtn.addEventListener("click", copyNumbers);

  const convertUsdToRobux = (fromInput = false) => {
    if (fromInput) setActiveMetric("convert");
    const amount = parseNumber(usdInput.value);
    if (!amount) {
      lastConvertRobux = null;
      if (activeMetric === "convert") {
        renderBreakdown(latestOutputs || computeOutputs(getInputs()));
      }
      touchUpdated();
      return;
    }
    const inputs = getInputs();
    const shareFraction = inputs.yourSharePct / 100;
    const holdFraction = 1 - inputs.holdPct / 100;
    const rateToUsd = state.fxToUsd[state.displayCurrency] || 1;
    const targetUsd = amount * rateToUsd;
    const netFactor = inputs.rate * shareFraction * holdFraction;
    const grossUsdNeeded =
      netFactor > 0
        ? targetUsd / (shareFraction * holdFraction)
        : targetUsd;
    const totalUsd = grossUsdNeeded + state.eCheckFeeUsd;
    const robuxNeeded = Math.ceil(totalUsd / inputs.rate);
    lastConvertRobux = robuxNeeded;
    if (activeMetric === "convert") renderBreakdown(latestOutputs || computeOutputs(getInputs()));
    touchUpdated();
  };

  breakdownButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      activeMetric = btn.dataset.metric || "gross";
      if (latestOutputs) {
        renderBreakdown(latestOutputs);
      }
    })
  );

  document.querySelectorAll(".collapse-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      if (!card) return;
      card.classList.toggle("collapsed");
      touchUpdated();
    });
  });

  const setActiveMetric = (metric) => {
    if (metric && breakdownMeta[metric]) {
      activeMetric = metric;
      if (latestOutputs) renderBreakdown(latestOutputs);
    }
  };

  const inputMetricMap = new Map([
    [robuxInput, "gross"],
    [withhold, "withholding"],
    [usdInput, "convert"],
    [splitList, "split"],
  ]);

  inputMetricMap.forEach((metric, el) => {
    if (!el) return;
    ["focus", "input"].forEach((evt) =>
      el.addEventListener(evt, () => {
        if (el === usdInput && evt === "input") return; // handled in conversion
        setActiveMetric(metric);
        touchUpdated();
      })
    );
  });

  const updateCurrencyDisplay = () => {
    const next = fxSelect && fxSelect.value ? fxSelect.value : "USD";
    const nextCurrency = state.fxToUsd[next] ? next : "USD";
    state.displayCurrency = nextCurrency;
    if (fxSelect && fxSelect.value !== nextCurrency) {
      fxSelect.value = nextCurrency;
    }
    if (convertLabel) {
      convertLabel.textContent = `${nextCurrency} to Robux`;
    }
    breakdownMeta.convert.label = `${nextCurrency} to Robux`;
    document
      .querySelectorAll('.pill-btn[data-metric="convert"]')
      .forEach((btn) => (btn.textContent = `${nextCurrency} to Robux`));
    usdInput.placeholder = `Enter ${nextCurrency}`;
    updateAll();
    convertUsdToRobux();
    touchUpdated();
  };

  fxSelect.addEventListener("change", updateCurrencyDisplay);
  const fetchEcbRates = async () => {
    if (fxUpdated) {
      fxUpdated.textContent = "?";
      fxUpdated.dataset.tooltip = "Updating from ECB...";
    }
    try {
      const res = await fetch("https://api.exchangerate.host/latest?base=USD&source=ecb");
      const data = await res.json();
      if (data && data.rates) {
        const rates = { USD: 1 };
        Object.entries(data.rates).forEach(([code, val]) => {
          const num = Number(val);
          if (num > 0) rates[code] = 1 / num;
        });
        state.fxToUsd = rates;
        window.fxToUsd = rates;
        const dynamicList = Object.keys(rates)
          .sort()
          .map((code) => ({ code, name: currencyNameMap[code] || code }));
        window.currencyList = dynamicList;
        populateCurrencies();
        if (fxSelect && !state.fxToUsd[state.displayCurrency]) {
          state.displayCurrency = "USD";
          fxSelect.value = "USD";
        }
        if (fxUpdated) {
          const tsRaw = data.timestamp
            ? new Date(data.timestamp * 1000)
            : new Date(data.date || Date.now());
          const tsText = tsRaw.toLocaleString();
          fxUpdated.dataset.tooltip = `ECB updated ${tsText}`;
          fxUpdated.textContent = "?";
        }
        updateCurrencyDisplay();
        touchUpdated();
        return;
      }
    } catch (e) {
      console.warn("ECB rates fetch failed", e);
    }
    if (fxUpdated) {
      fxUpdated.dataset.tooltip = "Using static FX fallback";
      fxUpdated.textContent = "?";
    }
    if (!window.currencyList || !window.currencyList.length) {
      window.currencyList = Object.keys(state.fxToUsd).map((code) => ({
        code,
        name: currencyNameMap[code] || code,
      }));
    }
    populateCurrencies();
    updateCurrencyDisplay();
    touchUpdated();
  };

  fetchEcbRates();

  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = formatLocalTimestamp();
  }
}

document.addEventListener("DOMContentLoaded", initCalculator);
