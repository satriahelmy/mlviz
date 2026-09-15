import { clamp, formatNumber, giniImpurity } from "../core/math.js";
import { addText, drawCartesianFrame, makeScales, makeTicks, svgElement } from "../core/plot.js";

const PLOT = Object.freeze({
  width: 520,
  height: 430,
  margin: { top: 26, right: 20, bottom: 52, left: 58 },
  xMin: 0,
  xMax: 10,
  yMin: 0,
  yMax: 10,
});

const DATASET = Object.freeze([
  { x: 1.1, y: 1.2, label: 0 },
  { x: 2.0, y: 1.2, label: 0 },
  { x: 2.9, y: 1.2, label: 0 },
  { x: 1.5, y: 8.2, label: 1 },
  { x: 2.4, y: 8.2, label: 1 },
  { x: 3.3, y: 8.2, label: 1 },
  { x: 6.1, y: 1.2, label: 1 },
  { x: 7.0, y: 1.2, label: 1 },
  { x: 7.9, y: 1.2, label: 1 },
  { x: 6.5, y: 8.2, label: 0 },
  { x: 7.4, y: 8.2, label: 0 },
  { x: 8.3, y: 8.2, label: 0 },
]);

const MIN_SAMPLES_LEAF = 3;
const ROOT_MIN_SAMPLES_LEAF = 6;

function featureValue(point, feature) {
  return feature === "x" ? point.x : point.y;
}

function className(label) {
  return label === 0 ? "Class A" : "Class B";
}

function majorityLabel(points) {
  const classA = points.filter((point) => point.label === 0).length;
  const classB = points.length - classA;
  return classB > classA ? 1 : 0;
}

function findBestSplit(points, minSamplesLeaf = MIN_SAMPLES_LEAF) {
  const parentGini = giniImpurity(points.map((point) => point.label));
  if (parentGini === 0) return null;

  let best = null;
  ["x", "y"].forEach((feature) => {
    const values = [...new Set(points.map((point) => featureValue(point, feature)))].sort((a, b) => a - b);
    for (let index = 0; index < values.length - 1; index += 1) {
      const threshold = (values[index] + values[index + 1]) / 2;
      const left = points.filter((point) => featureValue(point, feature) < threshold);
      const right = points.filter((point) => featureValue(point, feature) >= threshold);
      if (left.length < minSamplesLeaf || right.length < minSamplesLeaf) continue;
      const weightedGini = (left.length / points.length) * giniImpurity(left.map((point) => point.label))
        + (right.length / points.length) * giniImpurity(right.map((point) => point.label));
      const candidate = { feature, threshold, parentGini, weightedGini, gain: parentGini - weightedGini, left, right };
      const isBetter = !best
        || candidate.weightedGini < best.weightedGini - 1e-12
        || (Math.abs(candidate.weightedGini - best.weightedGini) < 1e-12 && threshold < best.threshold);
      if (isBetter) best = candidate;
    }
  });
  return best;
}

function splitBounds(bounds, feature, threshold, branch) {
  if (feature === "x") {
    return branch === "left"
      ? { ...bounds, xMax: threshold }
      : { ...bounds, xMin: threshold };
  }
  return branch === "left"
    ? { ...bounds, yMax: threshold }
    : { ...bounds, yMin: threshold };
}

function fitTree(points, maxDepth) {
  let nextId = 0;
  const build = (subset, depth, bounds) => {
    const gini = giniImpurity(subset.map((point) => point.label));
    const node = {
      id: `tree-node-${nextId}`,
      depth,
      bounds,
      samples: subset.length,
      gini,
      classA: subset.filter((point) => point.label === 0).length,
      classB: subset.filter((point) => point.label === 1).length,
      prediction: majorityLabel(subset),
      type: "leaf",
    };
    nextId += 1;
    if (depth >= maxDepth || gini === 0) return node;

    const split = findBestSplit(subset, depth === 0 ? ROOT_MIN_SAMPLES_LEAF : MIN_SAMPLES_LEAF);
    // The teaching dataset intentionally starts with a balanced root tie:
    // showing that first split makes the recursive child splits visible.
    if (!split || (split.gain <= 1e-12 && depth > 0)) return node;
    return {
      ...node,
      type: "split",
      feature: split.feature,
      threshold: split.threshold,
      weightedGini: split.weightedGini,
      children: {
        left: build(split.left, depth + 1, splitBounds(bounds, split.feature, split.threshold, "left")),
        right: build(split.right, depth + 1, splitBounds(bounds, split.feature, split.threshold, "right")),
      },
    };
  };
  return build(points, 0, { xMin: PLOT.xMin, xMax: PLOT.xMax, yMin: PLOT.yMin, yMax: PLOT.yMax });
}

function findNode(node, nodeId) {
  if (!node || !nodeId) return null;
  if (node.id === nodeId) return node;
  if (node.type === "leaf") return null;
  return findNode(node.children.left, nodeId) || findNode(node.children.right, nodeId);
}

function getInferencePath(tree, point) {
  if (!tree) return [];
  const path = [tree];
  let node = tree;
  while (node.type === "split") {
    const branch = featureValue(point, node.feature) < node.threshold ? "left" : "right";
    node = node.children[branch];
    path.push(node);
  }
  return path;
}

function countLeaves(node) {
  if (node.type === "leaf") return 1;
  return countLeaves(node.children.left) + countLeaves(node.children.right);
}

function walkTree(node, callback) {
  callback(node);
  if (node.type === "split") {
    walkTree(node.children.left, callback);
    walkTree(node.children.right, callback);
  }
}

function drawFrame(svg, layer, title, description, dimensions = PLOT) {
  const scales = makeScales(dimensions);
  drawCartesianFrame(layer, scales, {
    margin: dimensions.margin,
    plotTop: dimensions.margin.top,
    plotBottom: scales.plotBottom,
    plotRight: scales.plotRight,
    xTicks: makeTicks(dimensions.xMin, dimensions.xMax, 5),
    yTicks: makeTicks(dimensions.yMin, dimensions.yMax, 5),
    xLabel: "X₁",
    yLabel: "X₂",
    gridClass: "tree-grid-line",
    axisClass: "tree-axis-line",
    tickClass: "tree-tick",
    tickLabelClass: "tree-tick-label",
    axisLabelClass: "tree-axis-label",
    formatX: (value) => formatNumber(value, 0),
    formatY: (value) => formatNumber(value, 0),
  });
  addText(layer, title, { class: "tree-view-label", x: dimensions.margin.left, y: 17 });
  addText(layer, description, { class: "tree-view-description", x: dimensions.width - dimensions.margin.right, y: 17, "text-anchor": "end" });
  return scales;
}

function drawDataSpace(svg, state) {
  svg.querySelector("[data-rendered-layer]")?.remove();
  const layer = svgElement("g", { "data-rendered-layer": "true" });
  const clipId = "decision-tree-data-clip";
  const innerWidth = PLOT.width - PLOT.margin.left - PLOT.margin.right;
  const innerHeight = PLOT.height - PLOT.margin.top - PLOT.margin.bottom;
  const defs = svgElement("defs");
  const clipPath = svgElement("clipPath", { id: clipId });
  clipPath.append(svgElement("rect", { x: PLOT.margin.left, y: PLOT.margin.top, width: innerWidth, height: innerHeight }));
  defs.append(clipPath);
  layer.append(defs, svgElement("rect", { x: PLOT.margin.left, y: PLOT.margin.top, width: innerWidth, height: innerHeight, fill: "#ffffff" }));
  const scales = drawFrame(svg, layer, "Data Space", "axis-aligned splits");
  const clipped = svgElement("g", { "clip-path": `url(#${clipId})` });

  const activeNode = state.tree ? findNode(state.tree, state.selectedNodeId) || state.tree : null;
  if (activeNode) {
    const { bounds } = activeNode;
    clipped.append(svgElement("rect", {
      class: "tree-active-region",
      x: scales.xScale(bounds.xMin),
      y: scales.yScale(bounds.yMax),
      width: scales.xScale(bounds.xMax) - scales.xScale(bounds.xMin),
      height: scales.yScale(bounds.yMin) - scales.yScale(bounds.yMax),
    }));
  }

  if (state.tree) {
    const pathIds = new Set(state.pathIds);
    walkTree(state.tree, (node) => {
      if (node.type !== "split") return;
      const isSelected = node.id === state.selectedNodeId;
      const isPath = pathIds.has(node.id);
      if (node.feature === "x") {
        clipped.append(svgElement("line", {
          class: `tree-split-line${isSelected ? " is-selected" : ""}${isPath ? " is-path" : ""}`,
          x1: scales.xScale(node.threshold),
          y1: scales.yScale(node.bounds.yMax),
          x2: scales.xScale(node.threshold),
          y2: scales.yScale(node.bounds.yMin),
        }));
      } else {
        clipped.append(svgElement("line", {
          class: `tree-split-line${isSelected ? " is-selected" : ""}${isPath ? " is-path" : ""}`,
          x1: scales.xScale(node.bounds.xMin),
          y1: scales.yScale(node.threshold),
          x2: scales.xScale(node.bounds.xMax),
          y2: scales.yScale(node.threshold),
        }));
      }
    });
  }

  const pointsLayer = svgElement("g", { "aria-label": "Labeled training observations" });
  DATASET.forEach((point, index) => {
    const circle = svgElement("circle", {
      class: point.label === 0 ? "tree-point class-a" : "tree-point class-b",
      cx: scales.xScale(point.x),
      cy: scales.yScale(point.y),
      r: 7.5,
      "aria-label": `Training observation ${index + 1}, ${className(point.label)}: (${formatNumber(point.x, 1)}, ${formatNumber(point.y, 1)})`,
    });
    const title = svgElement("title");
    title.textContent = `${className(point.label)} observation (${formatNumber(point.x, 1)}, ${formatNumber(point.y, 1)})`;
    circle.append(title);
    pointsLayer.append(circle);
  });
  clipped.append(pointsLayer);
  layer.append(clipped);

  if (state.tree) {
    const prediction = className(getInferencePath(state.tree, state.inference).at(-1).prediction);
    const pointX = scales.xScale(state.inference.x);
    const pointY = scales.yScale(state.inference.y);
    const inferenceLayer = svgElement("g", { "aria-label": "Inference observation" });
    inferenceLayer.append(svgElement("polygon", {
      class: "tree-inference-marker",
      points: `${pointX},${pointY - 10} ${pointX + 10},${pointY} ${pointX},${pointY + 10} ${pointX - 10},${pointY}`,
    }));
    addText(inferenceLayer, `new point · ${prediction}`, {
      class: "tree-inference-label",
      x: pointX > scales.plotRight - 100 ? pointX - 13 : pointX + 13,
      y: clamp(pointY - 15, PLOT.margin.top + 16, scales.plotBottom - 15),
      "text-anchor": pointX > scales.plotRight - 100 ? "end" : "start",
    });
    layer.append(inferenceLayer);
  }
  svg.append(layer);
  const description = svg.querySelector("#decision-tree-data-description");
  if (description) description.textContent = state.tree ? "Data space with the current decision splits and inference point." : "Data space with labeled training observations. Build the tree to show decision splits.";
}

function drawTreeView(svg, state, onSelectNode) {
  svg.querySelector("[data-rendered-layer]")?.remove();
  const layer = svgElement("g", { "data-rendered-layer": "true" });
  addText(layer, "Tree View", { class: "tree-view-label", x: 28, y: 17 });
  addText(layer, "click a node to inspect its split", { class: "tree-view-description", x: 492, y: 17, "text-anchor": "end" });
  if (!state.tree) {
    addText(layer, "Build the tree to inspect recursive splits.", { class: "tree-empty-label", x: 260, y: 208, "text-anchor": "middle" });
    svg.append(layer);
    return;
  }

  const positions = new Map();
  const leafCount = countLeaves(state.tree);
  let leafIndex = 0;
  const layout = (node) => {
    const y = 60 + node.depth * 104;
    if (node.type === "leaf") {
      const x = 38 + ((leafIndex + 0.5) / leafCount) * 444;
      leafIndex += 1;
      positions.set(node.id, { x, y });
      return x;
    }
    const leftX = layout(node.children.left);
    const rightX = layout(node.children.right);
    const x = (leftX + rightX) / 2;
    positions.set(node.id, { x, y });
    return x;
  };
  layout(state.tree);
  const pathIds = new Set(state.pathIds);

  walkTree(state.tree, (node) => {
    if (node.type !== "split") return;
    const parent = positions.get(node.id);
    ["left", "right"].forEach((branch) => {
      const child = node.children[branch];
      const childPosition = positions.get(child.id);
      const isPath = pathIds.has(node.id) && pathIds.has(child.id);
      layer.append(svgElement("line", {
        class: `tree-branch-line${isPath ? " is-path" : ""}`,
        x1: parent.x,
        y1: parent.y + 25,
        x2: childPosition.x,
        y2: childPosition.y - 25,
      }));
      addText(layer, branch === "left" ? "yes" : "no", {
        class: `tree-branch-label${isPath ? " is-path" : ""}`,
        x: (parent.x + childPosition.x) / 2 + (branch === "left" ? -9 : 9),
        y: (parent.y + childPosition.y) / 2,
        "text-anchor": "middle",
      });
    });
  });

  walkTree(state.tree, (node) => {
    const position = positions.get(node.id);
    const isSelected = node.id === state.selectedNodeId;
    const isPath = pathIds.has(node.id);
    const nodeGroup = svgElement("g", {
      class: `tree-node${isSelected ? " is-selected" : ""}${isPath ? " is-path" : ""}`,
      role: "button",
      tabindex: "0",
      "aria-label": node.type === "split"
        ? `${node.feature === "x" ? "X₁" : "X₂"} less than ${formatNumber(node.threshold)}; ${node.samples} samples; Gini ${formatNumber(node.gini)}`
        : `${className(node.prediction)} leaf; ${node.samples} samples`,
    });
    const width = node.type === "split" ? 132 : 106;
    const height = node.type === "split" ? 52 : 45;
    nodeGroup.setAttribute("transform", `translate(${position.x - width / 2} ${position.y - height / 2})`);
    nodeGroup.append(svgElement("rect", { width, height, rx: 4 }));
    if (node.type === "split") {
      addText(nodeGroup, `${node.feature === "x" ? "X₁" : "X₂"} < ${formatNumber(node.threshold) }?`, { class: "tree-node-label", x: width / 2, y: 22, "text-anchor": "middle" });
      addText(nodeGroup, `Gini ${formatNumber(node.gini)} · n=${node.samples}`, { class: "tree-node-meta", x: width / 2, y: 39, "text-anchor": "middle" });
    } else {
      addText(nodeGroup, className(node.prediction), { class: "tree-node-label", x: width / 2, y: 21, "text-anchor": "middle" });
      addText(nodeGroup, `leaf · n=${node.samples}`, { class: "tree-node-meta", x: width / 2, y: 36, "text-anchor": "middle" });
    }
    const select = () => onSelectNode(node.id);
    nodeGroup.addEventListener("click", select);
    nodeGroup.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
    layer.append(nodeGroup);
  });
  svg.append(layer);
  const description = svg.querySelector("#decision-tree-tree-description");
  if (description) description.textContent = "Interactive tree view with split nodes, branches, and class leaves.";
}

function getExplanation(state) {
  if (!state.tree || state.fitStatus === "unfitted") return "A decision tree chooses the split that leaves the children with the lowest weighted Gini impurity. Set a maximum depth, then build the tree.";
  if (state.fitStatus === "stale") return "Max depth changed after the last build. The visible tree is still the previous model; build again to update its splits.";
  const activeNode = findNode(state.tree, state.selectedNodeId) || state.tree;
  if (state.action === "node-select") {
    return activeNode.type === "split"
      ? `The selected node tests ${activeNode.feature === "x" ? "X₁" : "X₂"} < ${formatNumber(activeNode.threshold)}. It contains ${activeNode.samples} observations with Gini impurity ${formatNumber(activeNode.gini)}.`
      : `The selected leaf predicts ${className(activeNode.prediction)} from ${activeNode.samples} observations.`;
  }
  if (state.action === "inference") {
    const path = getInferencePath(state.tree, state.inference);
    if (state.pathIds.length < path.length) return `The inference point is following a path through ${state.pathIds.length} of ${path.length} nodes.`;
    return `The point followed ${path.length - 1} split${path.length - 1 === 1 ? "" : "s"} and reached a leaf predicting ${className(path.at(-1).prediction)}.`;
  }
  return `The tree starts with ${state.tree.samples} observations. Select a node to inspect its feature threshold, Gini impurity, and sample count.`;
}

export function createDecisionTreePlayground(elements) {
  let state = {
    maxDepth: 2,
    tree: null,
    fitStatus: "unfitted",
    selectedNodeId: null,
    inference: { x: 5.1, y: 5.1 },
    pathIds: [],
    action: "reset",
  };
  let pathTimers = [];
  const {
    dataPlot,
    treePlot,
    maxDepthControl,
    maxDepthValue,
    resetButton,
    fitButton,
    status,
    metricSplit,
    metricThreshold,
    metricGini,
    metricSamples,
    inferenceXControl,
    inferenceYControl,
    inferenceXValue,
    inferenceYValue,
    inferenceStatus,
    happeningCopy,
  } = elements;

  function clearPathTimers() {
    pathTimers.forEach((timer) => globalThis.clearTimeout(timer));
    pathTimers = [];
  }

  function render() {
    const activeNode = state.tree ? findNode(state.tree, state.selectedNodeId) || state.tree : null;
    maxDepthControl.value = String(state.maxDepth);
    maxDepthValue.value = String(state.maxDepth);
    maxDepthValue.textContent = String(state.maxDepth);
    inferenceXControl.value = String(state.inference.x);
    inferenceYControl.value = String(state.inference.y);
    inferenceXValue.value = formatNumber(state.inference.x, 1);
    inferenceXValue.textContent = formatNumber(state.inference.x, 1);
    inferenceYValue.value = formatNumber(state.inference.y, 1);
    inferenceYValue.textContent = formatNumber(state.inference.y, 1);
    metricSplit.textContent = activeNode?.type === "split" ? (activeNode.feature === "x" ? "X₁" : "X₂") : activeNode ? "Leaf" : "—";
    metricThreshold.textContent = activeNode?.type === "split" ? formatNumber(activeNode.threshold) : "—";
    metricGini.textContent = activeNode ? formatNumber(activeNode.gini) : "—";
    metricSamples.textContent = activeNode ? String(activeNode.samples) : "—";
    status.textContent = state.fitStatus === "fitted"
      ? "Fitted · decision path ready"
      : state.fitStatus === "stale"
        ? "Stale · build again after depth change"
        : "Unfitted · build a tree";
    status.classList.remove("is-unfitted", "is-fitted", "is-stale");
    status.classList.add(`is-${state.fitStatus}`);
    const inferenceEnabled = state.fitStatus === "fitted";
    inferenceXControl.disabled = !inferenceEnabled;
    inferenceYControl.disabled = !inferenceEnabled;
    const path = state.tree ? getInferencePath(state.tree, state.inference) : [];
    const pathComplete = path.length > 0 && state.pathIds.length >= path.length;
    inferenceStatus.textContent = !state.tree
      ? "Build the tree first to enable inference."
      : state.fitStatus !== "fitted"
        ? "Build the tree again to enable inference."
        : pathComplete
          ? `Predicted ${className(path.at(-1).prediction)} · leaf reached.`
          : "Click or adjust the inference point to follow its decision path.";
    inferenceStatus.classList.toggle("is-ready", inferenceEnabled && pathComplete);
    inferenceStatus.classList.toggle("is-stale", state.fitStatus === "stale");
    happeningCopy.textContent = getExplanation(state);
    drawDataSpace(dataPlot, state);
    drawTreeView(treePlot, state, selectNode);
  }

  function selectNode(nodeId) {
    clearPathTimers();
    state = { ...state, selectedNodeId: nodeId, pathIds: [], action: "node-select" };
    render();
  }

  function startInferencePath() {
    clearPathTimers();
    const path = getInferencePath(state.tree, state.inference);
    state = { ...state, selectedNodeId: null, pathIds: [], action: "inference" };
    render();
    path.forEach((node, index) => {
      pathTimers.push(globalThis.setTimeout(() => {
        state = { ...state, selectedNodeId: node.id, pathIds: path.slice(0, index + 1).map((item) => item.id), action: "inference" };
        render();
      }, 240 * (index + 1)));
    });
  }

  function updateInference(axis, value) {
    if (state.fitStatus !== "fitted") return;
    state = { ...state, inference: { ...state.inference, [axis]: Number(value) }, action: "inference" };
    startInferencePath();
  }

  function fit() {
    clearPathTimers();
    const tree = fitTree(DATASET, state.maxDepth);
    state = { ...state, tree, fitStatus: "fitted", selectedNodeId: tree.id, pathIds: [], action: "fit" };
    render();
  }

  function reset() {
    clearPathTimers();
    state = { maxDepth: 2, tree: null, fitStatus: "unfitted", selectedNodeId: null, inference: { x: 5.1, y: 5.1 }, pathIds: [], action: "reset" };
    render();
  }

  maxDepthControl.addEventListener("input", (event) => {
    clearPathTimers();
    state = { ...state, maxDepth: Number(event.target.value), fitStatus: state.tree ? "stale" : "unfitted", pathIds: [], action: "depth-change" };
    render();
  });
  inferenceXControl.addEventListener("input", (event) => updateInference("x", event.target.value));
  inferenceYControl.addEventListener("input", (event) => updateInference("y", event.target.value));
  dataPlot.addEventListener("click", (event) => {
    if (state.fitStatus !== "fitted") return;
    const rect = dataPlot.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * PLOT.width;
    const viewY = ((event.clientY - rect.top) / rect.height) * PLOT.height;
    const x = clamp((viewX - PLOT.margin.left) / (PLOT.width - PLOT.margin.left - PLOT.margin.right) * 10, 0, 10);
    const y = clamp((PLOT.height - PLOT.margin.bottom - viewY) / (PLOT.height - PLOT.margin.top - PLOT.margin.bottom) * 10, 0, 10);
    state = { ...state, inference: { x, y }, action: "inference" };
    startInferencePath();
  });
  resetButton.addEventListener("click", reset);
  fitButton.addEventListener("click", fit);
  render();

  return { reset, fit, getState: () => ({ ...state, inference: { ...state.inference }, pathIds: [...state.pathIds] }) };
}
