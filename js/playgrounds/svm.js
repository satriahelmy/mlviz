import { clamp, formatNumber } from "../core/math.js";
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

const DATASET = Object.freeze([
  { x: 1.4, y: 2.1, label: -1 },
  { x: 2.2, y: 3.4, label: -1 },
  { x: 3.1, y: 1.8, label: -1 },
  { x: 3.8, y: 4.1, label: -1 },
  { x: 4.4, y: 2.8, label: -1 },
  { x: 6.0, y: 6.4, label: 1 },
  { x: 6.7, y: 5.5, label: 1 },
  { x: 7.7, y: 7.4, label: 1 },
  { x: 8.6, y: 6.8, label: 1 },
  { x: 8.9, y: 8.7, label: 1 },
]);

function toFeature(point) {
  return { x: (point.x - 5) / 5, y: (point.y - 5) / 5 };
}

function scoreAt(point, model) {
  const feature = toFeature(point);
  return model.w1 * feature.x + model.w2 * feature.y + model.bias;
}

function fitSVM(points, C) {
  let model = { w1: 0.8, w2: 0.8, bias: 0 };
  const learningRate = 0.04;
  const regularization = 0.05;
  for (let iteration = 0; iteration < 1400; iteration += 1) {
    let gradientW1 = regularization * model.w1;
    let gradientW2 = regularization * model.w2;
    let gradientBias = 0;
    points.forEach((point) => {
      const feature = toFeature(point);
      const margin = point.label * (model.w1 * feature.x + model.w2 * feature.y + model.bias);
      if (margin < 1) {
        gradientW1 -= (C / points.length) * point.label * feature.x;
        gradientW2 -= (C / points.length) * point.label * feature.y;
        gradientBias -= (C / points.length) * point.label;
      }
    });
    model = {
      w1: model.w1 - learningRate * gradientW1,
      w2: model.w2 - learningRate * gradientW2,
      bias: model.bias - learningRate * gradientBias,
    };
  }

  const margins = points.map((point, index) => ({
    index,
    margin: point.label * scoreAt(point, model),
  }));
  let supportIndexes = margins.filter((item) => item.margin <= 1.08).map((item) => item.index);
  if (supportIndexes.length < 2) {
    supportIndexes = margins.sort((a, b) => Math.abs(a.margin - 1) - Math.abs(b.margin - 1)).slice(0, 2).map((item) => item.index);
  }
  return { ...model, supportIndexes };
}

function predictionAt(point, model) {
  return scoreAt(point, model) >= 0 ? "Class B" : "Class A";
}

function drawPlot(svg, state) {
  svg.querySelector("[data-rendered-layer]")?.remove();
  const layer = svgElement("g", { "data-rendered-layer": "true" });
  const innerWidth = PLOT.width - PLOT.margin.left - PLOT.margin.right;
  const innerHeight = PLOT.height - PLOT.margin.top - PLOT.margin.bottom;
  const clipId = "svm-plot-clip";
  const defs = svgElement("defs");
  const clipPath = svgElement("clipPath", { id: clipId });
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
    gridClass: "classification-grid-line",
    axisClass: "classification-axis-line",
    tickClass: "classification-tick",
    tickLabelClass: "classification-tick-label",
    axisLabelClass: "classification-axis-label",
    formatX: (value) => formatNumber(value, 0),
    formatY: (value) => formatNumber(value, 0),
  });

  const clipped = svgElement("g", { "clip-path": `url(#${clipId})` });
  const lineLayer = svgElement("g", { "aria-label": "SVM decision boundary and margins" });
  const w2 = state.model.w2;
  const lineForScore = (targetScore, x) => {
    if (Math.abs(w2) < 0.0001) return Number.NaN;
    const xFeature = (x - 5) / 5;
    const yFeature = (targetScore - state.model.bias - state.model.w1 * xFeature) / w2;
    return 5 + yFeature * 5;
  };
  if (Math.abs(w2) > 0.0001) {
    [
      { target: -1, className: "svm-margin-line", label: "Negative margin" },
      { target: 0, className: "svm-boundary-line", label: "Decision boundary" },
      { target: 1, className: "svm-margin-line", label: "Positive margin" },
    ].forEach((line) => {
      lineLayer.append(svgElement("line", {
        class: line.className,
        x1: scales.xScale(PLOT.xMin),
        y1: scales.yScale(lineForScore(line.target, PLOT.xMin)),
        x2: scales.xScale(PLOT.xMax),
        y2: scales.yScale(lineForScore(line.target, PLOT.xMax)),
        "aria-label": line.label,
      }));
    });
  }
  clipped.append(lineLayer);

  const support = new Set(state.model.supportIndexes);
  const pointsLayer = svgElement("g", { "aria-label": "Labeled training observations" });
  DATASET.forEach((point, index) => {
    pointsLayer.append(svgElement("circle", {
      class: `${point.label === -1 ? "classification-point class-a" : "classification-point class-b"}${support.has(index) ? " svm-support-point" : ""}`,
      cx: scales.xScale(point.x),
      cy: scales.yScale(point.y),
      r: 7.5,
      "aria-label": `Training observation ${index + 1}, ${point.label === -1 ? "Class A" : "Class B"}${support.has(index) ? ", support vector" : ""}`,
    }));
  });
  support.forEach((index) => {
    const point = DATASET[index];
    pointsLayer.append(svgElement("circle", {
      class: "svm-support-ring",
      cx: scales.xScale(point.x),
      cy: scales.yScale(point.y),
      r: 13,
    }));
  });
  clipped.append(pointsLayer);
  layer.append(clipped);

  if (state.fitStatus === "fitted") {
    const inferenceLayer = svgElement("g", { "aria-label": "Inference observation" });
    const pointX = scales.xScale(state.inference.x);
    const pointY = scales.yScale(state.inference.y);
    inferenceLayer.append(svgElement("polygon", {
      class: "classification-inference-marker",
      points: `${pointX},${pointY - 10} ${pointX + 10},${pointY} ${pointX},${pointY + 10} ${pointX - 10},${pointY}`,
    }));
    const anchor = pointX > scales.plotRight - 100 ? "end" : "start";
    addText(inferenceLayer, `new point · ${predictionAt(state.inference, state.model)}`, {
      class: "classification-inference-label",
      x: anchor === "end" ? pointX - 13 : pointX + 13,
      y: clamp(pointY - 15, PLOT.margin.top + 16, scales.plotBottom - 15),
      "text-anchor": anchor,
    });
    layer.append(inferenceLayer);
  }
  svg.append(layer);
  const description = svg.querySelector("#svm-plot-description");
  if (description) description.textContent = `A two-class scatter plot with a linear decision boundary, dashed margin lines, and ${state.model.supportIndexes.length} support vectors.`;
}

function getExplanation(state) {
  if (state.fitStatus === "stale") return "C changed after the last fit. The visible boundary is still the previous model; fit again to update its margin and support vectors.";
  if (state.action === "inference") {
    return `The inference point has score ${formatNumber(scoreAt(state.inference, state.model))}, so it falls on the ${predictionAt(state.inference, state.model)} side of the boundary without refitting.`;
  }
  if (state.action === "fit") return `The linear SVM balances a wide margin against hinge-loss violations. Points closest to the margin are marked as ${state.model.supportIndexes.length} support vectors.`;
  if (state.C > 4) return "A larger C penalizes margin violations more strongly, allowing the fit to focus on classifying the training observations.";
  if (state.C < 0.5) return "A smaller C tolerates more margin violations in exchange for a softer, more regularized boundary.";
  return "The solid line is the separating hyperplane; dashed lines show the two unit-margin boundaries that frame it.";
}

export function createSVMPlayground(elements) {
  const initialModel = fitSVM(DATASET, 1);
  let state = {
    C: 1,
    model: initialModel,
    fitStatus: "fitted",
    inference: { x: 5.3, y: 5 },
    action: "reset",
  };
  const {
    plot,
    cControl,
    cValue,
    resetButton,
    fitButton,
    status,
    metricC,
    metricSupport,
    metricPrediction,
    inferenceXControl,
    inferenceYControl,
    inferenceXValue,
    inferenceYValue,
    inferenceStatus,
    happeningCopy,
  } = elements;

  function render() {
    const prediction = predictionAt(state.inference, state.model);
    cControl.value = String(state.C);
    cValue.value = formatNumber(state.C, 1);
    cValue.textContent = formatNumber(state.C, 1);
    inferenceXControl.value = String(state.inference.x);
    inferenceYControl.value = String(state.inference.y);
    inferenceXValue.value = formatNumber(state.inference.x, 1);
    inferenceXValue.textContent = formatNumber(state.inference.x, 1);
    inferenceYValue.value = formatNumber(state.inference.y, 1);
    inferenceYValue.textContent = formatNumber(state.inference.y, 1);
    metricC.textContent = formatNumber(state.C, 1);
    metricSupport.textContent = String(state.model.supportIndexes.length);
    metricPrediction.textContent = state.fitStatus === "fitted" ? prediction : "—";
    inferenceXControl.disabled = state.fitStatus !== "fitted";
    inferenceYControl.disabled = state.fitStatus !== "fitted";
    inferenceStatus.textContent = state.fitStatus === "fitted"
      ? `Current point: ${prediction} · score ${formatNumber(scoreAt(state.inference, state.model))}.`
      : "Fit the model first to enable inference.";
    inferenceStatus.classList.toggle("is-ready", state.fitStatus === "fitted");
    inferenceStatus.classList.toggle("is-stale", state.fitStatus === "stale");
    status.textContent = state.fitStatus === "fitted"
      ? "Fitted · linear margin ready"
      : "Stale · fit again to update margin";
    status.classList.remove("is-fitted", "is-stale");
    status.classList.add(`is-${state.fitStatus}`);
    happeningCopy.textContent = getExplanation(state);
    drawPlot(plot, state);
  }

  function updateInference(axis, value) {
    state = { ...state, inference: { ...state.inference, [axis]: Number(value) }, action: "inference" };
    render();
  }

  function fit() {
    state = { ...state, model: fitSVM(DATASET, state.C), fitStatus: "fitted", action: "fit" };
    render();
  }

  function reset() {
    state = { C: 1, model: fitSVM(DATASET, 1), fitStatus: "fitted", inference: { x: 5.3, y: 5 }, action: "reset" };
    render();
  }

  plot.addEventListener("click", (event) => {
    if (state.fitStatus !== "fitted") return;
    const rect = plot.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * PLOT.width;
    const viewY = ((event.clientY - rect.top) / rect.height) * PLOT.height;
    const x = clamp((viewX - PLOT.margin.left) / (PLOT.width - PLOT.margin.left - PLOT.margin.right) * 10, 0, 10);
    const y = clamp((PLOT.height - PLOT.margin.bottom - viewY) / (PLOT.height - PLOT.margin.top - PLOT.margin.bottom) * 10, 0, 10);
    state = { ...state, inference: { x, y }, action: "inference" };
    render();
  });

  cControl.addEventListener("input", (event) => {
    state = { ...state, C: Number(event.target.value), fitStatus: "stale", action: "c-change" };
    render();
  });
  inferenceXControl.addEventListener("input", (event) => updateInference("x", event.target.value));
  inferenceYControl.addEventListener("input", (event) => updateInference("y", event.target.value));
  resetButton.addEventListener("click", reset);
  fitButton.addEventListener("click", fit);
  render();

  return { reset, fit, getState: () => ({ ...state, inference: { ...state.inference }, model: { ...state.model, supportIndexes: [...state.model.supportIndexes] } }) };
}
