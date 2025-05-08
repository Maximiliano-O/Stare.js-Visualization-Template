'use strict';

const debug = require('debug')('stare.js:client/d3');

try {
  require.resolve(`${process.cwd()}/node_modules/d3`);
} catch(e) {
  debug("Package 'd3' is not installed");
  process.exit(e.code);
}

module.exports = exports = {
  bar: require('./bar'),
  bubble: require('./bubble'),
  network: require('./network'),
  stackedBar: require('./stacked-bar'),
  tiles: require('./tiles'),
  tiles2: require('./tiles-2'),
  tiles3: require('./tiles-3'),
};