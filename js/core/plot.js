const SVG_NS = "http://www.w3.org/2000/svg";

export function svgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
  return element;
}

export function addText(parent, text, attributes = {}) {
  const element = svgElement("text", attributes);
  element.textContent = text;
  parent.append(element);
  return element;
}

export function makeScales({ width, height, margin, xMin, xMax, yMin, yMax }) {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  return {
    innerWidth,
    innerHeight,
    plotRight: margin.left + innerWidth,
    plotBottom: margin.top + innerHeight,
    xScale: (value) => margin.left + ((value - xMin) / (xMax - xMin)) * innerWidth,
    yScale: (value) => margin.top + innerHeight - ((value - yMin) / (yMax - yMin)) * innerHeight,
  };
}

export function makeTicks(min, max, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [min];
  return Array.from({ length: count + 1 }, (_, index) => min + ((max - min) * index) / count);
}

export function drawCartesianFrame(parent, scales, options) {
  const {
    margin,
    plotTop,
    plotBottom,
    plotRight,
    xTicks,
    yTicks,
    xLabel,
    yLabel,
    gridClass,
    axisClass,
    tickClass,
    tickLabelClass,
    axisLabelClass,
    formatX = (value) => String(value),
    formatY = (value) => String(value),
  } = options;
  const gridLayer = svgElement("g", { "aria-hidden": "true" });
  xTicks.forEach((tick) => {
    const x = scales.xScale(tick);
    gridLayer.append(svgElement("line", { class: gridClass, x1: x, y1: plotTop, x2: x, y2: plotBottom }));
  });
  yTicks.forEach((tick) => {
    const y = scales.yScale(tick);
    gridLayer.append(svgElement("line", { class: gridClass, x1: margin.left, y1: y, x2: plotRight, y2: y }));
  });
  parent.append(gridLayer);

  const axes = svgElement("g", { "aria-hidden": "true" });
  axes.append(
    svgElement("line", { class: axisClass, x1: margin.left, y1: plotBottom, x2: plotRight, y2: plotBottom }),
    svgElement("line", { class: axisClass, x1: margin.left, y1: plotTop, x2: margin.left, y2: plotBottom }),
  );
  xTicks.forEach((tick) => {
    const x = scales.xScale(tick);
    axes.append(svgElement("line", { class: tickClass, x1: x, y1: plotBottom, x2: x, y2: plotBottom + 6 }));
    addText(axes, formatX(tick), { class: tickLabelClass, x, y: plotBottom + 23, "text-anchor": "middle" });
  });
  yTicks.forEach((tick) => {
    const y = scales.yScale(tick);
    axes.append(svgElement("line", { class: tickClass, x1: margin.left - 6, y1: y, x2: margin.left, y2: y }));
    addText(axes, formatY(tick), { class: tickLabelClass, x: margin.left - 13, y: y + 4, "text-anchor": "end" });
  });
  addText(axes, xLabel, { class: axisLabelClass, x: margin.left + scales.innerWidth / 2, y: plotBottom + 44, "text-anchor": "middle" });
  addText(axes, yLabel, {
    class: axisLabelClass,
    x: 19,
    y: margin.top + scales.innerHeight / 2,
    "text-anchor": "middle",
    transform: `rotate(-90 19 ${margin.top + scales.innerHeight / 2})`,
  });
  parent.append(axes);
}
