'use strict';

const debug = require('debug')('stare.js:client/three');

try {
  require.resolve(`${process.cwd()}/node_modules/three`);
} catch(e) {
  debug("Package 'three' is not installed");
  process.exit(e.code);
}

module.exports = exports = {
  grid: require('./grid'),
};