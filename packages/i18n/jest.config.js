const { nestConfig } = require('@repo/jest-config');

// Plain TypeScript, no decorators: the Nest config only brings the SWC transform
// and the node environment, which is exactly what a schema package needs.
module.exports = { ...nestConfig, rootDir: 'src' };
