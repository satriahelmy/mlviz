import { clamp, formatNumber, logit, sigmoid } from "../core/math.js";
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
  { x: 1.2, y: 1.8, label: 0 },
  { x: 2.1, y: 3.0, label: 0 },
  { x: 3.4, y: 2.1, label: 0 },
  { x: 3.9, y: 3.7, label: 0 },
  { x: 4.6, y: 4.4, label: 0 },
  { x: 5.7, y: 5.6, label: 1 },
  { x: 6.7, y: 6.2, label: 1 },
  { x: 7.4, y: 7.8, label: 1 },
  { x: 8.3, y: 7.1, label: 1 },
  { x: 8.8, y: 8.6, label: 1 },
]);

function scoreAt(point, model) {
  return model.w1 * (point.x / 10) + model.w2 * (point.y / 10) + model.bias;
}

function probabilityAt(point, model) {
  return sigmoid(scoreAt(point, model));
}

function predictionAt(point, model) {
  return probabilityAt(point, model) >= model.threshold ? "Class B" : "Class A";
}

function fitLogisticModel(points, threshold) {
  let model = { w1: 3.2, w2: 3.2, bias: -3.2, threshold };
  const learningRate = 0.8;
  for (let iteration = 0; iteration < 900; iteration += 1) {
    let gradientW1 = 0;
    let gradientW2 = 0;
    let gradientBias = 0;
    points.forEach((point) => {
      const probability = probabilityAt(point, model);
      const error = probability - point.label;
      gradientW1 += error * (point.x / 10);
      gradientW2 += error * (point.y / 10);
      gradientBias += error;
    });
    const count = points.length;
    model = {
      ...model,
      w1: model.w1 - learningRate * (gradientW1 / count),
      w2: model.w2 - learningRate * (gradientW2 / count),
      bias: model.bias - learningRate * (gradientBias / count),
    };
  }
  return model;
}

function drawPlot(svg, state) {
  svg.querySelector("[data-rendered-layer]")?.remove();
  const layer = svgElement("g", { "data-rendered-layer": "true" });
  const clipId = "logistic-plot-clip";
  const clipPath = svgElement("clipPath", { id: clipId });
  const innerWidth = PLOT.width - PLOT.margin.left - PLOT.margin.right;
  const innerHeight = PLOT.height - PLOT.margin.top - PLOT.margin.bottom;
  clipPath.append(svgElement("rect", { x: PLOT.margin.left, y: PLOT.margin.top, width: innerWidth, height: innerHeight }));
  const defs = svgElement("defs");
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
  const thresholdScore = logit(state.threshold);
  const boundaryLayer = svgElement("g", { "aria-label": "Decision boundary" });
  const model = { ...state, threshold: state.threshold };
  if (Math.abs(model.w2) > 0.0001) {
    const yAt = (x) => 10 * ((thresholdScore - model.bias - model.w1 * (x / 10)) / model.w2);
    boundaryLayer.append(svgElement("line", {
      class: "logistic-boundary",
      x1: scales.xScale(PLOT.xMin),
      y1: scales.yScale(yAt(PLOT.xMin)),
      x2: scales.xScale(PLOT.xMax),
      y2: scales.yScale(yAt(PLOT.xMax)),
    }));
  } else if (Math.abs(model.w1) > 0.0001) {
    const x = 10 * ((thresholdScore - model.bias) / model.w1);
    boundaryLayer.append(svgElement("line", {
      class: "logistic-boundary",
      x1: scales.xScale(x),
      y1: scales.yScale(PLOT.yMin),
      x2: scales.xScale(x),
      y2: scales.yScale(PLOT.yMax),
    }));
  }
  clipped.append(boundaryLayer);

  const pointsLayer = svgElement("g", { "aria-label": "Labeled training observations" });
  DATASET.forEach((point, index) => {
    const circle = svgElement("circle", {
      class: point.label === 0 ? "classification-point class-a" : "classification-point class-b",
      cx: scales.xScale(point.x),
      cy: scales.yScale(point.y),
      r: 7.5,
      "aria-label": `Training observation ${index + 1}, ${point.label === 0 ? "Class A" : "Class B"}: (${formatNumber(point.x, 1)}, ${formatNumber(point.y, 1)})`,
    });
    const title = svgElement("title");
    title.textContent = `${point.label === 0 ? "Class A" : "Class B"} observation (${formatNumber(point.x, 1)}, ${formatNumber(point.y, 1)})`;
    circle.append(title);
    pointsLayer.append(circle);
  });
  clipped.append(pointsLayer);
  layer.append(clipped);

  if (state.modelFitted) {
    const inferenceLayer = svgElement("g", { "aria-label": "Inference observation" });
    const pointX = scales.xScale(state.inference.x);
    const pointY = scales.yScale(state.inference.y);
    inferenceLayer.append(svgElement("polygon", {
      class: "classification-inference-marker",
      points: `${pointX},${pointY - 10} ${pointX + 10},${pointY} ${pointX},${pointY + 10} ${pointX - 10},${pointY}`,
    }));
    const inferenceLabelAnchor = pointX > scales.plotRight - 100 ? "end" : "start";
    addText(inferenceLayer, `new point · ${predictionAt(state.inference, model)}`, {
      class: "classification-inference-label",
      x: inferenceLabelAnchor === "end" ? pointX - 13 : pointX + 13,
      y: clamp(pointY - 15, PLOT.margin.top + 16, scales.plotBottom - 15),
      "text-anchor": inferenceLabelAnchor,
    });
    layer.append(inferenceLayer);
  }
  svg.append(layer);

  const description = svg.querySelector("#logistic-plot-description");
  if (description) {
    const inferenceText = state.modelFitted
      ? ` Inference point (${formatNumber(state.inference.x, 1)}, ${formatNumber(state.inference.y, 1)}) is predicted as ${predictionAt(state.inference, model)}.`
      : " Fit the model to enable an inference point.";
    description.textContent = `A two-class scatter plot with a linear decision boundary at threshold ${formatNumber(state.threshold)}.${inferenceText}`;
  }
}

function getExplanation(state) {
  if (!state.modelFitted) {
    return "The line separates a score from a class probability. Adjust the boundary controls, then fit the model to try a new point.";
  }
  const probability = probabilityAt(state.inference, state);
  const prediction = predictionAt(state.inference, state);
  if (state.action === "inference") {
    return `The new point has score ${formatNumber(scoreAt(state.inference, state))}, which becomes probability ${formatNumber(probability)}. Because it is ${probability >= state.threshold ? "above" : "below"} the ${formatNumber(state.threshold)} threshold, the prediction is ${prediction}.`;
  }
  if (state.action === "threshold-change") {
    return `The threshold now decides how much probability is needed for Class B. The current inference probability is ${formatNumber(probability)}.`;
  }
  if (state.fitStatus === "stale") {
    return "The boundary parameters changed after fitting. The inference point still uses the current boundary; fit again to restore a learned model.";
  }
  return "The fitted boundary turns a linear score into a probability with the sigmoid, then compares that probability with the threshold.";
}

export function createLogisticRegressionPlayground(elements) {
  let state = {
    w1: 1,
    w2: 1,
    bias: -10,
    threshold: 0.5,
    inference: { x: 6.2, y: 5.8 },
    modelFitted: false,
    fitStatus: "unfitted",
    action: "reset",
  };

  const {
    plot,
    w1Control,
    w2Control,
    biasControl,
    thresholdControl,
    w1Value,
    w2Value,
    biasValue,
    thresholdValue,
    resetButton,
    fitButton,
    status,
    metricThreshold,
    metricProbability,
    metricPrediction,
    inferenceXControl,
    inferenceYControl,
    inferenceXValue,
    inferenceYValue,
    inferenceStatus,
    happeningCopy,
  } = elements;

  function render() {
    const probability = probabilityAt(state.inference, state);
    const prediction = predictionAt(state.inference, state);
    w1Control.value = String(state.w1);
    w2Control.value = String(state.w2);
    biasControl.value = String(state.bias);
    thresholdControl.value = String(state.threshold);
    w1Value.value = formatNumber(state.w1);
    w1Value.textContent = formatNumber(state.w1);
    w2Value.value = formatNumber(state.w2);
    w2Value.textContent = formatNumber(state.w2);
    biasValue.value = formatNumber(state.bias);
    biasValue.textContent = formatNumber(state.bias);
    thresholdValue.value = formatNumber(state.threshold);
    thresholdValue.textContent = formatNumber(state.threshold);
    inferenceXControl.value = String(state.inference.x);
    inferenceYControl.value = String(state.inference.y);
    inferenceXValue.value = formatNumber(state.inference.x, 1);
    inferenceXValue.textContent = formatNumber(state.inference.x, 1);
    inferenceYValue.value = formatNumber(state.inference.y, 1);
    inferenceYValue.textContent = formatNumber(state.inference.y, 1);
    metricThreshold.textContent = formatNumber(state.threshold);
    metricProbability.textContent = state.modelFitted ? formatNumber(probability) : "—";
    metricPrediction.textContent = state.modelFitted ? prediction : "—";
    inferenceXControl.disabled = !state.modelFitted;
    inferenceYControl.disabled = !state.modelFitted;
    inferenceStatus.textContent = state.modelFitted
      ? `Current point: ${prediction} at probability ${formatNumber(probability)}.`
      : "Fit the model first to enable inference.";
    inferenceStatus.classList.toggle("is-ready", state.modelFitted && state.fitStatus === "fitted");
    inferenceStatus.classList.toggle("is-stale", state.fitStatus === "stale");
    status.textContent = state.fitStatus === "fitted"
      ? "Fitted · sigmoid boundary ready"
      : state.fitStatus === "stale"
        ? "Stale · fit again to update boundary"
        : "Unfitted · manual boundary";
    status.classList.remove("is-unfitted", "is-fitted", "is-stale");
    status.classList.add(`is-${state.fitStatus}`);
    happeningCopy.textContent = getExplanation(state);
    drawPlot(plot, state);
  }

  function updateParameter(parameter, value, action = "parameter-change") {
    state = {
      ...state,
      [parameter]: Number(value),
      fitStatus: state.modelFitted ? "stale" : "unfitted",
      action,
    };
    render();
  }

  function updateInference(axis, value) {
    state = { ...state, inference: { ...state.inference, [axis]: Number(value) }, action: "inference" };
    render();
  }

  function reset() {
    state = {
      w1: 1,
      w2: 1,
      bias: -10,
      threshold: 0.5,
      inference: { x: 6.2, y: 5.8 },
      modelFitted: false,
      fitStatus: "unfitted",
      action: "reset",
    };
    render();
  }

  function fit() {
    const fitted = fitLogisticModel(DATASET, state.threshold);
    state = { ...state, ...fitted, modelFitted: true, fitStatus: "fitted", action: "fit" };
    render();
  }

  plot.addEventListener("click", (event) => {
    if (!state.modelFitted) return;
    const rect = plot.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * PLOT.width;
    const viewY = ((event.clientY - rect.top) / rect.height) * PLOT.height;
    const x = clamp((viewX - PLOT.margin.left) / (PLOT.width - PLOT.margin.left - PLOT.margin.right) * 10, 0, 10);
    const y = clamp((PLOT.height - PLOT.margin.bottom - viewY) / (PLOT.height - PLOT.margin.top - PLOT.margin.bottom) * 10, 0, 10);
    state = { ...state, inference: { x, y }, action: "inference" };
    render();
  });

  w1Control.addEventListener("input", (event) => updateParameter("w1", event.target.value));
  w2Control.addEventListener("input", (event) => updateParameter("w2", event.target.value));
  biasControl.addEventListener("input", (event) => updateParameter("bias", event.target.value));
  thresholdControl.addEventListener("input", (event) => updateParameter("threshold", event.target.value, "threshold-change"));
  inferenceXControl.addEventListener("input", (event) => updateInference("x", event.target.value));
  inferenceYControl.addEventListener("input", (event) => updateInference("y", event.target.value));
  resetButton.addEventListener("click", reset);
  fitButton.addEventListener("click", fit);
  render();

  return { reset, fit, getState: () => ({ ...state, inference: { ...state.inference } }) };
}
