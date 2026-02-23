/**
 * Metro configuration for React Native + Expo Web
 * @format
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Watchman FSEvents hatası olan Mac'te dosya izleme için sadece Node kullan
config.watcher = {
  ...config.watcher,
  useWatchman: false,
};

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
