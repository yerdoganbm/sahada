/**
 * Metro configuration for React Native + Expo Web
 * @format
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Not: Metro config ile Watchman kapatma bu Expo sürümünde desteklenmiyor.
// Watchman hatası devam ederse Mac'te: brew uninstall watchman

// Web platformında react-native -> react-native-web (Expo bazen bunu atlıyor)
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native') {
    return context.resolveRequest(context, 'react-native-web', platform);
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
