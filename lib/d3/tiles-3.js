'use strict';

import { axisLeft, axisBottom, scaleLinear, max, scaleBand, range, select } from 'd3';
import { get, assign } from 'lodash';

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.keywords-position',
  width: 200,
  height: 200,
  fillColor: 'steelblue',
  margin: {top: 0, right: 0, bottom: 0, left: 0},
  numberOfLines: 50,
  messages: {
    'noData': 'Data not available.',
    'noFrecuency': 'No matches found on this document',
  },
  numberOfGroups: 10,
  tooltip: {
    style: 'position: absolute;padding: 4px; min-width: 100px; background-color: #f9f9f9; border: 1px solid; border-radius: 2px; pointer-events: none; opacity: 0;',
    content: (item) => `<div>Frecuency: <b>${get(item, 'frecuency', 0)}</b></div>`,
    onClick: () => {},
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

function splitIntoEqualSegments(arr, documentLength, numberOfGroups) {
  let finalArr = [];

  // array.fill() will create a reference to the same array variable for some reason.
  for (var i = 0; i < numberOfGroups; i++) {
    finalArr.push([]);
  }

  let segment = 0;
  const breakLine = (documentLength / numberOfGroups);
  
  for (const [word, positions] of Object.entries(arr)) {
    for (var i = 0; i < positions.length; i++) {
      segment = Math.floor(positions[i] / breakLine);
      finalArr[segment].push(positions[i]);
    }
  }

  return finalArr;
}

function formatData(data, valueField, numberOfGroups) {
  let finalData = [];
  let o;

  const documentData = splitIntoEqualSegments(get(data, `${valueField}.keywords`),
                                            get(data, `${valueField}.documentLength`),
                                            numberOfGroups);
  for (var i = 0; i < documentData.length; i++) {        
    o = {};
    o['groupId'] = i;
    o['frecuency'] = documentData[i].length;
    finalData.push(o);
  }

  return finalData;
}

function chart(querySelector, data, opts) {
  const finalOptions = assign(defaultOptions, opts);

  const finalData = formatData(data, finalOptions.valueField, finalOptions.numberOfGroups);

  const svg = select(querySelector)
    .attr('viewBox', [0, 0, finalOptions.width, finalOptions.height])
    .attr('width', finalOptions.width)
    .attr('height', finalOptions.height);

  
  const frecuencyTotal = finalData.reduce((accumulator, currentValue) => accumulator + currentValue.frecuency, 0);
  
  if (frecuencyTotal === 0) {
    let text = svg.append('text')
      .attr('x', 0)
      .text(finalOptions.messages.noFrecuency ? finalOptions.messages.noFrecuency : finalOptions.messages.noData);
    text.attr('y', text.node().getBBox().height);
    return;
  }

  createTooltip(finalOptions);

  const yAxis = g => g
    .attr("transform", `translate(${finalOptions.margin.left},0)`)
    .call(axisLeft(y).ticks(null, finalData.format))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", -finalOptions.margin.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text(finalData.y)
    );

  const xAxis = g => g
    .attr("transform", `translate(0,${finalOptions.height - finalOptions.margin.bottom})`)
    .call(axisBottom(x).tickFormat(i => get(finalData[i], finalOptions.labelField)).tickSizeOuter(0));

  const y = scaleLinear()
    .domain([0, max(finalData, d => get(d, 'frecuency', 0))]).nice()
    .range([finalOptions.height - finalOptions.margin.bottom, finalOptions.margin.top]);

  const x = scaleBand()
    .domain(range(finalData.length))
    .range([finalOptions.margin.left, finalOptions.width - finalOptions.margin.right])
    .padding(0.1);

  svg.append('g')
      .attr('fill', finalOptions.fillColor)
    .selectAll('rect')
    .data(finalData)
    .join('rect')
      .attr('x', (d, i) => x(i))
      .attr('y', d => y(get(d, 'frecuency', 0)))
      .attr('height', d => {
        return y(0) - y(get(d, 'frecuency', 0));
      })
      .attr('width', x.bandwidth())
      .on('mouseover', (d) => showTooltip(d, finalOptions))
      .on('mousemove', moveTooltip)
      .on('mouseout', hideTooltip)
      .on('click', (d) => finalOptions.tooltip.onClick(d));
  
  svg.append('g')
    .call(xAxis);

  svg.append('g')
    .call(yAxis);
}

module.exports = exports = chart;