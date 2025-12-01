// Treemap made to compare media file total amount between the different documents
// they are ordered on a descending order with bigger size and deeper color for the
// ones with higher amounts, the treemap is animated too but it can be disabled
// to see the final result right away.

"use strict";

import { select, scaleOrdinal, schemeCategory10, hierarchy, treemap, easeCubicOut, scaleLinear, interpolateBlues } from "d3";
import { assign, get } from "lodash";

const defaultOptions = {
  labelField: "metrics.ranking",
  valueField: "metrics.mediaCount",
  groupField: "metrics.language",
  width: 1000,
  height: 800,
  playAnimation: true,
  margin: { top: 30, right: 0, bottom: 30, left: 40 },
  tooltip: {
    style: "position: absolute;padding: 4px; width: 300px; background-color: #f9f9f9; border: 1px solid; border-radius: 2px; pointer-events: none; opacity: 0;",
    content: (item) => {
      const m = get(item, "metrics.multimedia", {});
      const total = (m.img || 0) + (m.video || 0) + (m.audio || 0);
      return `
        <div><b>${get(item, "metrics.ranking", "")}-${item.title}</b></div>
        <div>${item.snippet}</div>
        <hr />
        <div><b>Images:</b> ${m.img || 0}</div>
        <div><b>Videos:</b> ${m.video || 0}</div>
        <div><b>Audio:</b> ${m.audio || 0}</div>
        <div><b>Total Media:</b> ${total}</div>
      `;
    },
    onClick: (item) => {
      window.open(item.link, "_blank");
    },
  },
};

let tooltip = null;
function createTooltip({ tooltip: tooltipConfig }) {
  tooltip = select("body")
    .append("div")
    .attr("style", tooltipConfig.style);
}

function showTooltip(d, options, event) {
  tooltip.interrupt();
  tooltip
    .html(options.tooltip.content(d))
    .style("display", "block")
    .transition()
    .duration(200)
    .style("opacity", 1);
  moveTooltip(event);
}

function moveTooltip(event) {
  const tooltipNode = tooltip.node();
  const tooltipWidth = tooltipNode.offsetWidth;
  const tooltipHeight = tooltipNode.offsetHeight;
  const padding = 10;

  let left = event.pageX + padding;
  let top = event.pageY + padding;

  if (left + tooltipWidth > window.innerWidth) {
    left = event.pageX - tooltipWidth - padding;
  }
  if (top + tooltipHeight > window.innerHeight) {
    top = event.pageY - tooltipHeight - padding;
  }

  tooltip.style("left", `${left}px`).style("top", `${top}px`);
}

function hideTooltip() {
  tooltip.interrupt();
  tooltip
    .transition()
    .duration(500)
    .style("opacity", 0)
    .on("end", () => {
      tooltip.style("display", "none");
    });
}

function truncateText(text, maxWidth, svgTextElement) {
  let truncated = text;
  while (svgTextElement.node().getComputedTextLength() > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
    svgTextElement.text(truncated + "…");
  }
  return truncated + (truncated.length < text.length ? "…" : "");
}

function chart(querySelector, data, opts) {
  const finalOptions = assign({}, defaultOptions, opts);

  data = get(data, "documents");
  data.forEach((doc) => {
    const m = get(doc, "metrics.multimedia", {});
    const mediaCount = (m.img || 0) + (m.video || 0) + (m.audio || 0);
    doc.metrics.mediaCount = mediaCount;
    doc.metrics.mediaCountAdjusted = mediaCount + 1; // offset
  });

  const mediaCounts = data.map(d => d.metrics.mediaCountAdjusted);
  const mediaScale = scaleLinear()
    .domain([Math.min(...mediaCounts), Math.max(...mediaCounts)])
    .range([0.2, 0.7]); // controls brightness from lighter to darker

  createTooltip(finalOptions);

  const color = scaleOrdinal(data.map((d) => get(d, finalOptions.groupField)), schemeCategory10);

  const root = treemap()
    .size([finalOptions.width, finalOptions.height])
    .padding(2)(
      hierarchy({ children: data })
        .sort((a, b) => b.data.metrics.mediaCountAdjusted - a.data.metrics.mediaCountAdjusted)
        .sum((d) => get(d, "metrics.mediaCountAdjusted", 1))
    );

  const svg = select(querySelector)
    .attr("viewBox", [0, 0, finalOptions.width, finalOptions.height])
    .attr("width", finalOptions.width)
    .attr("height", finalOptions.height)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "middle")
    .attr("font-size", 14);

  svg.selectAll("*").remove();


  // Compute actual center of SVG drawing area (in case of margins)
  const drawWidth = finalOptions.width - finalOptions.margin.left - finalOptions.margin.right;
  const drawHeight = finalOptions.height - finalOptions.margin.top - finalOptions.margin.bottom;
  const centerX = finalOptions.margin.left + drawWidth / 2;
  const centerY = finalOptions.margin.top + drawHeight / 2;

  // Container group that will scale from center outwards
  const container = svg.append("g")
    .attr("transform", `translate(${centerX},${centerY}) scale(0.01) translate(${-centerX},${-centerY})`);

  const node = container.selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`)
    .on("mouseover", (event, d) => showTooltip(d.data, finalOptions, event))
    .on("mousemove", (event) => moveTooltip(event))
    .on("mouseout", () => hideTooltip())
    .on("click", (event, d) => finalOptions.tooltip.onClick(d.data));

  const rects = node.append("rect")
    .attr("fill-opacity", 0.8)
    .attr("fill", d => interpolateBlues(mediaScale(d.data.metrics.mediaCountAdjusted)))
    .attr("width", 0)
    .attr("height", 0)
    .attr("x", 0)
    .attr("y", 0);

  const texts = node.append("text")
    .attr("x", d => (d.x1 - d.x0) / 2)
    .attr("y", d => (d.y1 - d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("pointer-events", "none")
    .style("user-select", "none")
    .style("opacity", 0)
    .text(d => {
      const ranking = get(d.data, "metrics.ranking", "");
      const title = get(d.data, "title", "");
      return `${ranking} - ${title}`;
    })
    .each(function (d) {
      const maxWidth = d.x1 - d.x0 - 6;
      truncateText(select(this).text(), maxWidth, select(this));
    });

  if (finalOptions.playAnimation) {
    // Animate container scale from center (tiny to full)
    container
      .attr("transform", `translate(${centerX}, ${centerY}) scale(0.01) translate(${-centerX}, ${-centerY})`)
      .transition()
      .duration(1000)
      .ease(easeCubicOut)
      .attr("transform", `translate(0, 0) scale(1)`);

    // Animate rectangles growing from (0, 0) inside each group
    rects
      .attr("width", 0)
      .attr("height", 0)
      .attr("x", d => (d.x1 - d.x0) / 2)
      .attr("y", d => (d.y1 - d.y0) / 2)
      .transition()
      .duration(2000)
      .ease(easeCubicOut)
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);

    // Fade in text
    texts.transition()
      .delay(2000)
      .duration(600)
      .style("opacity", 1);
  } else {
    container.attr("transform", `translate(0,0) scale(1)`);
    rects
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);
    texts.style("opacity", 1);
  }
}

export default chart;