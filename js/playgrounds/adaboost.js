import { clamp, formatNumber } from "../core/math.js";
import {
  ADABOOST_DATASET,
  calculateStumpWeight,
  ensemblePrediction,
  ensembleScore,
  ensembleVotes,
  evaluateStump,
  findBestStump,
  predictWithStump,
  updateSampleWeights,
} from "../core/adaboost.js";
import { addText, drawCartesianFrame, makeScales, makeTicks, svgElement } from "../core/plot.js";

const PLOT = Object.freeze({
  width: 800,
  height: 500,
  margin: { top: 28, right: 26, bottom: 58, left: 70 },
  xMin: 0,
  xMax: 10,
  yMin: 0,
  yMax: 10,
});

const DEFAULT_WEAK_LEARNERS = 5;
const DEFAULT_LEARNING_RATE = 1;
const AUTO_STEP_LIMIT = 40;
const PHASE_LABELS = Object.freeze({
  fit: "Fit Stump",
  evaluate: "Evaluate",
  alpha: "Calculate Stump Weight",
  update: "Update Sample Weights",
  final: "Final Ensemble",
});

function cloneStump(stump) {
  return stump ? { ...stump } : null;
}

function cloneState(state) {
  return {
    ...state,
    weights: [...state.weights],
    currentStump: cloneStump(state.currentStump),
    currentPredictions: [...state.currentPredictions],
    misclassified: [...state.misclassified],
    ensemble: state.ensemble.map((stump) => ({ ...stump })),
    selectedStumpIndex: state.selectedStumpIndex,
    inference: state.inference ? { ...state.inference } : null,
    inferenceVotes: state.inferenceVotes.map((vote) => ({ ...vote })),
  };
}

function createInitialState({ weakLearners = DEFAULT_WEAK_LEARNERS, learningRate = DEFAULT_LEARNING_RATE, action = "reset" } = {}) {
  return {
    weakLearners,
    learningRate,
    round: 1,
    phase: "fit",
    mode: "training",
    weights: Array(ADABOOST_DATASET.length).fill(1 / ADABOOST_DATASET.length),
    currentStump: null,
    currentPredictions: [],
    misclassified: [],
    stumpError: null,
    rawAlpha: null,
    currentAlpha: null,
    ensemble: [],
    selectedStumpIndex: null,
    inference: null,
    inferenceVotes: [],
    action,
  };
}

function className(label) {
  return label === -1 ? "Class A" : "Class B";
}

function featureLabel(feature) {
  return feature === "x" ? "X₁" : "X₂";
}

function stumpDescription(stump) {
  if (!stump) return "No stump fitted";
  const lowClass = stump.polarity === 1 ? "Class A" : "Class B";
  const highClass = stump.polarity === 1 ? "Class B" : "Class A";
  return `${featureLabel(stump.feature)} < ${formatNumber(stump.threshold)} → ${lowClass}; otherwise ${highClass}`;
}

function getPhaseStatus(state, autoRunning) {
  if (state.mode === "inference") return "Inference · ensemble fixed";
  if (autoRunning) return `Training · ${PHASE_LABELS[state.phase].toLowerCase()}`;
  if (state.phase === "final") return "Fitted · weighted ensemble ready";
  if (state.phase === "fit" && state.ensemble.length === 0) return "Ready · equal sample weights";
  if (state.phase === "fit") return `Training · fit stump ${state.round}`;
  if (state.phase === "evaluate") return `Training · evaluate stump ${state.round}`;
  if (state.phase === "alpha") return `Training · calculate stump weight ${state.round}`;
  return `Training · update sample weights ${state.round}`;
}

function getInferenceVotes(point, ensemble) {
  return (ensemble ?? []).map((stump) => ({
    prediction: predictWithStump(stump, point),
    alpha: Number(stump.alpha || 0),
  }));
}

function getExplanation(state) {
  if (state.action === "config-change") return "The ensemble was reset so the new configuration starts again from equal sample weights.";
  if (state.mode === "inference") {
    if (!state.inference || !state.inferenceVotes.length) return "Inference is ready. Click the plot to see each stump vote and the final weighted prediction.";
    const prediction = className(state.inferenceVotes.reduce((sum, vote) => sum + vote.alpha * vote.prediction, 0) >= 0 ? 1 : -1);
    return `Each fitted stump votes independently. The weighted vote predicts the new point as ${prediction}; training weights and stumps remain unchanged.`;
  }
  if (state.action === "stump-select" && state.selectedStumpIndex !== null) {
    const stump = state.ensemble[state.selectedStumpIndex];
    return `Stump ${state.selectedStumpIndex + 1} uses ${stumpDescription(stump)} with alpha ${formatNumber(stump.alpha)}. The boundary is shown for inspection.`;
  }
  if (state.phase === "fit") {
    if (state.ensemble.length === 0) return "All observations start with equal weights. The first decision stump will find the lowest weighted error.";
    return `Round ${state.round} starts with updated sample weights. The next stump gives more influence to observations that previous stumps missed.`;
  }
  if (state.phase === "evaluate") {
    const mistakes = state.misclassified.filter(Boolean).length;
    return `Stump ${state.round} misclassified ${mistakes} observation${mistakes === 1 ? "" : "s"}. Their current weights contribute to the weighted error.`;
  }
  if (state.phase === "alpha") {
    return `The stump error is ${formatNumber(state.stumpError)}. Its alpha is ${formatNumber(state.currentAlpha)}, so it contributes this much to the final weighted vote.`;
  }
  if (state.phase === "update") {
    const mistakes = state.misclassified.filter(Boolean).length;
    return `${mistakes} misclassified observation${mistakes === 1 ? " receives" : "s receive"} more weight, so the next weak learner will pay more attention to them.`;
  }
  if (state.phase === "final") {
    return `The final prediction combines ${state.ensemble.length} decision stump${state.ensemble.length === 1 ? "" : "s"} using a weighted vote. Larger alpha values contribute more strongly.`;
  }
  return "AdaBoost combines simple decision stumps by giving later stumps more attention to earlier mistakes.";
}

function drawEnsembleRegions(parent, scales, ensemble) {
  if (!ensemble.length) return;
  const regionLayer = svgElement("g", { class: "adaboost-ensemble-regions", "aria-label": "Final ensemble decision regions" });
  const boundaryLayer = svgElement("g", { class: "adaboost-ensemble-boundaries", "aria-label": "Final ensemble boundaries" });
  const steps = 20;
  const cellWidth = (PLOT.xMax - PLOT.xMin) / steps;
  const cellHeight = (PLOT.yMax - PLOT.yMin) / steps;
  const predictions = Array.from({ length: steps }, (_, ix) => Array.from({ length: steps }, (_, iy) => (
    ensemblePrediction({ x: PLOT.xMin + (ix + 0.5) * cellWidth, y: PLOT.yMin + (iy + 0.5) * cellHeight }, ensemble)
  )));

  for (let ix = 0; ix < steps; ix += 1) {
    for (let iy = 0; iy < steps; iy += 1) {
      const prediction = predictions[ix][iy];
      const x = scales.xScale(PLOT.xMin + ix * cellWidth);
      const y = scales.yScale(PLOT.yMin + (iy + 1) * cellHeight);
      regionLayer.append(svgElement("rect", {
        class: `adaboost-ensemble-region ${prediction === -1 ? "class-a" : "class-b"}`,
        x,
        y,
        width: scales.xScale(PLOT.xMin + (ix + 1) * cellWidth) - x + 0.5,
        height: scales.yScale(PLOT.yMin + iy * cellHeight) - y + 0.5,
      }));
      if (ix < steps - 1 && predictions[ix + 1][iy] !== prediction) {
        const boundaryX = scales.xScale(PLOT.xMin + (ix + 1) * cellWidth);
        boundaryLayer.append(svgElement("line", {
          class: "adaboost-ensemble-boundary",
          x1: boundaryX,
          x2: boundaryX,
          y1: scales.yScale(PLOT.yMin + iy * cellHeight),
          y2: scales.yScale(PLOT.yMin + (iy + 1) * cellHeight),
        }));
      }
      if (iy < steps - 1 && predictions[ix][iy + 1] !== prediction) {
        const boundaryY = scales.yScale(PLOT.yMin + (iy + 1) * cellHeight);
        boundaryLayer.append(svgElement("line", {
          class: "adaboost-ensemble-boundary",
          x1: scales.xScale(PLOT.xMin + ix * cellWidth),
          x2: scales.xScale(PLOT.xMin + (ix + 1) * cellWidth),
          y1: boundaryY,
          y2: boundaryY,
        }));
      }
    }
  }
  parent.append(regionLayer, boundaryLayer);
}

function drawStumpBoundary(parent, scales, stump, label, selected = false) {
  if (!stump) return;
  const isX = stump.feature === "x";
  const position = isX ? scales.xScale(stump.threshold) : scales.yScale(stump.threshold);
  parent.append(svgElement("line", isX ? {
    class: `adaboost-stump-boundary${selected ? " is-selected" : ""}`,
    x1: position,
    x2: position,
    y1: scales.plotTop,
    y2: scales.plotBottom,
  } : {
    class: `adaboost-stump-boundary${selected ? " is-selected" : ""}`,
    x1: scales.margin?.left ?? PLOT.margin.left,
    x2: scales.plotRight,
    y1: position,
    y2: position,
  }));
  addText(parent, label, {
    class: "adaboost-stump-label",
    x: isX ? position + 8 : scales.plotRight - 8,
    y: isX ? PLOT.margin.top + 18 : position - 8,
    "text-anchor": isX ? "start" : "end",
  });
}

function drawPlot(svg, state) {
  svg.querySelector("[data-rendered-layer]")?.remove();
  const layer = svgElement("g", { "data-rendered-layer": "true" });
  const defs = svgElement("defs");
  const clipPath = svgElement("clipPath", { id: "adaboost-plot-clip" });
  const innerWidth = PLOT.width - PLOT.margin.left - PLOT.margin.right;
  const innerHeight = PLOT.height - PLOT.margin.top - PLOT.margin.bottom;
  clipPath.append(svgElement("rect", { x: PLOT.margin.left, y: PLOT.margin.top, width: innerWidth, height: innerHeight }));
  defs.append(clipPath);
  layer.append(defs, svgElement("rect", { x: PLOT.margin.left, y: PLOT.margin.top, width: innerWidth, height: innerHeight, fill: "#ffffff" }));

  const scales = makeScales({ ...PLOT, margin: PLOT.margin });
  drawCartesianFrame(layer, scales, {
    margin: PLOT.margin,
    plotTop: PLOT.margin.top,
    plotBottom: scales.plotBottom,
    plotRight: scales.plotRight,
    xTicks: makeTicks(PLOT.xMin, PLOT.xMax, 5),
    yTicks: makeTicks(PLOT.yMin, PLOT.yMax, 5),
    xLabel: "X₁",
    yLabel: "X₂",
    gridClass: "adaboost-grid-line",
    axisClass: "adaboost-axis-line",
    tickClass: "adaboost-tick",
    tickLabelClass: "adaboost-tick-label",
    axisLabelClass: "adaboost-axis-label",
    formatX: (value) => formatNumber(value, 0),
    formatY: (value) => formatNumber(value, 0),
  });

  const clipped = svgElement("g", { "clip-path": "url(#adaboost-plot-clip)" });
  drawEnsembleRegions(clipped, scales, state.ensemble);
  const visibleStump = state.selectedStumpIndex !== null
    ? state.ensemble[state.selectedStumpIndex]
    : state.currentStump;
  if (visibleStump) {
    const visibleIndex = state.selectedStumpIndex !== null ? state.selectedStumpIndex : Math.max(state.ensemble.length - 1, state.round - 1);
    drawStumpBoundary(clipped, scales, visibleStump, `Stump ${visibleIndex + 1}`, state.selectedStumpIndex !== null);
  }

  const pointsLayer = svgElement("g", { "aria-label": "Weighted training observations" });
  const equalWeight = 1 / ADABOOST_DATASET.length;
  ADABOOST_DATASET.forEach((point, index) => {
    const weight = Number(state.weights[index]) || equalWeight;
    const radius = clamp(7 + 2.8 * Math.sqrt(weight / equalWeight), 6.5, 13.5);
    const isMisclassified = Boolean(state.misclassified[index]);
    const x = scales.xScale(point.x);
    const y = scales.yScale(point.y);
    if (isMisclassified) {
      pointsLayer.append(svgElement("circle", {
        class: "adaboost-misclassified-ring",
        cx: x,
        cy: y,
        r: radius + 4,
        "aria-hidden": "true",
      }));
    }
    const circle = svgElement("circle", {
      class: `adaboost-point ${point.label === -1 ? "class-a" : "class-b"}`,
      cx: x,
      cy: y,
      r: radius,
      "aria-label": `Training observation ${index + 1}, ${className(point.label)}, sample weight ${formatNumber(weight, 3)}${isMisclassified ? ", misclassified by current stump" : ""}`,
    });
    const title = svgElement("title");
    title.textContent = `${className(point.label)} · weight ${formatNumber(weight, 3)}${isMisclassified ? " · misclassified" : ""}`;
    circle.append(title);
    pointsLayer.append(circle);
  });
  clipped.append(pointsLayer);

  if (state.inference) {
    const prediction = state.inferenceVotes.length
      ? className(state.inferenceVotes.reduce((sum, vote) => sum + vote.alpha * vote.prediction, 0) >= 0 ? 1 : -1)
      : "Inference";
    const pointX = scales.xScale(state.inference.x);
    const pointY = scales.yScale(state.inference.y);
    const inferenceLayer = svgElement("g", { "aria-label": "Inference point" });
    inferenceLayer.append(svgElement("polygon", {
      class: "adaboost-inference-marker",
      points: `${pointX},${pointY - 10} ${pointX + 10},${pointY} ${pointX},${pointY + 10} ${pointX - 10},${pointY}`,
    }));
    addText(inferenceLayer, `new point · ${prediction}`, {
      class: "adaboost-inference-label",
      x: pointX > scales.plotRight - 125 ? pointX - 13 : pointX + 13,
      y: clamp(pointY - 15, PLOT.margin.top + 16, scales.plotBottom - 15),
      "text-anchor": pointX > scales.plotRight - 125 ? "end" : "start",
    });
    clipped.append(inferenceLayer);
  }
  layer.append(clipped);
  svg.append(layer);

  const description = svg.querySelector("#adaboost-plot-description");
  if (description) {
    if (state.ensemble.length) {
      description.textContent = `A weighted AdaBoost ensemble with ${state.ensemble.length} decision stump${state.ensemble.length === 1 ? "" : "s"}. Point size reflects sample weight.`;
    } else if (state.currentStump) {
      description.textContent = `The current decision stump is shown with ${state.misclassified.filter(Boolean).length} misclassified training observations. Point size reflects sample weight.`;
    } else {
      description.textContent = "A two-class weighted training set with equal sample weights before the first decision stump.";
    }
  }
}

export function createAdaBoostPlayground(elements) {
  let state = createInitialState();
  let history = [];
  let autoTimer = null;
  let autoSteps = 0;
  const {
    plot,
    weakLearnersControl,
    weakLearnersValue,
    learningRateControl,
    learningRateValue,
    resetButton,
    previousButton,
    nextButton,
    autoButton,
    trainingModeButton,
    inferenceModeButton,
    status,
    roundValue,
    phaseValue,
    phaseReadout,
    errorValue,
    alphaValue,
    historyList,
    historyEmpty,
    happeningCopy,
    formulaIntro,
    formulaInitial,
    formulaError,
    formulaAlpha,
    formulaUpdate,
    formulaFinal,
    inferenceStatus,
    inferenceDetails,
  } = elements;

  function stopAutoRun(renderAfter = true) {
    if (autoTimer !== null) globalThis.clearInterval(autoTimer);
    autoTimer = null;
    if (renderAfter) render();
  }

  function pushHistory() {
    history.push(cloneState(state));
    if (history.length > 48) history.shift();
  }

  function renderHistory() {
    historyList.textContent = "";
    historyEmpty.hidden = state.ensemble.length > 0;
    state.ensemble.forEach((stump, index) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = `ensemble-item${state.selectedStumpIndex === index ? " is-selected" : ""}`;
      button.setAttribute("aria-pressed", String(state.selectedStumpIndex === index));
      button.setAttribute("aria-label", `Inspect Stump ${index + 1}, alpha ${formatNumber(stump.alpha)}`);
      const name = document.createElement("span");
      name.textContent = `Stump ${index + 1}`;
      const value = document.createElement("span");
      value.textContent = `α = ${formatNumber(stump.alpha)}`;
      button.append(name, value);
      button.addEventListener("click", () => {
        state = { ...state, selectedStumpIndex: state.selectedStumpIndex === index ? null : index, action: "stump-select" };
        render();
      });
      item.append(button);
      historyList.append(item);
    });
  }

  function renderFormula() {
    const hasError = state.stumpError !== null;
    const hasAlpha = state.currentAlpha !== null;
    const showInitial = state.phase === "fit";
    formulaIntro.textContent = state.mode === "inference"
      ? "Inference uses the fixed weak learners in a weighted vote."
      : state.phase === "final"
        ? "The fitted stumps combine their signed votes into the final classifier."
        : "Show only the calculation that belongs to the current boosting phase.";
    formulaInitial.hidden = !showInitial;
    formulaError.hidden = !(hasError && ["evaluate", "alpha", "update"].includes(state.phase));
    formulaAlpha.hidden = !(hasAlpha && ["alpha", "update", "final"].includes(state.phase));
    formulaUpdate.hidden = !(state.phase === "update" || state.phase === "final");
    formulaFinal.hidden = !(state.phase === "final" || state.mode === "inference");
    formulaInitial.querySelector("code").textContent = state.ensemble.length === 0 ? "wᵢ = 1 / n" : "Σ wᵢ = 1";
    formulaError.querySelector("code").textContent = hasError ? `errorₜ = Σ wᵢ I(yᵢ ≠ hₜ(xᵢ)) = ${formatNumber(state.stumpError)}` : "errorₜ = Σ wᵢ I(yᵢ ≠ hₜ(xᵢ))";
    formulaAlpha.querySelector("code").textContent = hasAlpha
      ? `αₜ = η × ½ ln((1 − ${formatNumber(state.stumpError)}) / ${formatNumber(state.stumpError)}) = ${formatNumber(state.currentAlpha)}`
      : "αₜ = η × ½ ln((1 − errorₜ) / errorₜ)";
    formulaUpdate.querySelector("code").textContent = hasAlpha ? "wᵢ ← wᵢ exp(−αₜ yᵢ hₜ(xᵢ)) → normalize" : "wᵢ ← wᵢ exp(−αₜ yᵢ hₜ(xᵢ))";
    formulaFinal.querySelector("code").textContent = "H(x) = sign(Σ αₜ hₜ(x))";
  }

  function renderInference() {
    inferenceDetails.textContent = "";
    if (!state.ensemble.length) {
      inferenceStatus.textContent = "Fit at least one stump to enable inference.";
      inferenceStatus.classList.remove("is-ready");
      return;
    }
    if (state.mode !== "inference") {
      inferenceStatus.textContent = "Switch to Inference, then click the plot to place a new point.";
      inferenceStatus.classList.remove("is-ready");
      return;
    }
    if (!state.inference || !state.inferenceVotes.length) {
      inferenceStatus.textContent = "Inference ready · click the plot to place a new point.";
      inferenceStatus.classList.add("is-ready");
      return;
    }
    const score = state.inferenceVotes.reduce((sum, vote) => sum + vote.alpha * vote.prediction, 0);
    const prediction = className(score >= 0 ? 1 : -1);
    inferenceStatus.textContent = `Prediction → ${prediction} · weighted score ${formatNumber(score)}.`;
    inferenceStatus.classList.add("is-ready");
    const heading = document.createElement("div");
    heading.className = "adaboost-inference-heading";
    heading.textContent = `New point (${formatNumber(state.inference.x, 1)}, ${formatNumber(state.inference.y, 1)})`;
    inferenceDetails.append(heading);
    state.inferenceVotes.forEach((vote, index) => {
      const row = document.createElement("div");
      row.className = "adaboost-vote-row";
      row.textContent = `Stump ${index + 1} → ${className(vote.prediction)}    α = ${formatNumber(vote.alpha)}`;
      inferenceDetails.append(row);
    });
    const votes = ensembleVotes(state.inference, state.ensemble);
    const voteSummary = document.createElement("div");
    voteSummary.className = "adaboost-vote-summary";
    voteSummary.textContent = `Weighted vote    ${className(-1)} = ${formatNumber(votes.classA)}    ${className(1)} = ${formatNumber(votes.classB)}`;
    inferenceDetails.append(voteSummary);
    const result = document.createElement("div");
    result.className = "adaboost-inference-result";
    result.textContent = `Prediction → ${prediction}`;
    inferenceDetails.append(result);
  }

  function render() {
    weakLearnersControl.value = String(state.weakLearners);
    weakLearnersValue.value = String(state.weakLearners);
    weakLearnersValue.textContent = String(state.weakLearners);
    learningRateControl.value = String(state.learningRate);
    learningRateValue.value = formatNumber(state.learningRate);
    learningRateValue.textContent = formatNumber(state.learningRate);
    roundValue.textContent = `${state.round} / ${state.weakLearners}`;
    phaseValue.textContent = PHASE_LABELS[state.phase];
    phaseReadout.textContent = `Round ${state.round} / ${state.weakLearners} · ${PHASE_LABELS[state.phase]}`;
    errorValue.textContent = state.stumpError === null ? "—" : formatNumber(state.stumpError);
    alphaValue.textContent = state.currentAlpha === null ? "—" : formatNumber(state.currentAlpha);
    status.textContent = getPhaseStatus(state, autoTimer !== null);
    status.classList.remove("is-unfitted", "is-fitting", "is-fitted", "is-stale");
    status.classList.add(state.mode === "inference" || state.phase === "final" ? "is-fitted" : state.ensemble.length ? "is-fitting" : "is-unfitted");
    previousButton.disabled = history.length === 0 || autoTimer !== null || state.mode === "inference";
    nextButton.disabled = state.phase === "final" || autoTimer !== null || state.mode === "inference";
    autoButton.disabled = state.phase === "final" || state.mode === "inference";
    autoButton.textContent = autoTimer === null ? "Auto Run" : "Pause";
    weakLearnersControl.disabled = autoTimer !== null || state.mode === "inference";
    learningRateControl.disabled = autoTimer !== null || state.mode === "inference";
    trainingModeButton.disabled = autoTimer !== null;
    inferenceModeButton.disabled = state.ensemble.length === 0 || autoTimer !== null;
    trainingModeButton.classList.toggle("is-active", state.mode === "training");
    inferenceModeButton.classList.toggle("is-active", state.mode === "inference");
    happeningCopy.textContent = getExplanation(state);
    renderHistory();
    renderFormula();
    renderInference();
    drawPlot(plot, state);
  }

  function nextStep() {
    if (state.phase === "final" || state.mode === "inference") return;
    pushHistory();
    if (state.phase === "fit") {
      const stump = findBestStump(ADABOOST_DATASET, state.weights);
      const evaluation = evaluateStump(ADABOOST_DATASET, state.weights, stump);
      state = {
        ...state,
        currentStump: stump,
        currentPredictions: evaluation.predictions,
        misclassified: evaluation.misclassified,
        stumpError: evaluation.error,
        rawAlpha: null,
        currentAlpha: null,
        selectedStumpIndex: null,
        phase: "evaluate",
        action: "fit",
      };
    } else if (state.phase === "evaluate") {
      const rawAlpha = calculateStumpWeight(state.stumpError, 1);
      const currentAlpha = calculateStumpWeight(state.stumpError, state.learningRate);
      state = {
        ...state,
        rawAlpha,
        currentAlpha,
        phase: "alpha",
        action: "evaluate",
      };
    } else if (state.phase === "alpha") {
      const fittedStump = { ...state.currentStump, alpha: state.currentAlpha, rawAlpha: state.rawAlpha, error: state.stumpError, round: state.round };
      const weights = updateSampleWeights(ADABOOST_DATASET, state.weights, state.currentPredictions, state.currentAlpha);
      state = {
        ...state,
        weights,
        ensemble: [...state.ensemble, fittedStump],
        selectedStumpIndex: null,
        phase: "update",
        action: "alpha",
      };
    } else if (state.phase === "update") {
      if (state.round >= state.weakLearners) {
        state = { ...state, phase: "final", action: "final", selectedStumpIndex: null };
      } else {
        state = {
          ...state,
          round: state.round + 1,
          phase: "fit",
          currentStump: null,
          currentPredictions: [],
          misclassified: [],
          stumpError: null,
          rawAlpha: null,
          currentAlpha: null,
          selectedStumpIndex: null,
          action: "next-round",
        };
      }
    }
    render();
  }

  function previousStep() {
    if (!history.length || autoTimer !== null || state.mode === "inference") return;
    state = history.pop();
    render();
  }

  function setConfiguration(parameter, value) {
    stopAutoRun(false);
    const nextConfig = {
      weakLearners: parameter === "weakLearners" ? clamp(Number(value), 1, 10) : state.weakLearners,
      learningRate: parameter === "learningRate" ? clamp(Number(value), 0.25, 1.5) : state.learningRate,
    };
    history = [];
    state = createInitialState({ ...nextConfig, action: "config-change" });
    render();
  }

  function reset() {
    stopAutoRun(false);
    history = [];
    state = createInitialState();
    render();
  }

  function startAutoRun() {
    if (state.phase === "final" || state.mode === "inference" || autoTimer !== null) return;
    autoSteps = 0;
    autoTimer = globalThis.setInterval(() => {
      if (state.phase === "final" || autoSteps >= AUTO_STEP_LIMIT) {
        const action = autoSteps >= AUTO_STEP_LIMIT ? "auto-limit" : state.action;
        stopAutoRun(false);
        state = { ...state, action };
        render();
        return;
      }
      autoSteps += 1;
      nextStep();
    }, 650);
    render();
  }

  function setInferenceMode() {
    if (!state.ensemble.length || autoTimer !== null) return;
    state = { ...state, mode: "inference", inference: null, inferenceVotes: [], selectedStumpIndex: null, action: "inference-ready" };
    render();
  }

  function setTrainingMode() {
    if (autoTimer !== null) return;
    state = { ...state, mode: "training", inference: null, inferenceVotes: [], action: "training-mode" };
    render();
  }

  plot.addEventListener("click", (event) => {
    if (state.mode !== "inference" || !state.ensemble.length) return;
    const rect = plot.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * PLOT.width;
    const viewY = ((event.clientY - rect.top) / rect.height) * PLOT.height;
    const x = clamp((viewX - PLOT.margin.left) / (PLOT.width - PLOT.margin.left - PLOT.margin.right) * 10, 0, 10);
    const y = clamp((PLOT.height - PLOT.margin.bottom - viewY) / (PLOT.height - PLOT.margin.top - PLOT.margin.bottom) * 10, 0, 10);
    const inference = { x, y };
    state = { ...state, inference, inferenceVotes: getInferenceVotes(inference, state.ensemble), action: "inference" };
    render();
  });

  weakLearnersControl.addEventListener("input", (event) => setConfiguration("weakLearners", event.target.value));
  learningRateControl.addEventListener("input", (event) => setConfiguration("learningRate", event.target.value));
  resetButton.addEventListener("click", reset);
  previousButton.addEventListener("click", previousStep);
  nextButton.addEventListener("click", nextStep);
  autoButton.addEventListener("click", () => {
    if (autoTimer !== null) stopAutoRun();
    else startAutoRun();
  });
  trainingModeButton.addEventListener("click", setTrainingMode);
  inferenceModeButton.addEventListener("click", setInferenceMode);
  render();

  return {
    reset,
    nextStep,
    previousStep,
    getState: () => cloneState(state),
  };
}
