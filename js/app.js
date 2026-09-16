import { createLinearRegressionPlayground } from "./playgrounds/linear-regression.js";
import { createLogisticRegressionPlayground } from "./playgrounds/logistic-regression.js";
import { createKNNPlayground } from "./playgrounds/knn.js";
import { createSVMPlayground } from "./playgrounds/svm.js";
import { createDecisionTreePlayground } from "./playgrounds/decision-tree.js";
import { createKMeansPlayground } from "./playgrounds/k-means.js";
import { createAdaBoostPlayground } from "./playgrounds/adaboost.js?v=20260916e";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const sidebar = $("#sidebar");
const menuButton = $("#menu-button");
const drawerOverlay = $("#drawer-overlay");
const searchInput = $("#visualization-search");
const navItems = $$('[data-playground]');
const navGroups = $$(".nav-group");
const playgroundScreens = $$('[data-playground-section]');
const noResults = $("#nav-no-results");
const mobileQuery = window.matchMedia("(max-width: 1099px)");

let drawerOpen = false;

function syncDrawerMode() {
  if (!mobileQuery.matches) {
    drawerOpen = false;
    sidebar.classList.remove("is-open");
    sidebar.removeAttribute("aria-hidden");
    sidebar.inert = false;
    menuButton?.setAttribute("aria-expanded", "false");
    drawerOverlay.hidden = true;
    document.body.classList.remove("drawer-open");
    return;
  }

  sidebar.inert = !drawerOpen;
  sidebar.setAttribute("aria-hidden", String(!drawerOpen));
}

function setDrawerOpen(nextOpen) {
  if (!mobileQuery.matches) return;
  drawerOpen = nextOpen;
  sidebar.classList.toggle("is-open", drawerOpen);
  sidebar.setAttribute("aria-hidden", String(!drawerOpen));
  sidebar.inert = !drawerOpen;
  menuButton.setAttribute("aria-expanded", String(drawerOpen));
  drawerOverlay.hidden = !drawerOpen;
  document.body.classList.toggle("drawer-open", drawerOpen);

  if (drawerOpen) {
    window.setTimeout(() => searchInput.focus(), 0);
  } else {
    menuButton.focus();
  }
}

function applySearchFilter() {
  const query = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  navGroups.forEach((group) => {
    const groupItems = [...group.querySelectorAll("[data-playground]")];
    const groupVisibleCount = groupItems.filter((item) => {
      const matches = item.textContent.trim().toLowerCase().includes(query);
      item.hidden = !matches;
      return matches;
    }).length;
    group.hidden = groupVisibleCount === 0;
    visibleCount += groupVisibleCount;
  });

  noResults.hidden = visibleCount > 0 || query.length === 0;
}

function showPlayground(requestedId) {
  const target = playgroundScreens.find((screen) => screen.dataset.playgroundSection === requestedId);
  const activeId = target?.dataset.playgroundSection ?? "linear-regression";

  playgroundScreens.forEach((screen) => {
    screen.hidden = screen.dataset.playgroundSection !== activeId;
  });
  navItems.forEach((item) => {
    const isActive = item.dataset.playground === activeId;
    item.classList.toggle("is-active", isActive);
    if (isActive) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  const titles = {
    "linear-regression": "ML Visual Lab — Linear Regression",
    "logistic-regression": "ML Visual Lab — Logistic Regression",
    knn: "ML Visual Lab — K-Nearest Neighbors",
    svm: "ML Visual Lab — Linear SVM",
    "decision-tree": "ML Visual Lab — Decision Tree",
    adaboost: "ML Visual Lab — AdaBoost",
    "k-means": "ML Visual Lab — K-Means",
  };
  document.title = titles[activeId] ?? titles["linear-regression"];
}

menuButton?.addEventListener("click", () => setDrawerOpen(!drawerOpen));
drawerOverlay?.addEventListener("click", () => setDrawerOpen(false));
searchInput?.addEventListener("input", applySearchFilter);

$$('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    const requestedId = link.getAttribute("href")?.slice(1);
    if (requestedId) showPlayground(requestedId);
    if (mobileQuery.matches) setDrawerOpen(false);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && drawerOpen) setDrawerOpen(false);
});

mobileQuery.addEventListener?.("change", syncDrawerMode);
syncDrawerMode();
showPlayground(window.location.hash.slice(1) || "linear-regression");
window.addEventListener("hashchange", () => showPlayground(window.location.hash.slice(1) || "linear-regression"));

const playground = createLinearRegressionPlayground({
  plot: $("#regression-plot"),
  slopeControl: $("#slope-control"),
  interceptControl: $("#intercept-control"),
  inferenceXControl: $("#inference-x"),
  slopeValue: $("#slope-value"),
  interceptValue: $("#intercept-value"),
  inferenceXValue: $("#inference-x-value"),
  metricSlope: $("#metric-slope"),
  metricIntercept: $("#metric-intercept"),
  metricMSE: $("#metric-mse"),
  predictionValue: $("#prediction-value"),
  formulaPrediction: $("#formula-prediction"),
  happeningCopy: $("#happening-copy"),
  modelStatus: $("#model-status"),
  inferenceStatus: $("#inference-status"),
  bestFitButton: $("#best-fit-button"),
});

$("#reset-button").addEventListener("click", playground.reset);
$("#best-fit-button").addEventListener("click", playground.findBestFit);

createLogisticRegressionPlayground({
  plot: $("#logistic-plot"),
  w1Control: $("#logistic-w1"),
  w2Control: $("#logistic-w2"),
  biasControl: $("#logistic-bias"),
  thresholdControl: $("#logistic-threshold"),
  w1Value: $("#logistic-w1-value"),
  w2Value: $("#logistic-w2-value"),
  biasValue: $("#logistic-bias-value"),
  thresholdValue: $("#logistic-threshold-value"),
  resetButton: $("#logistic-reset-button"),
  fitButton: $("#logistic-fit-button"),
  status: $("#logistic-status"),
  metricThreshold: $("#logistic-metric-threshold"),
  metricProbability: $("#logistic-metric-probability"),
  metricPrediction: $("#logistic-metric-prediction"),
  inferenceXControl: $("#logistic-inference-x"),
  inferenceYControl: $("#logistic-inference-y"),
  inferenceXValue: $("#logistic-inference-x-value"),
  inferenceYValue: $("#logistic-inference-y-value"),
  inferenceStatus: $("#logistic-inference-status"),
  happeningCopy: $("#logistic-happening-copy"),
});

createKNNPlayground({
  plot: $("#knn-plot"),
  kControl: $("#knn-k"),
  kValue: $("#knn-k-value"),
  resetButton: $("#knn-reset-button"),
  status: $("#knn-status"),
  metricK: $("#knn-metric-k"),
  metricClassA: $("#knn-metric-class-a"),
  metricClassB: $("#knn-metric-class-b"),
  metricPrediction: $("#knn-metric-prediction"),
  queryXControl: $("#knn-query-x"),
  queryYControl: $("#knn-query-y"),
  queryXValue: $("#knn-query-x-value"),
  queryYValue: $("#knn-query-y-value"),
  queryStatus: $("#knn-query-status"),
  happeningCopy: $("#knn-happening-copy"),
});

createSVMPlayground({
  plot: $("#svm-plot"),
  cControl: $("#svm-c"),
  cValue: $("#svm-c-value"),
  resetButton: $("#svm-reset-button"),
  fitButton: $("#svm-fit-button"),
  status: $("#svm-status"),
  metricC: $("#svm-metric-c"),
  metricSupport: $("#svm-metric-support"),
  metricPrediction: $("#svm-metric-prediction"),
  inferenceXControl: $("#svm-inference-x"),
  inferenceYControl: $("#svm-inference-y"),
  inferenceXValue: $("#svm-inference-x-value"),
  inferenceYValue: $("#svm-inference-y-value"),
  inferenceStatus: $("#svm-inference-status"),
  happeningCopy: $("#svm-happening-copy"),
});

createDecisionTreePlayground({
  dataPlot: $("#decision-tree-data-plot"),
  treePlot: $("#decision-tree-tree-plot"),
  maxDepthControl: $("#tree-max-depth"),
  maxDepthValue: $("#tree-max-depth-value"),
  resetButton: $("#tree-reset-button"),
  fitButton: $("#tree-fit-button"),
  status: $("#tree-status"),
  metricSplit: $("#tree-metric-split"),
  metricThreshold: $("#tree-metric-threshold"),
  metricGini: $("#tree-metric-gini"),
  metricSamples: $("#tree-metric-samples"),
  inferenceXControl: $("#tree-inference-x"),
  inferenceYControl: $("#tree-inference-y"),
  inferenceXValue: $("#tree-inference-x-value"),
  inferenceYValue: $("#tree-inference-y-value"),
  inferenceStatus: $("#tree-inference-status"),
  happeningCopy: $("#tree-happening-copy"),
});

createKMeansPlayground({
  plot: $("#kmeans-plot"),
  kControl: $("#kmeans-k"),
  kValue: $("#kmeans-k-value"),
  randomizeButton: $("#kmeans-randomize-button"),
  restartButton: $("#kmeans-restart-button"),
  resetButton: $("#kmeans-reset-button"),
  previousButton: $("#kmeans-previous-button"),
  nextButton: $("#kmeans-next-button"),
  autoButton: $("#kmeans-auto-button"),
  trainingModeButton: $("#kmeans-training-mode"),
  inferenceModeButton: $("#kmeans-inference-mode"),
  status: $("#kmeans-status"),
  phaseReadout: $("#kmeans-phase-readout"),
  metricIteration: $("#kmeans-metric-iteration"),
  metricPhase: $("#kmeans-metric-phase"),
  metricK: $("#kmeans-metric-k"),
  metricWCSS: $("#kmeans-metric-wcss"),
  metricMovement: $("#kmeans-metric-movement"),
  metricConvergence: $("#kmeans-metric-convergence"),
  pointDetail: $("#kmeans-point-detail"),
  happeningCopy: $("#kmeans-happening-copy"),
  inferenceStatus: $("#kmeans-inference-status"),
  inferenceDetails: $("#kmeans-inference-details"),
});

createAdaBoostPlayground({
  plot: $("#adaboost-plot"),
  weakLearnersControl: $("#adaboost-weak-learners"),
  weakLearnersValue: $("#adaboost-weak-learners-value"),
  learningRateControl: $("#adaboost-learning-rate"),
  learningRateValue: $("#adaboost-learning-rate-value"),
  resetButton: $("#adaboost-reset-button"),
  previousButton: $("#adaboost-previous-button"),
  nextButton: $("#adaboost-next-button"),
  autoButton: $("#adaboost-auto-button"),
  trainingModeButton: $("#adaboost-training-mode"),
  inferenceModeButton: $("#adaboost-inference-mode"),
  status: $("#adaboost-status"),
  phaseReadout: $("#adaboost-phase-readout"),
  roundValue: $("#adaboost-metric-round"),
  phaseValue: $("#adaboost-metric-phase"),
  errorValue: $("#adaboost-metric-error"),
  alphaValue: $("#adaboost-metric-alpha"),
  historyList: $("#adaboost-history-list"),
  historyEmpty: $("#adaboost-history-empty"),
  happeningCopy: $("#adaboost-happening-copy"),
  formulaIntro: $("#adaboost-formula-intro"),
  formulaInitial: $("#adaboost-formula-initial"),
  formulaError: $("#adaboost-formula-error"),
  formulaAlpha: $("#adaboost-formula-alpha"),
  formulaUpdate: $("#adaboost-formula-update"),
  formulaFinal: $("#adaboost-formula-final"),
  inferenceStatus: $("#adaboost-inference-status"),
  inferenceDetails: $("#adaboost-inference-details"),
});
