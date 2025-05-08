'use strict';

import { interpolateGreys, select } from 'd3';
import { assign, get, isEmpty } from 'lodash';

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.keywords-position',
  width: 1200,
  height: 333,
  fillColor: 'steelblue',
  margin: {top: 0, right: 0, bottom: 0, left: 0},
  messages: {
    'noData': 'Data not available.'
  },
  boxSize: {
    width: 20,
    height: 20
  },
  breakLine: 100,
  tooltip: {
    style: 'position: absolute;padding: 4px; width: 300px; background-color: #f9f9f9; border: 1px solid; border-radius: 2px; pointer-events: none; opacity: 0;',
    content: (item) => {
      return `<div>Document Length: <b>${get(item, 'metrics.length', 0)}</b></div><div><b>${item.title}</b></div><div>${item.snippet}</div>`;
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

function splitIntoEqualSegments(arr, documentLength, breakLine) {
  let finalArr = [];

  // array.fill() will create a reference to the same array variable for some reason.
  for (var i = 0; i < Math.ceil(documentLength / breakLine); i++) {
    finalArr.push([]);
  }

  let segment = 0;
  for (var i = 0; i < arr.length; i++) {
    segment = Math.floor(arr[i] / breakLine);
    finalArr[segment].push(arr[i]);
  }

  return finalArr;
}

function greyScale(grade) {
  return interpolateGreys(grade/8);
}

function chart(querySelector, data, opts) {
  const finalOptions = assign(defaultOptions, opts);

  const svg = select(querySelector);

  let documents = get(data, 'documents');

  let maxWidth = 0;
  let currentY = 1;
  let documentStartY;
  createTooltip(finalOptions);

  /* Create rows for each document */
  documents.map(d => {
    documentStartY = currentY - 1;

    const documentData = get(d, `${finalOptions.valueField}`);
    
    // Check for invalid data
    if (isEmpty(documentData) || documentData === -1 || get(documentData, 'documentLength') === 0) {
      svg.append('text')
        .attr('x', 0)
        .attr('y', currentY)
        .text(`${get(d, finalOptions.labelField)}: ${finalOptions.messages.noData}`)
        .on('mouseover', () => showTooltip(d, finalOptions))
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip)
        .on('click', () => finalOptions.tooltip.onClick(d));
      
      currentY += finalOptions.boxSize.height + 1;
      return false;
    }

    const { documentLength, keywords: documentWords } = documentData;

    maxWidth = documentLength > maxWidth ? documentLength : maxWidth;
    
    // Each word/term will be a new line
    for (const [word, positions] of Object.entries(documentWords)) {
      positions = splitIntoEqualSegments(positions, documentLength, finalOptions.breakLine);
      let currentX = 1;

      // Print cubes representing the frequecy of a keyword/term.
      for(let index = 0; index < positions.length; index++) {
        // scale [0, 8]
        const frequency = positions[index].length > 8 ? 8 : positions[index].length;
        const fillColor = greyScale(frequency);

        svg.append('rect')
            .attr('fill', fillColor)
            .attr('x', currentX)
            .attr('y', currentY)
            .attr('width', finalOptions.boxSize.width)
            .attr('height', finalOptions.boxSize.height);

        currentX += finalOptions.boxSize.width;
      }

      // Move to the next keyword/term/row for the same document.
      currentY += finalOptions.boxSize.height + 1;
    };

    // Enclose the document on a rectangle
    svg.append('rect')
      .attr('x', 0)
      .attr('y', documentStartY)
      .attr('width', finalOptions.boxSize.width * (documentLength / finalOptions.breakLine))
      .attr('height', currentY - documentStartY)
      .style('fill-opacity', 0)
      .style('stroke', 'black')
      .style('stroke-width', 1)
      .on('mouseover', () => showTooltip(d, finalOptions))
      .on('mousemove', moveTooltip)
      .on('mouseout', hideTooltip)
      .on('click', () => finalOptions.tooltip.onClick(d));

    // Separate the document from the next one by 2 units.
    currentY += finalOptions.boxSize.height + 1;
  });

  maxWidth = finalOptions.boxSize.width * (maxWidth / finalOptions.breakLine);
  // Update viewBox size in case to be needed.
  let viewBoxWidth = finalOptions.width > maxWidth ? finalOptions.width : maxWidth;
  let viewBoxHeight = finalOptions.height > currentY ? finalOptions.height : currentY;
  svg.attr('viewBox', [0, 0, viewBoxWidth, viewBoxHeight])
    .attr('width', finalOptions.width)
    .attr('height', finalOptions.height);  
}

module.exports = exports = chart;