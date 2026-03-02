const fs = require('fs');
const path = require('path');

console.log('🔧 React Native Firebase Messaging Düzeltme Scripti');
console.log('====================================================\n');

const RNFB_PATH = path.join(__dirname, '../node_modules/@react-native-firebase/messaging/ios/RNFBMessaging');
const MODULE_H = path.join(RNFB_PATH, 'RNFBMessagingModule.h');
const MODULE_M = path.join(RNFB_PATH, 'RNFBMessagingModule.m');

// Header dosyasını düzelt
function fixHeaderFile() {
  console.log('📝 RNFBMessagingModule.h düzeltiliyor...');
  
  const headerContent = `/**
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@import UserNotifications;

@interface RNFBMessagingModule : RCTEventEmitter <RCTBridgeModule, UNUserNotificationCenterDelegate>
@end
`;

  try {
    fs.writeFileSync(MODULE_H, headerContent, 'utf8');
    console.log('✅ RNFBMessagingModule.h düzeltildi');
    return true;
  } catch (error) {
    console.error('❌ Header düzeltme hatası:', error.message);
    return false;
  }
}

// Implementation dosyasını düzelt
function fixImplementationFile() {
  console.log('📝 RNFBMessagingModule.m düzeltiliyor...');
  
  if (!fs.existsSync(MODULE_M)) {
    console.error('❌ RNFBMessagingModule.m bulunamadı!');
    return false;
  }

  try {
    const backupPath = MODULE_M + '.backup';
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(MODULE_M, backupPath);
      console.log('📦 Backup alındı:', backupPath);
    }

    let content = fs.readFileSync(MODULE_M, 'utf8');
    
    const duplicateMethods = [
      'getDidOpenSettingsForNotification',
      'setAutoInitEnabled',
      'signalBackgroundMessageHandlerSet',
      'getToken',
      'deleteToken',
      'getAPNSToken'
    ];

    duplicateMethods.forEach(methodName => {
      const regex = new RegExp(
        `RCT_EXPORT_METHOD\\(${methodName}[^)]*\\)\\s*{[^}]*}`,
        'gs'
      );
      
      let matches = content.match(regex);
      if (matches && matches.length > 1) {
        console.log(`🔍 ${methodName} için ${matches.length} duplicate bulundu, temizleniyor...`);
        const firstMatch = matches[0];
        content = content.replace(regex, '');
        const insertPosition = content.indexOf('@implementation RNFBMessagingModule');
        if (insertPosition !== -1) {
          const endOfImplementation = content.indexOf('\n\n', insertPosition + 50);
          content = content.slice(0, endOfImplementation) + '\n\n' + firstMatch + '\n' + content.slice(endOfImplementation);
        }
      }
    });

    content = content.replace(
      /RCT_EXPORT_METHOD\(([^)]+)\)\s*:\s*\(([^)]+)\)([^;{]+)$/gm,
      'RCT_EXPORT_METHOD($1):($2)$3 {\n  // TODO: Implement\n}'
    );

    fs.writeFileSync(MODULE_M, content, 'utf8');
    console.log('✅ RNFBMessagingModule.m düzeltildi');
    return true;
  } catch (error) {
    console.error('❌ Implementation düzeltme hatası:', error.message);
    return false;
  }
}

// RCTEventDispatcherProtocol.h düzeltmesi
function fixEventDispatcherProtocol() {
  console.log('📝 RCTEventDispatcherProtocol.h kontrol ediliyor...');
  
  const reactNativePath = path.join(__dirname, '../node_modules/react-native');
  const eventDispatcherPath = path.join(
    reactNativePath,
    'React/Base/RCTEventDispatcherProtocol.h'
  );

  if (!fs.existsSync(eventDispatcherPath)) {
    console.log('⚠️  RCTEventDispatcherProtocol.h bulunamadı, atlanıyor...');
    return true;
  }

  try {
    let content = fs.readFileSync(eventDispatcherPath, 'utf8');
    content = content.replace(
      /RCT_EXTERN\s+const\s+NSInteger\s+(\w+);/g,
      'RCT_EXTERN NSString *const $1;'
    );

    const lines = content.split('\n');
    const seen = new Set();
    const filtered = lines.filter(line => {
      if (line.includes('RCT_EXTERN')) {
        if (seen.has(line.trim())) return false;
        seen.add(line.trim());
      }
      return true;
    });

    fs.writeFileSync(eventDispatcherPath, filtered.join('\n'), 'utf8');
    console.log('✅ RCTEventDispatcherProtocol.h düzeltildi');
    return true;
  } catch (error) {
    console.error('❌ EventDispatcherProtocol düzeltme hatası:', error.message);
    return false;
  }
}

function main() {
  let success = true;
  if (!fixHeaderFile()) success = false;
  console.log('');
  if (!fixImplementationFile()) success = false;
  console.log('');
  if (!fixEventDispatcherProtocol()) success = false;

  console.log('\n====================================================');
  if (success) {
    console.log('✅ Tüm düzeltmeler başarıyla tamamlandı!');
    console.log('\n📱 Şimdi projeyi yeniden build edebilirsiniz:');
    console.log('   cd ios && pod install && cd ..');
    console.log('   npx react-native run-ios');
  } else {
    console.log('⚠️  Bazı düzeltmeler tamamlanamadı!');
  }
  console.log('====================================================\n');
  process.exit(success ? 0 : 1);
}

main();
