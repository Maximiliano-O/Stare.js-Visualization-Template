'use strict';

import { select, event, axisLeft, axisBottom, stack as _stack, scaleOrdinal, schemeSpectral, scaleLinear, max, scaleBand } from 'd3';
import { assign, get, keys } from 'lodash';
// import swatches from './swatches';
import legend from './legend';

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.multimedia',
  width: 500,
  height: 400,
  fillColor: 'steelblue',
  margin: {top: 30, right: 0, bottom: 30, left: 40},
  tooltip: {
    style: 'position: absolute;padding: 4px; width: 300px; background-color: #f9f9f9; border: 1px solid; border-radius: 2px; pointer-events: none; opacity: 0;',
    content: (item, chartItem) => {
      const key = get(chartItem, 'key');
      
      return `<div>[${key}] <b>${get(chartItem, `data.${key}`)}</b></div>
      <div><b>${item.title}</b></div>
      <div>${item.snippet}</div>`;
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

function showTooltip(d, chartItem, { tooltip: tooltipConfig }) {
  const html = tooltipConfig.content(d, chartItem);

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

  const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString('en');

  const yAxis = g => g
    .attr("transform", `translate(${finalOptions.margin.left},0)`)
    .call(axisLeft(y).ticks(null, 's'))
    .call(g => g.selectAll(".domain").remove());

  const xAxis = g => g
    .attr("transform", `translate(0,${finalOptions.height - finalOptions.margin.bottom})`)
    .call(axisBottom(x).tickSizeOuter(0))
    .call(g => g.selectAll(".domain").remove());

  const stack = _stack()
    .keys(keys(get(data[0], finalOptions.valueField)));

  const stackData = data.map(d => get(d, finalOptions.valueField));

  const series = stack(stackData)
    .map(d => (d.forEach(v => v.key = d.key), d));

  const color = scaleOrdinal()
    .domain(series.map(d => d.key))
    .range(schemeSpectral[series.length])
    .unknown('#ccc');
  
  const y = scaleLinear()
    .domain([0, max(series, d => max(d, d => d[1]))])
    .rangeRound([finalOptions.height - finalOptions.margin.bottom, finalOptions.margin.top]);

  const x = scaleBand()
    .domain(data.map(d => get(d, finalOptions.labelField)))
    .range([finalOptions.margin.left, finalOptions.width - finalOptions.margin.right])
    .padding(0.1);
  
  const svg = select(querySelector)
    .attr('viewBox', [0, 0, finalOptions.width, finalOptions.height])
    .attr('width', finalOptions.width)
    .attr('height', finalOptions.height);

  svg.append('g')
    .selectAll('g')
    .data(series)
    .join('g')
      .attr('fill', d => color(d.key))
    .selectAll('rect')
    .data(d => d)
    .join('rect')
      .attr('x', (d, i) => x(get(data[i], finalOptions.labelField)))
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .on('mouseover', (chartItem, i) => showTooltip(data[i], chartItem, finalOptions))
      .on('mousemove', moveTooltip)
      .on('mouseout', hideTooltip)
      .on('click', (charItem, i) => finalOptions.tooltip.onClick(data[i]))
    .append('title')
      .text((d, i) => `${get(data[i], finalOptions.labelField)} ${d.key} ${formatValue(d.data[d.key])}`);
  
  svg.append('g')
    .call(xAxis);

  svg.append('g')
    .call(yAxis);

  // swatches({ color });
  legend({
    color,
    title: 'StackedBar'
  });
}

module.exports = exports = chart;