const { nestConfig } = require('@repo/jest-config');

// `.cjs` because this package is `"type": "module"`.
module.exports = { ...nestConfig, rootDir: 'src' };
