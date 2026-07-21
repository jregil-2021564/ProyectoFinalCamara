// metro.config.cjs
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
];

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

config.resolver.unstable_enablePackageExports = false;

module.exports = config;