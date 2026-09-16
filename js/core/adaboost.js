import { clamp } from "./math.js";

export const ADABOOST_DATASET = Object.freeze([
  Object.freeze({ x: 1.5, y: 2.0, label: -1 }),
  Object.freeze({ x: 2.5, y: 3.0, label: -1 }),
  Object.freeze({ x: 3.5, y: 2.3, label: -1 }),
  Object.freeze({ x: 4.5, y: 3.5, label: -1 }),
  Object.freeze({ x: 7.5, y: 7.5, label: -1 }),
  Object.freeze({ x: 8.5, y: 8.2, label: -1 }),
  Object.freeze({ x: 6.0, y: 6.0, label: 1 }),
  Object.freeze({ x: 7.0, y: 8.0, label: 1 }),
  Object.freeze({ x: 8.0, y: 7.0, label: 1 }),
  Object.freeze({ x: 9.0, y: 8.0, label: 1 }),
  Object.freeze({ x: 2.0, y: 1.5, label: 1 }),
  Object.freeze({ x: 3.0, y: 3.8, label: 1 }),
]);

const FEATURES = Object.freeze(["x", "y"]);
const EPSILON = 0.000001;

function normalizedWeights(weights, count) {
  const safe = Array.from({ length: count }, (_, index) => {
    const value = Number(weights?.[index]);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  });
  const total = safe.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= EPSILON) return Array(count).fill(1 / Math.max(count, 1));
  return safe.map((value) => value / total);
}

export function predictWithStump(stump, point) {
  if (!stump || !point) return -1;
  const featureValue = Number(point[stump.feature]);
  const side = featureValue < Number(stump.threshold) ? -1 : 1;
  return side * (stump.polarity === -1 ? -1 : 1);
}

function makeCandidateStumps(points) {
  return FEATURES.flatMap((feature) => {
    const values = [...new Set(points.map((point) => Number(point[feature])).filter(Number.isFinite))]
      .sort((a, b) => a - b);
    const thresholds = values.slice(0, -1).map((value, index) => (value + values[index + 1]) / 2);
    return thresholds.flatMap((threshold) => [
      { feature, threshold, polarity: 1 },
      { feature, threshold, polarity: -1 },
    ]);
  });
}

function isBetterCandidate(candidate, current) {
  if (!current) return true;
  if (candidate.error < current.error - 1e-12) return true;
  if (Math.abs(candidate.error - current.error) > 1e-12) return false;
  const candidateFeatureRank = candidate.feature === "x" ? 0 : 1;
  const currentFeatureRank = current.feature === "x" ? 0 : 1;
  if (candidateFeatureRank !== currentFeatureRank) return candidateFeatureRank < currentFeatureRank;
  if (Math.abs(candidate.threshold - current.threshold) > 1e-12) return candidate.threshold < current.threshold;
  return candidate.polarity > current.polarity;
}

export function evaluateStump(points, weights, stump) {
  const safeWeights = normalizedWeights(weights, points.length);
  const predictions = points.map((point) => predictWithStump(stump, point));
  const misclassified = predictions.map((prediction, index) => prediction !== points[index].label);
  const error = misclassified.reduce((sum, isWrong, index) => sum + (isWrong ? safeWeights[index] : 0), 0);
  return {
    predictions,
    misclassified,
    error: clamp(error, 0, 1),
    correctCount: misclassified.filter((isWrong) => !isWrong).length,
  };
}

export function findBestStump(points, weights) {
  const safeWeights = normalizedWeights(weights, points.length);
  let best = null;
  makeCandidateStumps(points).forEach((candidate) => {
    const evaluation = evaluateStump(points, safeWeights, candidate);
    const scored = { ...candidate, error: evaluation.error };
    if (isBetterCandidate(scored, best)) best = scored;
  });
  return best ?? { feature: "x", threshold: 5, polarity: 1, error: 0.5 };
}

export function calculateStumpWeight(error, learningRate = 1) {
  const safeError = clamp(Number(error), EPSILON, 0.5 - EPSILON);
  const safeLearningRate = clamp(Number(learningRate), 0, 10);
  const rawAlpha = 0.5 * Math.log((1 - safeError) / safeError);
  const alpha = rawAlpha * safeLearningRate;
  return Number.isFinite(alpha) ? alpha : 0;
}

export function updateSampleWeights(points, weights, predictions, alpha) {
  const safeWeights = normalizedWeights(weights, points.length);
  const safeAlpha = Number.isFinite(Number(alpha)) ? Number(alpha) : 0;
  const updated = safeWeights.map((weight, index) => {
    const margin = Number(points[index]?.label) * Number(predictions[index]);
    const exponent = clamp(-safeAlpha * margin, -40, 40);
    return weight * Math.exp(exponent);
  });
  return normalizedWeights(updated, points.length);
}

export function ensembleScore(point, ensemble) {
  return (ensemble ?? []).reduce((sum, stump) => sum + Number(stump.alpha || 0) * predictWithStump(stump, point), 0);
}

export function ensemblePrediction(point, ensemble) {
  return ensembleScore(point, ensemble) >= 0 ? 1 : -1;
}

export function ensembleVotes(point, ensemble) {
  return (ensemble ?? []).reduce((votes, stump) => {
    const prediction = predictWithStump(stump, point);
    const alpha = Number(stump.alpha || 0);
    if (prediction === -1) votes.classA += alpha;
    else votes.classB += alpha;
    return votes;
  }, { classA: 0, classB: 0 });
}
