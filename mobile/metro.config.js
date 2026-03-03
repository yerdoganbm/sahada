/**
 * Metro configuration for React Native + Expo Web
 * @format
 */

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove deprecated watcher.unstable_workerThreads to fix validation warning
if (config.watcher && 'unstable_workerThreads' in config.watcher) {
  delete config.watcher.unstable_workerThreads;
}

// Not: Metro config ile Watchman kapatma bu Expo sürümünde desteklenmiyor.
// Watchman hatası devam ederse Mac'te: brew uninstall watchman

const stubsDir = path.resolve(__dirname, 'src/stubs');
const FIREBASE_WEB_STUB = path.join(stubsDir, 'react-native-firebase-web.js');
const EXPO_GO_STUBS = {
  '@react-native-firebase/app': path.join(stubsDir, 'expo-go-firebase-app.js'),
  '@react-native-firebase/firestore': path.join(stubsDir, 'expo-go-firebase-firestore.js'),
  '@react-native-firebase/storage': path.join(stubsDir, 'expo-go-firebase-storage.js'),
  '@react-native-firebase/functions': path.join(stubsDir, 'expo-go-firebase-functions.js'),
  '@react-native-firebase/messaging': path.join(stubsDir, 'expo-go-firebase-messaging.js'),
};
const useExpoGoStubs = process.env.EXPO_GO_STUBS === '1';

// Web: react-native -> react-native-web; @react-native-firebase -> web stub
// Expo Go (EXPO_GO_STUBS=1): @react-native-firebase/* -> expo-go stubs
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native') {
      return context.resolveRequest(context, 'react-native-web', platform);
    }
    if (moduleName.startsWith('@react-native-firebase/')) {
      return { type: 'sourceFile', filePath: FIREBASE_WEB_STUB };
    }
  }
  if (useExpoGoStubs && moduleName.startsWith('@react-native-firebase/')) {
    const stubPath = EXPO_GO_STUBS[moduleName];
    if (stubPath) return { type: 'sourceFile', filePath: stubPath };
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
