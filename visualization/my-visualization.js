'use strict';

// Renamed file for Network Visualization example

import { select, event, drag as _drag, forceSimulation, forceLink, forceManyBody, forceX, forceY, scaleOrdinal, schemeCategory10 } from 'd3';
import { isArray, assign, get } from 'lodash';

const defaultOptions = {
  labelField: 'metrics.ranking',
  linksField: 'metrics.links',
  width: 1000,
  height: 800,
  fontStyle: '12px sans-serif',
  mainNode: {
    fillColor: 'orange',
    radius: (item, arr) => 10 + 2 * (arr.length - item.data.metrics.ranking),
  },
  targetNode: {
    fillColor: 'black',
    radius: 5,
  },
  tooltip: {
    style: 'position: absolute;padding: 4px; width: 300px; background-color: #f9f9f9; border: 1px solid; border-radius: 2px; pointer-events: none; opacity: 0;',
    content: (item) => {
      return `<div>Ranking: <b>${get(item, 'metrics.ranking', null)}</b></div><div><b>${item.title}</b></div><div>${item.snippet}</div>`;
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

const drag = simulation => {
  
  function dragstarted(d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  function dragended(d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  
  return _drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}

function linkArc(d) {
  const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
  return `
    M${d.source.x},${d.source.y}
    A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
  `;
}

function processData(data) {
  let formattedData = {
    links: [],
    nodes: []
  };

  for (let i = data.length - 1; i >= 0; i--) {
    if (isArray(data[i].metrics.links)) {
      // Creates nodes for original SERP results hostnames.
      // and prevent duplicates hostnames
      const ifExistsIndex = formattedData.nodes.findIndex(n => n.id === data[i].metrics.links[0]);
      if (ifExistsIndex === -1) {
        formattedData.nodes.push({
          id: data[i].metrics.links[0],
          type: 'mainNode',
          data: data[i]
        });
      } else {
        formattedData.nodes[ifExistsIndex].type = 'mainNode';
        formattedData.nodes[ifExistsIndex].data = data[i];
      }

      for (let j = data[i].metrics.links.length - 1; j > 0; j--) {
        const currentHostname = data[i].metrics.links[j];

        if (formattedData.nodes.findIndex(n => n.id === currentHostname) === -1) {
          formattedData.nodes.push({ id: currentHostname });
        }

        formattedData.links.push({
          source: data[i].metrics.links[0],
          target: currentHostname,
          type: 'sources'
        });
      }
    }
  }

  return formattedData;
}

const types = ['sources'];

function chart(querySelector, data, opts) {
  const finalOptions = assign(defaultOptions, opts);

  data = get(data, 'documents');
  createTooltip(finalOptions);

  const formattedData = processData(data);

  const links = formattedData.links.map(d => Object.create(d));
  const nodes = formattedData.nodes.map(d => Object.create(d));

  const simulation = forceSimulation(nodes)
      .force("link", forceLink(links).id(d => d.id))
      .force("charge", forceManyBody().strength(-400))
      .force("x", forceX())
      .force("y", forceY());

  const svg = select(querySelector)
    .attr("viewBox", [-finalOptions.width / 2, -finalOptions.height / 2, finalOptions.width, finalOptions.height])
    .attr('width', finalOptions.width)
    .attr('height', finalOptions.height)
    .style("font", finalOptions.fontStyle);

  const color = scaleOrdinal(types, schemeCategory10);

  // Per-type markers, as they don't inherit styles.
  svg
    .append("defs")
    .selectAll("marker")
    .data(types)
    .join("marker")
      .attr("id", d => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -0.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
    .append("path")
      .attr("fill", color)
      .attr("d", "M0,-5L10,0L0,5");

  const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(links)
    .join("path")
      .attr("stroke", d => color(d.type))
      .attr("marker-end", d => `url(${new URL(`#arrow-${d.type}`, location)})`);

  const node = svg.append("g")
      .attr("fill", "currentColor")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
    .selectAll("g")
    .data(nodes)
    .join("g")
      .call(drag(simulation))
    .on('mouseover', n => {
      if (get(formattedData.nodes[n.index], 'type') === 'mainNode') {
        showTooltip(n.data, finalOptions);
      }
    })
    .on('mousemove', n => {
      if (get(formattedData.nodes[n.index], 'type') === 'mainNode') {
        moveTooltip();
      }
    })
    .on('mouseout', n => {
      if (get(formattedData.nodes[n.index], 'type') === 'mainNode') {
        hideTooltip();
      }
    })
    .on('click', n => {
      if (get(formattedData.nodes[n.index], 'type') === 'mainNode') {
        finalOptions.tooltip.onClick(n.data);
      }
    });

  node.append("circle")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("style", 'z-index: -1')
      .style("fill", (n) => {
        if (get(formattedData.nodes[n.index], 'type') === 'mainNode') {
          return finalOptions.mainNode.fillColor;
        }
        return finalOptions.targetNode.fillColor;
      })
      .attr("r", (n) => {
        if (get(formattedData.nodes[n.index], 'type') === 'mainNode') {
          const { radius } = finalOptions.mainNode;
          return (typeof radius === 'function') ? radius(formattedData.nodes[n.index], data) : radius;
        }
        const { radius } = finalOptions.targetNode;
        return (typeof radius === 'function') ? radius(formattedData.nodes[n.index], data) : radius;
      });

  node.append("text")
      .attr("x", 8)
      .attr("y", "0.31em")
      .text(d => d.id)
    .clone(true).lower()
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3);

  simulation.on("tick", () => {
    link.attr("d", linkArc);
    node.attr("transform", d => `translate(${d.x},${d.y})`);

    // Update viewBox based on final position of nodes
    // let maxX = 0,
    //     maxY = 0,
    //     minX = 0,
    //     minY = 0;

    // node.each((d) => {
    //   if (d.x < minX) minX = d.x;
    //   if (d.x > maxX) maxX = d.x;
    //   if (d.y < minY) minY = d.y;
    //   if (d.y > maxY) maxY = d.y;
    // });


    // svg.attr("viewBox", [minX/2, minY/2, (maxX-minX), (maxY-minY)]);
  });

}

module.exports = exports = chart;
