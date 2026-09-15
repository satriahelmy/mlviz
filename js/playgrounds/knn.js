import { clamp, euclideanDistance, formatNumber } from "../core/math.js";
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
  { x: 1.4, y: 2.1, label: 0 },
  { x: 2.4, y: 3.5, label: 0 },
  { x: 3.2, y: 1.8, label: 0 },
  { x: 4.1, y: 3.8, label: 0 },
  { x: 4.7, y: 2.5, label: 0 },
  { x: 6.1, y: 6.5, label: 1 },
  { x: 7.2, y: 5.4, label: 1 },
  { x: 8.2, y: 7.2, label: 1 },
  { x: 7.5, y: 8.5, label: 1 },
  { x: 5.9, y: 7.8, label: 1 },
]);

function getNeighbors(query, k) {
  return DATASET
    .map((point, index) => ({ ...point, index, distance: euclideanDistance(query, point) }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .slice(0, clamp(Number(k), 1, DATASET.length));
}

function getVote(neighbors) {
  const classA = neighbors.filter((point) => point.label === 0).length;
  const classB = neighbors.length - classA;
  return { classA, classB, prediction: classB > classA ? "Class B" : "Class A" };
}

function drawPlot(svg, state) {
  svg.querySelector("[data-rendered-layer]")?.remove();
  const layer = svgElement("g", { "data-rendered-layer": "true" });
  const innerWidth = PLOT.width - PLOT.margin.left - PLOT.margin.right;
  const innerHeight = PLOT.height - PLOT.margin.top - PLOT.margin.bottom;
  const clipId = "knn-plot-clip";
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

  const neighbors = getNeighbors(state.query, state.k);
  const neighborIndexes = new Set(neighbors.map((point) => point.index));
  const clipped = svgElement("g", { "clip-path": `url(#${clipId})` });
  const connections = svgElement("g", { "aria-label": "Distances to nearest neighbors" });
  neighbors.forEach((point) => {
    connections.append(svgElement("line", {
      class: "knn-distance-line",
      x1: scales.xScale(state.query.x),
      y1: scales.yScale(state.query.y),
      x2: scales.xScale(point.x),
      y2: scales.yScale(point.y),
    }));
  });
  clipped.append(connections);

  const pointsLayer = svgElement("g", { "aria-label": "Labeled training observations" });
  DATASET.forEach((point, index) => {
    pointsLayer.append(svgElement("circle", {
      class: `${point.label === 0 ? "classification-point class-a" : "classification-point class-b"}${neighborIndexes.has(index) ? " knn-neighbor-point" : ""}`,
      cx: scales.xScale(point.x),
      cy: scales.yScale(point.y),
      r: 7.5,
      "aria-label": `Training observation ${index + 1}, ${point.label === 0 ? "Class A" : "Class B"}`,
    }));
  });
  neighbors.forEach((point) => {
    pointsLayer.append(svgElement("circle", {
      class: "knn-neighbor-ring",
      cx: scales.xScale(point.x),
      cy: scales.yScale(point.y),
      r: 12,
    }));
  });
  clipped.append(pointsLayer);
  layer.append(clipped);

  const queryX = scales.xScale(state.query.x);
  const queryY = scales.yScale(state.query.y);
  const vote = getVote(neighbors);
  const queryLayer = svgElement("g", { "aria-label": "Inference query point" });
  queryLayer.append(svgElement("polygon", {
    class: "classification-inference-marker",
    points: `${queryX},${queryY - 10} ${queryX + 10},${queryY} ${queryX},${queryY + 10} ${queryX - 10},${queryY}`,
  }));
  const queryAnchor = queryX > scales.plotRight - 115 ? "end" : "start";
  addText(queryLayer, `query · ${vote.prediction}`, {
    class: "classification-inference-label",
    x: queryAnchor === "end" ? queryX - 13 : queryX + 13,
    y: clamp(queryY - 15, PLOT.margin.top + 16, scales.plotBottom - 15),
    "text-anchor": queryAnchor,
  });
  layer.append(queryLayer);
  svg.append(layer);

  const description = svg.querySelector("#knn-plot-description");
  if (description) description.textContent = `A two-class training set with a query point and its ${state.k} nearest neighbors highlighted.`;
}

function getExplanation(state) {
  const neighbors = getNeighbors(state.query, state.k);
  const vote = getVote(neighbors);
  if (vote.classA === vote.classB) {
    return `The ${state.k} nearest neighbors are tied, ${vote.classA} to ${vote.classB}. The deterministic tie-break assigns the query to Class A.`;
  }
  return `${vote.classB} of the ${state.k} nearest neighbors belong to Class B and ${vote.classA} belong to Class A, so the query is predicted as ${vote.prediction}.`;
}

export function createKNNPlayground(elements) {
  let state = { k: 3, query: { x: 5.5, y: 5 }, action: "reset" };
  const {
    plot,
    kControl,
    kValue,
    resetButton,
    status,
    metricK,
    metricClassA,
    metricClassB,
    metricPrediction,
    queryXControl,
    queryYControl,
    queryXValue,
    queryYValue,
    queryStatus,
    happeningCopy,
  } = elements;

  function render() {
    const neighbors = getNeighbors(state.query, state.k);
    const vote = getVote(neighbors);
    kControl.value = String(state.k);
    kValue.value = String(state.k);
    kValue.textContent = String(state.k);
    queryXControl.value = String(state.query.x);
    queryYControl.value = String(state.query.y);
    queryXValue.value = formatNumber(state.query.x, 1);
    queryXValue.textContent = formatNumber(state.query.x, 1);
    queryYValue.value = formatNumber(state.query.y, 1);
    queryYValue.textContent = formatNumber(state.query.y, 1);
    metricK.textContent = String(state.k);
    metricClassA.textContent = String(vote.classA);
    metricClassB.textContent = String(vote.classB);
    metricPrediction.textContent = vote.prediction;
    status.textContent = "Training set fixed · query point independent";
    queryStatus.textContent = `Query (${formatNumber(state.query.x, 1)}, ${formatNumber(state.query.y, 1)}) · ${vote.prediction}`;
    queryStatus.classList.add("is-ready");
    happeningCopy.textContent = getExplanation(state);
    drawPlot(plot, state);
  }

  function updateQuery(axis, value) {
    state = { ...state, query: { ...state.query, [axis]: Number(value) }, action: "query-change" };
    render();
  }

  function reset() {
    state = { k: 3, query: { x: 5.5, y: 5 }, action: "reset" };
    render();
  }

  plot.addEventListener("click", (event) => {
    const rect = plot.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * PLOT.width;
    const viewY = ((event.clientY - rect.top) / rect.height) * PLOT.height;
    const x = clamp((viewX - PLOT.margin.left) / (PLOT.width - PLOT.margin.left - PLOT.margin.right) * 10, 0, 10);
    const y = clamp((PLOT.height - PLOT.margin.bottom - viewY) / (PLOT.height - PLOT.margin.top - PLOT.margin.bottom) * 10, 0, 10);
    state = { ...state, query: { x, y }, action: "query-change" };
    render();
  });

  kControl.addEventListener("input", (event) => {
    state = { ...state, k: Number(event.target.value), action: "k-change" };
    render();
  });
  queryXControl.addEventListener("input", (event) => updateQuery("x", event.target.value));
  queryYControl.addEventListener("input", (event) => updateQuery("y", event.target.value));
  resetButton.addEventListener("click", reset);
  render();

  return { reset, getState: () => ({ ...state, query: { ...state.query } }) };
}
