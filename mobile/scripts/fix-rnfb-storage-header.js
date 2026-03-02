#!/usr/bin/env node
/**
 * RNFBStorageModule.m dosyasına RCT/RNFBApp import'larını ekler (iOS build fix).
 * Dosya yoksa sessizce çıkış yapar (postinstall kırılmaz).
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-firebase',
  'storage',
  'ios',
  'RNFBStorage',
  'RNFBStorageModule.m'
);

const BLOCK = `#if __has_include(<RNFBApp/RNFBAppModule.h>)
#import <RNFBApp/RNFBAppModule.h>
#endif

#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>
#elif __has_include(<React-Core/RCTBridgeModule.h>)
#import <React-Core/RCTBridgeModule.h>
#endif

`;

if (!fs.existsSync(filePath)) {
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('#if __has_include(<RNFBApp/RNFBAppModule.h>)')) {
  process.exit(0);
}

const marker = '#import <React/RCTUtils.h>\n\n';
const idx = content.indexOf(marker);
if (idx === -1) {
  process.exit(0);
}

content =
  content.slice(0, idx + marker.length) +
  BLOCK +
  content.slice(idx + marker.length);
fs.writeFileSync(filePath, content);
