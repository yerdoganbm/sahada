#!/usr/bin/env node
/**
 * RNFBMessaging+AppDelegate.h dosyasında RCT/RNFBApp import'larını
 * #if __has_include bloklarıyla değiştirir. Sonrasında:
 *   npx patch-package @react-native-firebase/messaging
 * ile patch yeniden oluşturulabilir.
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-firebase',
  'messaging',
  'ios',
  'RNFBMessaging',
  'RNFBMessaging+AppDelegate.h'
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
  console.log('Zaten güncel.');
  process.exit(0);
}

if (content.includes('#import <React/RCTBridgeModule.h>')) {
  content = content.replace(
    /#import <React\/RCTBridgeModule.h>\r?\n/,
    BLOCK + '\n'
  );
} else {
  const UIKitImport = content.indexOf('#import <UIKit/UIKit.h>');
  if (UIKitImport === -1) {
    process.exit(0);
  }
  const lineEnd = content.indexOf('\n', UIKitImport) + 1;
  content =
    content.slice(0, lineEnd) +
    '\n' +
    BLOCK +
    '\n' +
    content.slice(lineEnd);
}

fs.writeFileSync(filePath, content);
console.log('Güncellendi:', filePath);
console.log('Patch oluşturmak için: npx patch-package @react-native-firebase/messaging');
