#!/bin/bash

echo "🔧 iOS Build Hatalarını Düzeltme Scripti"
echo "=========================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/.."

echo -e "${YELLOW}1. Pods dizinini temizleme...${NC}"
cd ios 2>/dev/null || { echo -e "${RED}ios dizini bulunamadı!${NC}"; exit 1; }
rm -rf Pods
rm -rf build
rm -f Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*

echo -e "${GREEN}✓ Temizlik tamamlandı${NC}"

echo -e "${YELLOW}2. CocoaPods cache temizleme...${NC}"
pod cache clean --all

echo -e "${YELLOW}3. Package yeniden yükleme...${NC}"
cd ..
npm install

echo -e "${YELLOW}4. Podfile güncelleme...${NC}"
cd ios

# Podfile'ı güncelle
cat > Podfile << 'EOF'
# Resolve react_native_pods.rb with node to allow for hoisting
require Pod::Executable.execute_command('node', ['-p',
  'require.resolve(
    "react-native/scripts/react_native_pods.rb",
    {paths: [process.argv[1]]},
  )', __dir__]).strip

platform :ios, min_ios_version_supported
prepare_react_native_project!

linkage = ENV['USE_FRAMEWORKS']
if linkage != nil
  Pod::UI.puts "Configuring Pod with #{linkage}ally linked Frameworks".green
  use_frameworks! :linkage => linkage.to_sym
end

target 'Sahada' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => false,
    :fabric_enabled => false,
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  # Firebase bağımlılıkları - sabit versiyonlar
  pod 'Firebase/Analytics', '~> 10.18.0'
  pod 'Firebase/Auth', '~> 10.18.0'
  pod 'Firebase/Firestore', '~> 10.18.0'
  pod 'Firebase/Functions', '~> 10.18.0'
  pod 'Firebase/Messaging', '~> 10.18.0'
  pod 'Firebase/Storage', '~> 10.18.0'

  # BoringSSL hatası için
  pod 'gRPC-Core', '1.44.0', :modular_headers => true
  pod 'gRPC-C++', '1.44.0', :modular_headers => true
  
  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
    
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        # Build ayarları
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.4'
        config.build_settings['ENABLE_BITCODE'] = 'NO'
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'GPB_USE_PROTOBUF_FRAMEWORK_IMPORTS=1'
        
        # BoringSSL düzeltmeleri
        if target.name == 'BoringSSL-GRPC'
          config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)', 'COCOAPODS=1']
        end
        
        # gRPC düzeltmeleri
        if target.name.start_with?('gRPC')
          config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        end
        
        # React Native Firebase düzeltmeleri
        if target.name.include?('RNFB')
          config.build_settings['CLANG_WARN_STRICT_PROTOTYPES'] = 'NO'
          config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        end
      end
    end
  end
end
EOF

echo -e "${GREEN}✓ Podfile güncellendi${NC}"

echo -e "${YELLOW}5. Pod install çalıştırılıyor...${NC}"
pod install --repo-update

echo -e "${YELLOW}6. RNFBMessaging header dosyasını düzeltme...${NC}"
RNFB_MESSAGING_HEADER="Pods/RNFBMessaging/ios/RNFBMessaging/RNFBMessagingModule.h"

if [ -f "$RNFB_MESSAGING_HEADER" ]; then
  cat > "$RNFB_MESSAGING_HEADER" << 'EOF'
/**
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
EOF
  echo -e "${GREEN}✓ RNFBMessagingModule.h düzeltildi${NC}"
else
  echo -e "${YELLOW}! RNFBMessagingModule.h bulunamadı, devam ediliyor...${NC}"
fi

echo -e "${YELLOW}7. RNFBMessaging implementation dosyasını düzeltme...${NC}"
RNFB_MESSAGING_IMPL="Pods/RNFBMessaging/ios/RNFBMessaging/RNFBMessagingModule.m"

if [ -f "$RNFB_MESSAGING_IMPL" ]; then
  # Backup al
  cp "$RNFB_MESSAGING_IMPL" "${RNFB_MESSAGING_IMPL}.backup"
  
  # Duplicate metodları temizle - sed ile
  sed -i '' '/^RCT_EXPORT_METHOD(getDidOpenSettingsForNotification:/,/^}/d' "$RNFB_MESSAGING_IMPL"
  sed -i '' '/^RCT_EXPORT_METHOD(setAutoInitEnabled:/,/^}/d' "$RNFB_MESSAGING_IMPL"
  sed -i '' '/^RCT_EXPORT_METHOD(signalBackgroundMessageHandlerSet/,/^}/d' "$RNFB_MESSAGING_IMPL"
  sed -i '' '/^RCT_EXPORT_METHOD(getToken/,/^}/d' "$RNFB_MESSAGING_IMPL"
  sed -i '' '/^RCT_EXPORT_METHOD(deleteToken/,/^}/d' "$RNFB_MESSAGING_IMPL"
  sed -i '' '/^RCT_EXPORT_METHOD(getAPNSToken/,/^}/d' "$RNFB_MESSAGING_IMPL"
  
  echo -e "${GREEN}✓ RNFBMessagingModule.m temizlendi${NC}"
else
  echo -e "${YELLOW}! RNFBMessagingModule.m bulunamadı, devam ediliyor...${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Tüm düzeltmeler tamamlandı!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Şimdi şunu çalıştırın:${NC}"
echo -e "${GREEN}npx react-native run-ios${NC}"
echo ""
echo -e "${YELLOW}veya Xcode'dan projeyi açıp build edin:${NC}"
echo -e "${GREEN}open ios/Sahada.xcworkspace${NC}"
