'use strict';

import { select, event, axisLeft, axisBottom, scaleLinear, max, scaleBand, range } from 'd3';
import { get, assign } from 'lodash';

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.length',
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
  const html = tooltipConfig.content(d);

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

  const yAxis = g => g
    .attr("transform", `translate(${finalOptions.margin.left},0)`)
    .call(axisLeft(y).ticks(null, data.format))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", -finalOptions.margin.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
    .text(data.y));

  const xAxis = g => g
    .attr("transform", `translate(0,${finalOptions.height - finalOptions.margin.bottom})`)
    .call(axisBottom(x).tickFormat(i => get(data[i], finalOptions.labelField)).tickSizeOuter(0));

  const y = scaleLinear()
    .domain([0, max(data, d => get(d, finalOptions.valueField))]).nice()
    .range([finalOptions.height - finalOptions.margin.bottom, finalOptions.margin.top]);

  const x = scaleBand()
    .domain(range(data.length))
    .range([finalOptions.margin.left, finalOptions.width - finalOptions.margin.right])
    .padding(0.1);

  const svg = select(querySelector)
    .attr('viewBox', [0, 0, finalOptions.width, finalOptions.height])
    .attr('width', finalOptions.width)
    .attr('height', finalOptions.height);

  svg.append('g')
      .attr('fill', finalOptions.fillColor)
    .selectAll('rect')
    .data(data)
    .join('rect')
      .attr('x', (d, i) => x(i))
      .attr('y', d => y(get(d, finalOptions.valueField)))
      .attr('height', d => y(0) - y(get(d, finalOptions.valueField)))
      .attr('width', x.bandwidth())
    .on('mouseover', d => showTooltip(d, finalOptions))
    .on('mousemove', moveTooltip)
    .on('mouseout', hideTooltip)
    .on('click', d => finalOptions.tooltip.onClick(d));
  
  svg.append('g')
    .call(xAxis);

  svg.append('g')
    .call(yAxis);
}

module.exports = exports = chart;