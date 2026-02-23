/**
 * Metro configuration for React Native + Expo Web
 * @format
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Watchman kullanma (FSEvents hatası olan Mac'te node crawler kullan)
config.server = config.server || {};
config.server.watcher = config.server.watcher || {};
config.server.watcher.watchman = { ...(config.server.watcher.watchman || {}), useWatchman: false };

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
