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
  { x: 1.2, y: 7.8 },
  { x: 2.1, y: 6.7 },
  { x: 3.2, y: 7.6 },
  { x: 2.2, y: 8.7 },
  { x: 4.7, y: 2.2 },
  { x: 5.8, y: 1.5 },
  { x: 6.4, y: 3.0 },
  { x: 5.2, y: 3.4 },
  { x: 7.2, y: 6.5 },
  { x: 8.4, y: 7.4 },
  { x: 9.1, y: 6.3 },
  { x: 8.1, y: 8.5 },
]);

const INITIAL_CENTROIDS = Object.freeze({
  2: [
    [{ x: 2.0, y: 3.0 }, { x: 8.2, y: 4.0 }],
    [{ x: 2.2, y: 7.7 }, { x: 7.8, y: 2.5 }],
  ],
  3: [
    [{ x: 2.2, y: 7.0 }, { x: 5.2, y: 2.2 }, { x: 8.4, y: 7.4 }],
    [{ x: 2.0, y: 2.0 }, { x: 5.5, y: 8.5 }, { x: 8.5, y: 3.0 }],
  ],
  4: [
    [{ x: 1.5, y: 7.0 }, { x: 3.5, y: 7.5 }, { x: 6.0, y: 2.2 }, { x: 8.5, y: 7.5 }],
    [{ x: 2.0, y: 2.0 }, { x: 2.0, y: 8.5 }, { x: 6.5, y: 3.5 }, { x: 8.5, y: 6.5 }],
  ],
  5: [
    [{ x: 1.2, y: 7.2 }, { x: 2.8, y: 8.2 }, { x: 5.2, y: 2.0 }, { x: 6.5, y: 3.4 }, { x: 8.4, y: 7.4 }],
    [{ x: 1.8, y: 2.0 }, { x: 2.0, y: 8.5 }, { x: 5.8, y: 2.8 }, { x: 7.5, y: 6.5 }, { x: 9.0, y: 8.2 }],
  ],
});

const PHASE_LABELS = Object.freeze({
  initialize: "Initialize Centroids",
  assign: "Assign Points",
  update: "Update Centroids",
  converged: "Converged",
});

const TOLERANCE = 0.01;
const HISTORY_LIMIT = 24;
const AUTO_STEP_LIMIT = 30;

function cloneCentroids(centroids) {
  return centroids.map((centroid) => ({ ...centroid }));
}

function cloneState(state) {
  return {
    ...state,
    centroids: cloneCentroids(state.centroids),
    previousCentroids: state.previousCentroids ? cloneCentroids(state.previousCentroids) : null,
    assignments: [...state.assignments],
    inference: state.inference ? { ...state.inference } : null,
    inferenceDistances: [...state.inferenceDistances],
    movementByCentroid: [...state.movementByCentroid],
  };
}

function makeInitialCentroids(k, presetIndex) {
  const presets = INITIAL_CENTROIDS[k];
  return cloneCentroids(presets[presetIndex % presets.length]);
}

function nearestCentroid(point, centroids) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  centroids.forEach((centroid, index) => {
    const distance = euclideanDistance(point, centroid);
    if (distance < bestDistance - 1e-12) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return { index: bestIndex, distance: bestDistance };
}

function assignPoints(points, centroids) {
  return points.map((point) => nearestCentroid(point, centroids).index);
}

function calculateWCSS(points, centroids, assignments) {
  if (!assignments.length || assignments.some((assignment) => assignment === null)) return null;
  return points.reduce((sum, point, index) => sum + euclideanDistance(point, centroids[assignments[index]]) ** 2, 0);
}

function assignmentsAreStable(previous, next) {
  return previous.length === next.length && previous.every((assignment, index) => assignment === next[index]);
}

function updateCentroids(points, centroids, assignments) {
  const nextCentroids = [];
  const movementByCentroid = [];
  const emptyClusters = [];
  for (let index = 0; index < centroids.length; index += 1) {
    const assigned = points.filter((_, pointIndex) => assignments[pointIndex] === index);
    if (assigned.length === 0) {
      nextCentroids.push({ ...centroids[index] });
      movementByCentroid.push(0);
      emptyClusters.push(index);
      continue;
    }
    const next = {
      x: assigned.reduce((sum, point) => sum + point.x, 0) / assigned.length,
      y: assigned.reduce((sum, point) => sum + point.y, 0) / assigned.length,
    };
    nextCentroids.push(next);
    movementByCentroid.push(euclideanDistance(centroids[index], next));
  }
  return {
    centroids: nextCentroids,
    movementByCentroid,
    movement: Math.max(...movementByCentroid, 0),
    emptyClusters,
  };
}

function calculateInferenceDistances(point, centroids) {
  return centroids.map((centroid) => euclideanDistance(point, centroid));
}

function drawFrame(layer) {
  const scales = makeScales(PLOT);
  drawCartesianFrame(layer, scales, {
    margin: PLOT.margin,
    plotTop: PLOT.margin.top,
    plotBottom: scales.plotBottom,
    plotRight: scales.plotRight,
    xTicks: makeTicks(PLOT.xMin, PLOT.xMax, 5),
    yTicks: makeTicks(PLOT.yMin, PLOT.yMax, 5),
    xLabel: "X₁",
    yLabel: "X₂",
    gridClass: "kmeans-grid-line",
    axisClass: "kmeans-axis-line",
    tickClass: "kmeans-tick",
    tickLabelClass: "kmeans-tick-label",
    axisLabelClass: "kmeans-axis-label",
    formatX: (value) => formatNumber(value, 0),
    formatY: (value) => formatNumber(value, 0),
  });
  return scales;
}

function appendCross(parent, x, y, className, label) {
  const cross = svgElement("g", { class: className, "aria-label": label });
  cross.append(
    svgElement("line", { x1: x - 9, y1: y - 9, x2: x + 9, y2: y + 9 }),
    svgElement("line", { x1: x + 9, y1: y - 9, x2: x - 9, y2: y + 9 }),
  );
  parent.append(cross);
  return cross;
}

function drawPlot(svg, state) {
  svg.querySelector("[data-rendered-layer]")?.remove();
  const layer = svgElement("g", { "data-rendered-layer": "true" });
  const clipId = "kmeans-plot-clip";
  const innerWidth = PLOT.width - PLOT.margin.left - PLOT.margin.right;
  const innerHeight = PLOT.height - PLOT.margin.top - PLOT.margin.bottom;
  const defs = svgElement("defs");
  const clipPath = svgElement("clipPath", { id: clipId });
  clipPath.append(svgElement("rect", { x: PLOT.margin.left, y: PLOT.margin.top, width: innerWidth, height: innerHeight }));
  defs.append(clipPath);
  layer.append(defs, svgElement("rect", { x: PLOT.margin.left, y: PLOT.margin.top, width: innerWidth, height: innerHeight, fill: "#ffffff" }));
  const scales = drawFrame(layer);
  const clipped = svgElement("g", { "clip-path": `url(#${clipId})` });

  if (state.previousCentroids) {
    state.centroids.forEach((centroid, index) => {
      const previous = state.previousCentroids[index];
      const previousX = scales.xScale(previous.x);
      const previousY = scales.yScale(previous.y);
      const currentX = scales.xScale(centroid.x);
      const currentY = scales.yScale(centroid.y);
      clipped.append(svgElement("line", {
        class: `kmeans-movement-line kmeans-cluster-${index}`,
        x1: previousX,
        y1: previousY,
        x2: currentX,
        y2: currentY,
      }));
      appendCross(clipped, previousX, previousY, `kmeans-previous-centroid kmeans-cluster-${index}`, `Previous position of centroid ${index + 1}`);
    });
  }

  if (state.selectedPointIndex !== null && state.assignments.length) {
    const point = DATASET[state.selectedPointIndex];
    const nearest = nearestCentroid(point, state.centroids).index;
    state.centroids.forEach((centroid, index) => {
      clipped.append(svgElement("line", {
        class: `kmeans-distance-line${index === nearest ? " is-nearest" : ""}`,
        x1: scales.xScale(point.x),
        y1: scales.yScale(point.y),
        x2: scales.xScale(centroid.x),
        y2: scales.yScale(centroid.y),
      }));
    });
  }

  if (state.mode === "inference" && state.inference) {
    const distances = calculateInferenceDistances(state.inference, state.centroids);
    const nearest = distances.indexOf(Math.min(...distances));
    state.centroids.forEach((centroid, index) => {
      clipped.append(svgElement("line", {
        class: `kmeans-inference-line${index === nearest ? " is-nearest" : ""}`,
        x1: scales.xScale(state.inference.x),
        y1: scales.yScale(state.inference.y),
        x2: scales.xScale(centroid.x),
        y2: scales.yScale(centroid.y),
      }));
    });
  }

  DATASET.forEach((point, index) => {
    const assignment = state.assignments[index];
    const circle = svgElement("circle", {
      class: `kmeans-point${assignment === null ? "" : ` kmeans-cluster-${assignment}`}${state.selectedPointIndex === index ? " is-selected" : ""}`,
      cx: scales.xScale(point.x),
      cy: scales.yScale(point.y),
      r: 7,
      "aria-label": `Training observation ${index + 1}: (${formatNumber(point.x, 1)}, ${formatNumber(point.y, 1)})`,
    });
    const title = svgElement("title");
    title.textContent = `Training observation (${formatNumber(point.x, 1)}, ${formatNumber(point.y, 1)})`;
    circle.append(title);
    clipped.append(circle);
  });

  state.centroids.forEach((centroid, index) => {
    const x = scales.xScale(centroid.x);
    const y = scales.yScale(centroid.y);
    const group = svgElement("g", {
      class: `kmeans-centroid kmeans-cluster-${index}${state.phase === "update" ? " is-updated" : ""}`,
      "aria-label": `Current centroid ${index + 1}`,
      transform: `translate(${x} ${y})`,
    });
    group.append(svgElement("line", { x1: -9, y1: -9, x2: 9, y2: 9 }), svgElement("line", { x1: 9, y1: -9, x2: -9, y2: 9 }));
    addText(group, `C${index + 1}`, { class: "kmeans-centroid-label", x: 13, y: -11 });
    const previous = state.previousCentroids?.[index];
    const motionEnabled = !globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (state.phase === "update" && previous && motionEnabled) {
      group.append(svgElement("animateTransform", {
        attributeName: "transform",
        type: "translate",
        from: `${scales.xScale(previous.x)} ${scales.yScale(previous.y)}`,
        to: `${x} ${y}`,
        dur: "0.65s",
        fill: "freeze",
      }));
    }
    clipped.append(group);
  });

  if (state.mode === "inference" && state.inference) {
    const pointX = scales.xScale(state.inference.x);
    const pointY = scales.yScale(state.inference.y);
    const nearest = state.inferenceDistances.indexOf(Math.min(...state.inferenceDistances));
    const inferenceLayer = svgElement("g", { "aria-label": "Inference point" });
    inferenceLayer.append(svgElement("polygon", {
      class: "kmeans-inference-marker",
      points: `${pointX},${pointY - 11} ${pointX + 11},${pointY} ${pointX},${pointY + 11} ${pointX - 11},${pointY}`,
    }));
    addText(inferenceLayer, `new point · C${nearest + 1}`, {
      class: "kmeans-inference-label",
      x: pointX > scales.plotRight - 105 ? pointX - 14 : pointX + 14,
      y: clamp(pointY - 16, PLOT.margin.top + 16, scales.plotBottom - 15),
      "text-anchor": pointX > scales.plotRight - 105 ? "end" : "start",
    });
    clipped.append(inferenceLayer);
  }

  layer.append(clipped);
  svg.append(layer);
  const description = svg.querySelector("#kmeans-plot-description");
  if (description) description.textContent = state.mode === "inference" ? "A fixed-centroid inference view showing distances from the new point to every centroid." : `A two-dimensional dataset in the ${PHASE_LABELS[state.phase]} phase with ${state.centroids.length} centroids.`;
}

function getPhaseStatus(state, autoRunning) {
  if (state.mode === "inference") return "Inference · centroids fixed";
  if (state.converged) return "Converged · inference ready";
  if (autoRunning) return `Training · ${PHASE_LABELS[state.phase]}`;
  if (state.phase === "initialize") return "Ready · initialize centroids";
  return `Training · ${PHASE_LABELS[state.phase]}`;
}

function createInitialState(k = 3, presetIndex = 0) {
  return {
    k,
    presetIndex,
    phase: "initialize",
    iteration: 0,
    centroids: makeInitialCentroids(k, presetIndex),
    previousCentroids: null,
    assignments: Array(DATASET.length).fill(null),
    wcss: null,
    movement: null,
    movementByCentroid: [],
    emptyClusters: [],
    converged: false,
    mode: "training",
    selectedPointIndex: null,
    inference: null,
    inferenceDistances: [],
    action: "reset",
  };
}

function getExplanation(state) {
  if (state.mode === "inference") {
    if (!state.inference || !state.inferenceDistances.length) return "Inference mode is ready. Click the plot to compare a new point with the fixed centroids.";
    const nearest = state.inferenceDistances.indexOf(Math.min(...state.inferenceDistances));
    return `The new point is compared with every fixed centroid. C${nearest + 1} is nearest, so the point is assigned to Cluster ${nearest + 1} without moving any centroid.`;
  }
  if (state.phase === "initialize") return "Centroids are initialized but no points have been assigned yet. Next Step will start the assignment phase.";
  if (state.phase === "assign") {
    if (state.selectedPointIndex !== null) {
      const point = DATASET[state.selectedPointIndex];
      const nearest = nearestCentroid(point, state.centroids);
      return `Point ${state.selectedPointIndex + 1} is ${formatNumber(nearest.distance)} units from its nearest centroid, C${nearest.index + 1}. The cluster colors now reflect this assignment.`;
    }
    return "Every observation is assigned to its nearest centroid. Select a point in the plot to inspect its distances.";
  }
  if (state.phase === "update") {
    if (state.emptyClusters.length) return `Cluster ${state.emptyClusters.map((index) => index + 1).join(" and ")} has no points, so its centroid stays in place instead of becoming NaN.`;
    const largest = state.movementByCentroid.indexOf(Math.max(...state.movementByCentroid));
    return `Centroid ${largest + 1} moved ${formatNumber(state.movementByCentroid[largest])} units toward the mean position of its assigned points.`;
  }
  if (state.converged) return `Assignments stabilized after ${state.iteration} iteration${state.iteration === 1 ? "" : "s"}; the centroids no longer move beyond the teaching tolerance.`;
  if (state.action === "auto-limit") return "Auto Run reached its safety limit. Continue manually if more phases are needed.";
  return "The current assignments are ready for another centroid update.";
}

export function createKMeansPlayground(elements) {
  let state = createInitialState();
  let history = [];
  let autoTimer = null;
  let autoSteps = 0;
  const {
    plot,
    kControl,
    kValue,
    randomizeButton,
    restartButton,
    resetButton,
    previousButton,
    nextButton,
    autoButton,
    trainingModeButton,
    inferenceModeButton,
    status,
    phaseReadout,
    metricIteration,
    metricPhase,
    metricK,
    metricWCSS,
    metricMovement,
    metricConvergence,
    pointDetail,
    happeningCopy,
    inferenceStatus,
    inferenceDetails,
  } = elements;

  function stopAutoRun(renderAfter = true) {
    if (autoTimer !== null) globalThis.clearInterval(autoTimer);
    autoTimer = null;
    if (renderAfter) render();
  }

  function snapshot() {
    return cloneState(state);
  }

  function pushHistory() {
    history.push(snapshot());
    if (history.length > HISTORY_LIMIT) history.shift();
  }

  function renderInferenceDetails() {
    inferenceDetails.textContent = "";
    if (state.mode !== "inference" || !state.inference) return;
    const heading = document.createElement("div");
    heading.className = "kmeans-inference-heading";
    heading.textContent = `New point (${formatNumber(state.inference.x, 1)}, ${formatNumber(state.inference.y, 1)})`;
    inferenceDetails.append(heading);
    const nearest = state.inferenceDistances.indexOf(Math.min(...state.inferenceDistances));
    state.inferenceDistances.forEach((distance, index) => {
      const row = document.createElement("div");
      row.className = `kmeans-distance-row${index === nearest ? " is-nearest" : ""}`;
      row.textContent = `Centroid ${index + 1}    ${formatNumber(distance)}${index === nearest ? "  · nearest" : ""}`;
      inferenceDetails.append(row);
    });
    const result = document.createElement("div");
    result.className = "kmeans-inference-result";
    result.textContent = `Assigned to Cluster ${nearest + 1}`;
    inferenceDetails.append(result);
  }

  function render() {
    const phaseLabel = PHASE_LABELS[state.phase];
    kControl.value = String(state.k);
    kValue.value = String(state.k);
    kValue.textContent = String(state.k);
    phaseReadout.textContent = state.converged ? `Converged after ${state.iteration} iteration${state.iteration === 1 ? "" : "s"}` : `Iteration ${state.iteration} · ${phaseLabel}`;
    metricIteration.textContent = String(state.iteration);
    metricPhase.textContent = state.converged ? "Converged" : phaseLabel.replace(" Centroids", "");
    metricK.textContent = String(state.k);
    metricWCSS.textContent = state.wcss === null ? "—" : formatNumber(state.wcss, 1);
    metricMovement.textContent = state.movement === null ? "—" : formatNumber(state.movement, 2);
    metricConvergence.textContent = state.converged ? "Converged" : "In progress";
    status.textContent = getPhaseStatus(state, autoTimer !== null);
    status.classList.remove("is-unfitted", "is-fitting", "is-fitted", "is-stale");
    status.classList.add(state.mode === "inference" || state.converged ? "is-fitted" : state.phase === "initialize" ? "is-unfitted" : "is-fitting");
    previousButton.disabled = history.length === 0 || autoTimer !== null || state.mode === "inference";
    nextButton.disabled = state.converged || autoTimer !== null || state.mode === "inference";
    autoButton.disabled = state.converged || state.mode === "inference";
    autoButton.textContent = autoTimer === null ? "Auto Run" : "Pause";
    randomizeButton.disabled = autoTimer !== null || state.mode === "inference";
    restartButton.disabled = autoTimer !== null || state.mode === "inference";
    kControl.disabled = autoTimer !== null || state.mode === "inference";
    trainingModeButton.disabled = autoTimer !== null;
    inferenceModeButton.disabled = !state.converged || autoTimer !== null;
    trainingModeButton.classList.toggle("is-active", state.mode === "training");
    inferenceModeButton.classList.toggle("is-active", state.mode === "inference");
    pointDetail.textContent = state.selectedPointIndex !== null && state.assignments.length
      ? `Point ${state.selectedPointIndex + 1} selected · click another observation to inspect its centroid distances.`
      : state.mode === "inference"
        ? "Inference mode keeps the training centroids fixed."
        : state.phase === "assign"
          ? "Click a training point during Assign Points to inspect its centroid distances."
          : state.phase === "update"
            ? "Previous centroid positions and movement lines show the update just applied."
            : "Advance to Assign Points to inspect distances and cluster assignments.";
    inferenceStatus.textContent = state.mode === "inference"
      ? "Centroids fixed · inference does not change training state."
      : state.converged
        ? "Switch to Inference, then click the plot to place a new point."
        : "Converge the training cycle to enable inference.";
    inferenceStatus.classList.toggle("is-ready", state.converged && state.mode === "inference");
    renderInferenceDetails();
    drawPlot(plot, state);
    // Keep the explanatory copy deterministic and tied to the visible phase.
    happeningCopy.textContent = getExplanation(state);
  }

  function nextStep() {
    if (state.converged || state.mode === "inference") return;
    pushHistory();
    if (state.phase === "initialize") {
      const assignments = assignPoints(DATASET, state.centroids);
      state = { ...state, assignments, phase: "assign", wcss: calculateWCSS(DATASET, state.centroids, assignments), action: "assign", selectedPointIndex: null };
    } else if (state.phase === "assign") {
      const update = updateCentroids(DATASET, state.centroids, state.assignments);
      state = {
        ...state,
        phase: "update",
        iteration: state.iteration + 1,
        previousCentroids: cloneCentroids(state.centroids),
        centroids: update.centroids,
        movement: update.movement,
        movementByCentroid: update.movementByCentroid,
        emptyClusters: update.emptyClusters,
        wcss: calculateWCSS(DATASET, update.centroids, state.assignments),
        action: "update",
        selectedPointIndex: null,
      };
    } else if (state.phase === "update") {
      const assignments = assignPoints(DATASET, state.centroids);
      const stable = assignmentsAreStable(state.assignments, assignments);
      state = {
        ...state,
        assignments,
        phase: stable ? "converged" : "assign",
        converged: stable,
        wcss: calculateWCSS(DATASET, state.centroids, assignments),
        action: stable ? "converged" : "assign",
        selectedPointIndex: null,
      };
    }
    render();
  }

  function previousStep() {
    if (!history.length || state.mode === "inference") return;
    const previous = history.pop();
    state = { ...previous, action: "previous" };
    render();
  }

  function resetToInitial(k = 3, presetIndex = 0, action = "reset") {
    stopAutoRun(false);
    history = [];
    state = { ...createInitialState(k, presetIndex), action };
    render();
  }

  function startAutoRun() {
    if (autoTimer !== null) {
      stopAutoRun();
      return;
    }
    if (state.converged || state.mode === "inference") return;
    autoSteps = 0;
    autoTimer = globalThis.setInterval(() => {
      if (state.converged || autoSteps >= AUTO_STEP_LIMIT) {
        if (autoSteps >= AUTO_STEP_LIMIT && !state.converged) state = { ...state, action: "auto-limit" };
        stopAutoRun();
        return;
      }
      nextStep();
      autoSteps += 1;
      if (state.converged) stopAutoRun();
    }, 650);
    render();
  }

  function enterInferenceMode() {
    if (!state.converged) return;
    state = { ...state, mode: "inference", inference: null, inferenceDistances: [], selectedPointIndex: null, action: "inference-mode" };
    render();
  }

  function enterTrainingMode() {
    state = { ...state, mode: "training", inference: null, inferenceDistances: [], action: "training-mode" };
    render();
  }

  function placeInference(point) {
    const inferenceDistances = calculateInferenceDistances(point, state.centroids);
    state = { ...state, inference: point, inferenceDistances, action: "inference" };
    render();
  }

  function dataCoordinates(event) {
    const rect = plot.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * PLOT.width;
    const viewY = ((event.clientY - rect.top) / rect.height) * PLOT.height;
    return {
      x: clamp((viewX - PLOT.margin.left) / (PLOT.width - PLOT.margin.left - PLOT.margin.right) * 10, 0, 10),
      y: clamp((PLOT.height - PLOT.margin.bottom - viewY) / (PLOT.height - PLOT.margin.top - PLOT.margin.bottom) * 10, 0, 10),
    };
  }

  kControl.addEventListener("input", (event) => resetToInitial(Number(event.target.value), state.presetIndex, "k-change"));
  randomizeButton.addEventListener("click", () => {
    const presets = INITIAL_CENTROIDS[state.k];
    resetToInitial(state.k, (state.presetIndex + 1) % presets.length, "randomize");
  });
  restartButton.addEventListener("click", () => {
    const presets = INITIAL_CENTROIDS[state.k];
    resetToInitial(state.k, (state.presetIndex + 1) % presets.length, "restart");
  });
  resetButton.addEventListener("click", () => resetToInitial());
  previousButton.addEventListener("click", previousStep);
  nextButton.addEventListener("click", nextStep);
  autoButton.addEventListener("click", startAutoRun);
  trainingModeButton.addEventListener("click", enterTrainingMode);
  inferenceModeButton.addEventListener("click", enterInferenceMode);
  plot.addEventListener("click", (event) => {
    if (state.mode === "inference" && state.converged) {
      placeInference(dataCoordinates(event));
      return;
    }
    if (state.phase !== "assign" || !state.assignments.length) return;
    const point = dataCoordinates(event);
    const nearestPoint = DATASET.map((candidate, index) => ({ index, distance: euclideanDistance(point, candidate) }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (nearestPoint.distance <= 0.7) state = { ...state, selectedPointIndex: nearestPoint.index, action: "point-select" };
    render();
  });

  render();
  return {
    reset: () => resetToInitial(),
    nextStep,
    previousStep,
    getState: () => cloneState(state),
  };
}
