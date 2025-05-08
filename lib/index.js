import { has } from 'lodash';

const availableLibraries = {
  'd3': require('./d3'),
  'three': require('./three')
};

function getChart(library, visualizationType) {
  if (! has(availableLibraries, library)) {
    throw new Error(`StArE.js doesn't have support for the library '${library}'`);
  }
  if (! has(availableLibraries[library], visualizationType)) {
    throw new Error(`There is no visualization '${visualizationType}' for library '${library}'`);
  }

  return availableLibraries[library][visualizationType];
}

module.exports = exports = getChart;