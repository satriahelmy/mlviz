import {
  DEFAULT_REGRESSION_DATASET,
  calculateMSE,
  clamp,
  formatNumber,
  ordinaryLeastSquares,
  predict,
} from "../core/math.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const PLOT = Object.freeze({
  width: 800,
  height: 500,
  margin: { top: 28, right: 26, bottom: 58, left: 70 },
  xMin: 0,
  xMax: 10,
  yMin: 0,
  yMax: 10,
});

const INITIAL_STATE = Object.freeze({
  slope: 0.5,
  intercept: 2,
  inferenceX: 6.5,
  modelFitted: false,
});

function createInitialState() {
  const points = DEFAULT_REGRESSION_DATASET.map((point) => ({ ...point }));
  return {
    ...INITIAL_STATE,
    points,
    mse: calculateMSE(points, INITIAL_STATE.slope, INITIAL_STATE.intercept),
    action: "reset",
    previousMSE: null,
    fitStatus: "unfitted",
    isAnimating: false,
  };
}

function svgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
  return element;
}

function addText(parent, text, attributes = {}) {
  const element = svgElement("text", attributes);
  element.textContent = text;
  parent.append(element);
  return element;
}

function equationText(slope, intercept) {
  const sign = Number(intercept) < 0 ? "−" : "+";
  return `ŷ = ${formatNumber(slope)}x ${sign} ${formatNumber(Math.abs(Number(intercept)))}`;
}

function makeScales() {
  const innerWidth = PLOT.width - PLOT.margin.left - PLOT.margin.right;
  const innerHeight = PLOT.height - PLOT.margin.top - PLOT.margin.bottom;
  const xScale = (value) => PLOT.margin.left + ((value - PLOT.xMin) / (PLOT.xMax - PLOT.xMin)) * innerWidth;
  const yScale = (value) => PLOT.margin.top + innerHeight - ((value - PLOT.yMin) / (PLOT.yMax - PLOT.yMin)) * innerHeight;
  return {
    innerWidth,
    innerHeight,
    plotRight: PLOT.margin.left + innerWidth,
    plotBottom: PLOT.margin.top + innerHeight,
    xScale,
    yScale,
  };
}

function drawPlot(svg, state) {
  const existingLayer = svg.querySelector("[data-rendered-layer]");
  existingLayer?.remove();

  const { innerWidth, innerHeight, plotRight, plotBottom, xScale, yScale } = makeScales();
  const layer = svgElement("g", { "data-rendered-layer": "true" });
  const defs = svgElement("defs");
  const clipPath = svgElement("clipPath", { id: "plot-clip" });
  clipPath.append(
    svgElement("rect", {
      x: PLOT.margin.left,
      y: PLOT.margin.top,
      width: innerWidth,
      height: innerHeight,
    }),
  );
  defs.append(clipPath);
  layer.append(defs);

  layer.append(
    svgElement("rect", {
      x: PLOT.margin.left,
      y: PLOT.margin.top,
      width: innerWidth,
      height: innerHeight,
      fill: "#ffffff",
    }),
  );

  const gridLayer = svgElement("g", { "aria-hidden": "true" });
  for (let tick = 0; tick <= 10; tick += 2) {
    const x = xScale(tick);
    const y = yScale(tick);
    gridLayer.append(svgElement("line", {
      class: "plot-grid-line",
      x1: x,
      y1: PLOT.margin.top,
      x2: x,
      y2: plotBottom,
    }));
    gridLayer.append(svgElement("line", {
      class: "plot-grid-line",
      x1: PLOT.margin.left,
      y1: y,
      x2: plotRight,
      y2: y,
    }));
  }
  layer.append(gridLayer);

  const axes = svgElement("g", { "aria-hidden": "true" });
  axes.append(
    svgElement("line", {
      class: "plot-axis-line",
      x1: PLOT.margin.left,
      y1: plotBottom,
      x2: plotRight,
      y2: plotBottom,
    }),
    svgElement("line", {
      class: "plot-axis-line",
      x1: PLOT.margin.left,
      y1: PLOT.margin.top,
      x2: PLOT.margin.left,
      y2: plotBottom,
    }),
  );

  for (let tick = 0; tick <= 10; tick += 2) {
    const x = xScale(tick);
    const y = yScale(tick);
    axes.append(
      svgElement("line", { class: "plot-tick", x1: x, y1: plotBottom, x2: x, y2: plotBottom + 6 }),
      svgElement("line", { class: "plot-tick", x1: PLOT.margin.left - 6, y1: y, x2: PLOT.margin.left, y2: y }),
    );
    addText(axes, String(tick), { class: "plot-tick-label", x, y: plotBottom + 23, "text-anchor": "middle" });
    addText(axes, String(tick), { class: "plot-tick-label", x: PLOT.margin.left - 13, y: y + 4, "text-anchor": "end" });
  }
  addText(axes, "X", { class: "plot-axis-label", x: PLOT.margin.left + innerWidth / 2, y: PLOT.height - 14, "text-anchor": "middle" });
  addText(axes, "Y", {
    class: "plot-axis-label",
    x: 19,
    y: PLOT.margin.top + innerHeight / 2,
    "text-anchor": "middle",
    transform: `rotate(-90 19 ${PLOT.margin.top + innerHeight / 2})`,
  });
  layer.append(axes);

  const clippedContent = svgElement("g", { "clip-path": "url(#plot-clip)" });
  const residualLayer = svgElement("g", { "aria-label": "Residuals" });
  state.points.forEach((point, index) => {
    const predictedY = predict(point.x, state.slope, state.intercept);
    residualLayer.append(
      svgElement("line", {
        class: "plot-residual",
        x1: xScale(point.x),
        y1: yScale(point.y),
        x2: xScale(point.x),
        y2: yScale(predictedY),
        "data-point-index": index,
      }),
    );
  });
  clippedContent.append(residualLayer);

  const modelLine = svgElement("line", {
    class: "plot-model-line",
    x1: xScale(PLOT.xMin),
    y1: yScale(predict(PLOT.xMin, state.slope, state.intercept)),
    x2: xScale(PLOT.xMax),
    y2: yScale(predict(PLOT.xMax, state.slope, state.intercept)),
    "aria-label": `Current regression line: ${equationText(state.slope, state.intercept)}`,
  });
  clippedContent.append(modelLine);

  const observationLayer = svgElement("g", { "aria-label": "Training observations" });
  state.points.forEach((point, index) => {
    const circle = svgElement("circle", {
      class: "plot-observation",
      cx: xScale(point.x),
      cy: yScale(point.y),
      r: 7.5,
      "aria-label": `Training observation ${index + 1}: x ${formatNumber(point.x, 1)}, y ${formatNumber(point.y, 1)}`,
    });
    const title = svgElement("title");
    title.textContent = `Observation ${index + 1}: (${formatNumber(point.x, 1)}, ${formatNumber(point.y, 1)})`;
    circle.append(title);
    observationLayer.append(circle);
  });
  clippedContent.append(observationLayer);

  let inferenceLayer = null;
  if (state.modelFitted) {
    const inferenceX = clamp(Number(state.inferenceX), PLOT.xMin, PLOT.xMax);
    const predictedY = predict(inferenceX, state.slope, state.intercept);
    const visibleY = clamp(predictedY, PLOT.yMin, PLOT.yMax);
    const inferenceXPosition = xScale(inferenceX);
    const inferenceYPosition = yScale(visibleY);
    inferenceLayer = svgElement("g", { "aria-label": "Inference projection" });

    inferenceLayer.append(
      svgElement("line", {
        class: "plot-inference-guide",
        x1: inferenceXPosition,
        y1: plotBottom,
        x2: inferenceXPosition,
        y2: inferenceYPosition,
      }),
      svgElement("polygon", {
        class: "plot-inference-axis-marker",
        points: `${inferenceXPosition},${plotBottom - 6} ${inferenceXPosition + 6},${plotBottom} ${inferenceXPosition},${plotBottom + 6} ${inferenceXPosition - 6},${plotBottom}`,
      }),
      svgElement("polygon", {
        class: "plot-inference-marker",
        points: `${inferenceXPosition},${inferenceYPosition - 9} ${inferenceXPosition + 9},${inferenceYPosition} ${inferenceXPosition},${inferenceYPosition + 9} ${inferenceXPosition - 9},${inferenceYPosition}`,
      }),
    );

    const labelAnchor = inferenceXPosition > plotRight - 90 ? "end" : "start";
    const labelX = labelAnchor === "end" ? inferenceXPosition - 12 : inferenceXPosition + 12;
    addText(inferenceLayer, `ŷ = ${formatNumber(predictedY)}`, {
      class: "plot-prediction-label",
      x: labelX,
      y: clamp(inferenceYPosition - 13, PLOT.margin.top + 16, plotBottom - 15),
      "text-anchor": labelAnchor,
    });
    addText(inferenceLayer, `new x = ${formatNumber(inferenceX, 1)}`, {
      class: "plot-inference-label",
      x: inferenceXPosition,
      y: plotBottom - 14,
      "text-anchor": "middle",
    });
  }

  layer.append(clippedContent);
  if (inferenceLayer) layer.append(inferenceLayer);
  svg.append(layer);

  const plotDescription = svg.querySelector("#plot-description");
  if (plotDescription) {
    const inferenceDescription = state.modelFitted
      ? ` An inference input at x ${formatNumber(state.inferenceX, 1)} projects to a predicted y of ${formatNumber(predict(state.inferenceX, state.slope, state.intercept))}.`
      : " Inference is available after the model is fitted.";
    plotDescription.textContent = `Nine training observations, a regression line with slope ${formatNumber(state.slope)} and intercept ${formatNumber(state.intercept)}, and residual segments.${inferenceDescription}`;
  }
}

function getExplanation(state) {
  if (state.action === "reset") {
    return "The line starts from a deterministic teaching state. Adjust m or b to see every prediction, residual, and the MSE change together.";
  }

  if (state.action === "best-fit") {
    return "Ordinary least squares has moved the line to the parameters that minimize the average squared residual for these observations.";
  }

  if (state.action === "inference") {
    return `This new x value is projected onto the current line at ŷ = ${formatNumber(predict(state.inferenceX, state.slope, state.intercept))}. The training observations and model parameters stay unchanged.`;
  }

  if (state.previousMSE !== null) {
    const change = state.mse - state.previousMSE;
    if (change < -0.0005) {
      return `The line moved closer to the observations you adjusted toward, reducing MSE by ${formatNumber(Math.abs(change))}. Shorter residuals mean less squared error.`;
    }
    if (change > 0.0005) {
      return `The latest parameter change moved the line farther from the observations overall, increasing MSE by ${formatNumber(change)}.`;
    }
  }

  return "The residuals are the vertical distances from each observation to the line; MSE summarizes their squared lengths in one value.";
}

function isReducedMotionPreferred() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function createLinearRegressionPlayground(elements) {
  let state = createInitialState();
  let animationFrame = null;
  let animationToken = 0;

  const {
    plot,
    slopeControl,
    interceptControl,
    inferenceXControl,
    slopeValue,
    interceptValue,
    inferenceXValue,
    metricSlope,
    metricIntercept,
    metricMSE,
    predictionValue,
    formulaPrediction,
    happeningCopy,
    modelStatus,
    inferenceStatus,
    bestFitButton,
  } = elements;

  function updateState(nextState) {
    state = nextState;
    state.mse = calculateMSE(state.points, state.slope, state.intercept);
    render();
  }

  function render() {
    slopeControl.value = String(state.slope);
    interceptControl.value = String(state.intercept);
    inferenceXControl.value = String(state.inferenceX);

    slopeValue.value = formatNumber(state.slope);
    slopeValue.textContent = formatNumber(state.slope);
    interceptValue.value = formatNumber(state.intercept);
    interceptValue.textContent = formatNumber(state.intercept);
    inferenceXValue.value = formatNumber(state.inferenceX, 1);
    inferenceXValue.textContent = formatNumber(state.inferenceX, 1);
    metricSlope.textContent = formatNumber(state.slope);
    metricIntercept.textContent = formatNumber(state.intercept);
    metricMSE.textContent = formatNumber(state.mse);
    formulaPrediction.textContent = equationText(state.slope, state.intercept);
    happeningCopy.textContent = getExplanation(state);

    const predictedY = predict(state.inferenceX, state.slope, state.intercept);
    predictionValue.textContent = state.modelFitted ? formatNumber(predictedY) : "—";
    inferenceXControl.disabled = !state.modelFitted || state.isAnimating;
    inferenceStatus.textContent = state.modelFitted
      ? state.fitStatus === "stale"
        ? `Manual line selected · prediction uses the current line: ŷ = ${formatNumber(predictedY)}.`
        : `Prediction uses the fitted line only: ŷ = ${formatNumber(predictedY)}.`
      : "Fit the model first to enable inference.";
    inferenceStatus.classList.toggle("is-ready", state.modelFitted);
    inferenceStatus.classList.toggle("is-stale", state.fitStatus === "stale");
    modelStatus.classList.remove("is-unfitted", "is-fitting", "is-fitted", "is-stale");
    modelStatus.classList.add(state.isAnimating ? "is-fitting" : `is-${state.fitStatus}`);
    modelStatus.textContent = state.isAnimating
      ? "Fitting · calculating least-squares line…"
      : state.fitStatus === "fitted"
        ? "Fitted · least-squares line"
        : state.fitStatus === "stale"
          ? "Stale · fit again to restore least-squares line"
          : "Unfitted · manual line";
    bestFitButton.disabled = state.isAnimating;
    bestFitButton.textContent = state.isAnimating ? "Finding Best Fit…" : "Find Best Fit";
    bestFitButton.setAttribute("aria-busy", String(state.isAnimating));

    drawPlot(plot, state);
  }

  function changeParameter(parameter, value) {
    cancelFitAnimation();
    const beforeMSE = state.mse;
    updateState({
      ...state,
      [parameter]: Number(value),
      action: "parameter-change",
      previousMSE: beforeMSE,
      fitStatus: state.modelFitted ? "stale" : "unfitted",
      isAnimating: false,
    });
  }

  function changeInferenceX(value) {
    updateState({
      ...state,
      inferenceX: Number(value),
      action: "inference",
      previousMSE: null,
    });
  }

  function cancelFitAnimation() {
    animationToken += 1;
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function reset() {
    cancelFitAnimation();
    updateState(createInitialState());
  }

  function findBestFit() {
    cancelFitAnimation();
    const target = ordinaryLeastSquares(state.points);
    const startSlope = state.slope;
    const startIntercept = state.intercept;
    const beforeMSE = state.mse;
    const token = animationToken;

    if (isReducedMotionPreferred() || (Math.abs(target.slope - startSlope) < 0.001 && Math.abs(target.intercept - startIntercept) < 0.001)) {
      updateState({
        ...state,
        slope: target.slope,
        intercept: target.intercept,
        modelFitted: true,
        fitStatus: "fitted",
        action: "best-fit",
        previousMSE: beforeMSE,
        isAnimating: false,
      });
      return;
    }

    updateState({
      ...state,
      modelFitted: true,
      fitStatus: "fitted",
      action: "best-fit",
      previousMSE: beforeMSE,
      isAnimating: true,
    });

    const startTime = performance.now();
    const duration = 380;
    const animate = (now) => {
      if (token !== animationToken) return;
      const progress = clamp((now - startTime) / duration, 0, 1);
      const eased = 1 - (1 - progress) ** 3;
      const nextSlope = startSlope + (target.slope - startSlope) * eased;
      const nextIntercept = startIntercept + (target.intercept - startIntercept) * eased;
      state = {
        ...state,
        slope: nextSlope,
        intercept: nextIntercept,
        isAnimating: progress < 1,
      };
      state.mse = calculateMSE(state.points, state.slope, state.intercept);
      render();

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        animationFrame = null;
        state = { ...state, slope: target.slope, intercept: target.intercept, fitStatus: "fitted", isAnimating: false };
        state.mse = calculateMSE(state.points, state.slope, state.intercept);
        render();
      }
    };
    animationFrame = requestAnimationFrame(animate);
  }

  slopeControl.addEventListener("input", (event) => changeParameter("slope", event.target.value));
  interceptControl.addEventListener("input", (event) => changeParameter("intercept", event.target.value));
  inferenceXControl.addEventListener("input", (event) => changeInferenceX(event.target.value));
  render();

  return {
    reset,
    findBestFit,
    getState: () => ({ ...state, points: state.points.map((point) => ({ ...point })) }),
  };
}
