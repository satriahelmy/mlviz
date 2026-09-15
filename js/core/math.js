export const DEFAULT_REGRESSION_DATASET = Object.freeze([
  Object.freeze({ x: 1, y: 2.1 }),
  Object.freeze({ x: 2, y: 2.9 }),
  Object.freeze({ x: 3, y: 3.3 }),
  Object.freeze({ x: 4, y: 4.5 }),
  Object.freeze({ x: 5, y: 4.9 }),
  Object.freeze({ x: 6, y: 6.2 }),
  Object.freeze({ x: 7, y: 6.8 }),
  Object.freeze({ x: 8, y: 7.4 }),
  Object.freeze({ x: 9, y: 8.3 }),
]);

export function predict(x, slope, intercept) {
  const safeX = Number.isFinite(Number(x)) ? Number(x) : 0;
  const safeSlope = Number.isFinite(Number(slope)) ? Number(slope) : 0;
  const safeIntercept = Number.isFinite(Number(intercept)) ? Number(intercept) : 0;
  return safeSlope * safeX + safeIntercept;
}

export function calculateMSE(points, slope, intercept) {
  if (!Array.isArray(points) || points.length === 0) return 0;

  const totalSquaredError = points.reduce((sum, point) => {
    const residual = Number(point.y) - predict(point.x, slope, intercept);
    return sum + residual * residual;
  }, 0);

  return totalSquaredError / points.length;
}

export function ordinaryLeastSquares(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return { slope: 0, intercept: 0 };
  }

  const meanX = points.reduce((sum, point) => sum + Number(point.x), 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + Number(point.y), 0) / points.length;

  const numerator = points.reduce(
    (sum, point) => sum + (Number(point.x) - meanX) * (Number(point.y) - meanY),
    0,
  );
  const denominator = points.reduce(
    (sum, point) => sum + (Number(point.x) - meanX) ** 2,
    0,
  );

  // A vertical/degenerate teaching dataset has no meaningful slope.
  // Returning a horizontal line through meanY keeps the renderer valid.
  const slope = denominator > Number.EPSILON ? numerator / denominator : 0;
  return { slope, intercept: meanY - slope * meanX };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(Number(value))) return "—";
  return Number(value).toFixed(digits);
}

export function sigmoid(value) {
  const safeValue = Number(value);
  if (!Number.isFinite(safeValue)) return safeValue > 0 ? 1 : 0;
  const bounded = clamp(safeValue, -60, 60);
  return 1 / (1 + Math.exp(-bounded));
}

export function logit(probability) {
  const safeProbability = clamp(Number(probability), 0.000001, 0.999999);
  return Math.log(safeProbability / (1 - safeProbability));
}

export function euclideanDistance(a, b) {
  const dx = Number(a.x) - Number(b.x);
  const dy = Number(a.y) - Number(b.y);
  return Math.sqrt(dx * dx + dy * dy);
}

export function giniImpurity(labels) {
  if (!Array.isArray(labels) || labels.length === 0) return 0;
  const counts = new Map();
  labels.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1));
  const impurity = [...counts.values()].reduce((sum, count) => {
    const probability = count / labels.length;
    return sum + probability * probability;
  }, 0);
  return 1 - impurity;
}
