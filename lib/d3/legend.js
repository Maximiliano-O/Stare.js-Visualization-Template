'use strict';

import { create, interpolateRound, range, quantile, format, scaleLinear, axisBottom } from 'd3';

export default function legend({
  color,
  title,
  tickSize = 6,
  width = 320,
  height = 44 + tickSize,
  marginTop = 18,
  marginRight = 0,
  marginBottom = 16 + tickSize,
  marginLeft = 0,
  ticks = width / 64,
  tickFormat,
  tickValues
} = {}) {

  const svg = create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "visible")
    .style("display", "block");

  let x;

  // Continuous
  if (color.interpolator) {
    x = Object.assign(color.copy()
      .interpolator(interpolateRound(marginLeft, width - marginRight)), {
        range() {
          return [marginLeft, width - marginRight];
        }
      });

    svg.append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp(color.interpolator()).toDataURL());

    // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
    if (!x.ticks) {
      if (tickValues === undefined) {
        const n = Math.round(ticks + 1);
        tickValues = range(n).map(i => quantile(color.domain(), i / (n - 1)));
      }
      if (typeof tickFormat !== "function") {
        tickFormat = format(tickFormat === undefined ? ",f" : tickFormat);
      }
    }
  }

  // Discrete
  else if (color.invertExtent) {
    const thresholds = color.thresholds ? color.thresholds() // scaleQuantize
      :
      color.quantiles ? color.quantiles() // scaleQuantile
      :
      color.domain(); // scaleThreshold

    const thresholdFormat = tickFormat === undefined ? d => d :
      typeof tickFormat === "string" ? format(tickFormat) :
      tickFormat;

    x = scaleLinear()
      .domain([-1, color.range().length - 1])
      .rangeRound([marginLeft, width - marginRight]);

    svg.append("g")
      .selectAll("rect")
      .data(color.range())
      .join("rect")
      .attr("x", (d, i) => x(i - 1))
      .attr("y", marginTop)
      .attr("width", (d, i) => x(i) - x(i - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", d => d);

    tickValues = range(thresholds.length);
    tickFormat = i => thresholdFormat(thresholds[i], i);
  }

  svg.append("g")
    .attr("transform", `translate(0, ${height - marginBottom})`)
    .call(axisBottom(x))
    //     .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
    //     .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
    //     .tickSize(tickSize).tickValues(tickValues)
    // )
    .call(g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("y", marginTop + marginBottom - height - 6)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text(title));

  return svg.node();
}