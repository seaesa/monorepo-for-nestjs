const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withUniwindConfig } = require('uniwind/metro');

// Sentry's config extends Expo's default and adds debug ids so source maps match release bundles.
const config = getSentryExpoConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './uniwind-types.d.ts',
});
