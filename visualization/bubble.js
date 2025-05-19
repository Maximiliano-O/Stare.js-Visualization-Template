'use strict';

import { select, event, scaleOrdinal, schemeCategory10, format as _format, pack as _pack, hierarchy } from 'd3';
import { assign, get } from 'lodash';

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.length',
  groupField: 'metrics.language',
  width: 500,
  height: 400,
  fillColor: 'steelblue',
  margin: {top: 30, right: 0, bottom: 30, left: 40},
  tooltip: {
    style: 'position: absolute;padding: 4px; width: 300px; background-color: #f9f9f9; border: 1px solid; border-radius: 2px; pointer-events: none; opacity: 0;',
    content: (item) => {
      return `<div>Value: <b>${get(item, 'metrics.length', 0)}</b></div><div><b>${item.title}</b></div><div>${item.snippet}</div>`;
    },
    onClick: (item) => {
      window.open(item.link, '_blank');
    },
  },
};

var tooltip = null;
function createTooltip({ tooltip: tooltipConfig }) {
  tooltip = select('body')
    .append('div')
    .attr('style', tooltipConfig.style);
}

function showTooltip(d, { tooltip: tooltipConfig }) {
  let html = tooltipConfig.content(d);

  tooltip
    .transition()
      .duration(200)
      .style('opacity', 1);
  tooltip
    .html(html)
    .style('left', `${event.pageX}px`)
    .style('top', `${event.pageY}px`);
}

function moveTooltip() {
  tooltip
    .style('left', `${event.pageX}px`)
    .style('top', `${event.pageY}px`);
}

function hideTooltip() {
  tooltip
    .transition()
      .duration(500)
      .style('opacity', 0);
}

function chart(querySelector, data, opts) {
  const finalOptions = assign(defaultOptions, opts);

  data = get(data, 'documents');
  createTooltip(finalOptions);

  const color = scaleOrdinal(data.map(d => get(d, finalOptions.groupField)), schemeCategory10);
  const format = _format(',d');
  const pack = data => _pack()
                        .size([finalOptions.width - 2, finalOptions.height - 2])
                        .padding(3)
                        (hierarchy({children: data})
                        .sum(d => get(d, finalOptions.valueField)))
  const root = pack(data);
  
  const svg = select(querySelector)
      .attr("viewBox", [0, 0, finalOptions.width, finalOptions.height])
      .attr('width', finalOptions.width)
      .attr('height', finalOptions.height)
      .attr("font-size", 10)
      .attr("font-family", "sans-serif")
      .attr("text-anchor", "middle");

  const node = svg.selectAll("g")
    .data(root.leaves())
    .join("g")
      .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`)
    .on('mouseover', n => showTooltip(n.data, finalOptions))
    .on('mousemove', moveTooltip)
    .on('mouseout', hideTooltip)
    .on('click', n => finalOptions.tooltip.onClick(n.data));

  node.append("circle")
      .attr("id", (d, i) => d.nodeUid = i)
      .attr("r", d => d.r)
      .attr("fill-opacity", 0.7)
      .attr("fill", d => color(d.data.group));

  node.append("text")
      .attr("clip-path", (d, i) => `url(#clip-${i})`)
      .append("tspan")
      .attr("x", 0)
      .attr("y", (d, i, nodes) => `0.3em`)
      // .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
      .text(d => get(d.data, finalOptions.labelField));

  node.append("title")
      .text(d => `${get(d.data, finalOptions.labelField, '')}${format(get(d.data, finalOptions.valueField))}`);
}

module.exports = exports = chart;