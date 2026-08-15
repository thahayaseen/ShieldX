const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Polyfill Node built-ins that third-party packages (e.g. markdown-it) import.
// `punycode` was removed from Node core in v22 and is not available in the
// React Native JS runtime, so we redirect it to the npm userland package.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  punycode: require.resolve("punycode"),
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
