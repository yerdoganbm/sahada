/**
 * Metro configuration for React Native + Expo Web
 * @format
 */

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Not: Metro config ile Watchman kapatma bu Expo sürümünde desteklenmiyor.
// Watchman hatası devam ederse Mac'te: brew uninstall watchman

const FIREBASE_WEB_STUB = path.resolve(__dirname, 'src/stubs/react-native-firebase-web.js');

// Web platformında: react-native -> react-native-web; @react-native-firebase -> stub (native-only)
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native') {
      return context.resolveRequest(context, 'react-native-web', platform);
    }
    if (moduleName.startsWith('@react-native-firebase/')) {
      return { type: 'resolved', resolution: { type: 'sourceFile', filePath: FIREBASE_WEB_STUB } };
    }
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
