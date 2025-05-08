'use strict';

import { select, scaleLinear } from 'd3';
import { assign, get, has } from 'lodash';

const defaultOptions = {
  labelField: 'metrics.ranking',
  valueField: 'metrics.keywords-position',
  width: 200,
  height: 200,
  fillColor: 'steelblue',
  margin: {top: 0, right: 0, bottom: 0, left: 0},
  numberOfLines: 50,
  messages: {
    'noData': 'Data not available.'
  }
};

function chart(querySelector, data, opts) {
  const finalOptions = assign(defaultOptions, opts);

  const svg = select(querySelector)
    .attr('viewBox', [0, 0, finalOptions.width, finalOptions.height])
    .attr('width', finalOptions.width)
    .attr('height', finalOptions.height);
  
  const documentData = get(data, finalOptions.valueField);

  // Invalid data
  if (! has(documentData, 'documentLength') || ! has(documentData, 'keywords')) {
    let text = svg.append('text')
        .attr('x', 0)
        .text(finalOptions.messages.noData);
    text.attr('y', text.node().getBBox().height);
    return;
  }

  const { documentLength, keywords: documentWords } = documentData;

  /* Create background */
  svg.append('rect')
      .attr('fill', finalOptions.fillColor)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', finalOptions.width)
      .attr('height', finalOptions.height);
  
  let character = {
    width: 1,
    height: 1
  };

  // each line will represent a tenth of the document size
  character.height = finalOptions.height / finalOptions.numberOfLines;
  character.width = (finalOptions.width * finalOptions.height) / (documentLength * character.height);

  /* Position keywords */
  const posX = (p) => {
    return (p % finalOptions.numberOfLines) * character.width;
  };

  const posY = (p) => {
    return Math.floor((p * finalOptions.numberOfLines) / documentLength) * character.height;
  };

  const colors = scaleLinear()
    .domain([0, documentWords.length])
    .range(["red", "blue"]);

  Object.keys(documentWords).forEach((v, i) => {
    const wordPositions = documentWords[v];
    // First layer has the squares
    svg.append('g')
        .attr('fill', colors[i])
      .selectAll('rect')
      .data(wordPositions)
      .join('rect')
        .attr('x', posX)
        .attr('y', posY)
        .attr('height', character.height)
        .attr('width', character.width * v.length);
    // Second layer has the text
    svg.append('g')
        .attr('fill', 'white')
      .selectAll('text')
      .data(wordPositions)
      .join('text')
        .attr('x', posX)
        .attr('y', (p, i) => posY(p, i) + character.height)
        .attr('height', character.height)
        .attr('width', character.width * v.length)
        .attr('font-family', 'monospace')
        .attr('font-size', character.height)
        .text(v);
  });
    
}

module.exports = exports = chart;