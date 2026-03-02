# iOS Build Hatalarını Çözme Kılavuzu

## 🔴 Sorunlar
Görüntülerdeki hatalar:
1. **RNFBMessagingModule.m** - Duplicate method declarations ve expected method body hataları
2. **RCTEventDispatcherProtocol.h** - RCT_EXTERN tanımlama hataları
3. **BoringSSL** - Compiler uyumsuzlukları

## ✅ Çözüm Adımları

### Otomatik Düzeltme (Önerilen)

#### Adım 1: Düzeltme scriptini çalıştırın
```bash
cd mobile
chmod +x scripts/fix-ios-build.sh
./scripts/fix-ios-build.sh
```

Bu script şunları yapar:
- ✅ Pods ve cache temizliği
- ✅ Podfile'ı doğru Firebase versiyonları ile günceller
- ✅ RNFBMessaging header ve implementation dosyalarını düzeltir
- ✅ BoringSSL ve gRPC uyarılarını kapatır
- ✅ Pod install çalıştırır

#### Adım 2: Node.js düzeltme scriptini çalıştırın
```bash
node scripts/fix-rnfb-errors.js
```

Bu script şunları yapar:
- ✅ RNFBMessagingModule.h'ı yeniden oluşturur
- ✅ Duplicate metodları temizler
- ✅ Expected method body hatalarını düzeltir
- ✅ RCTEventDispatcherProtocol.h'ı düzeltir

#### Adım 3: Projeyi build edin
```bash
# iOS simulator'de çalıştırın
npx react-native run-ios

# Veya Xcode'dan açın
open ios/Sahada.xcworkspace
```

---

### Manuel Düzeltme

Eğer scriptler çalışmazsa, manuel olarak şunları yapın:

#### 1. Pods Temizliği
```bash
cd mobile/ios
rm -rf Pods
rm -rf build
rm -f Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*
pod cache clean --all
```

#### 2. Podfile Güncelleme
`ios/Podfile` dosyasını açın ve şu değişiklikleri yapın:

```ruby
platform :ios, '13.4'

target 'Sahada' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => false,
    :fabric_enabled => false
  )

  # Firebase - SABİT VERSİYONLAR
  pod 'Firebase/Analytics', '~> 10.18.0'
  pod 'Firebase/Auth', '~> 10.18.0'
  pod 'Firebase/Firestore', '~> 10.18.0'
  pod 'Firebase/Functions', '~> 10.18.0'
  pod 'Firebase/Messaging', '~> 10.18.0'
  pod 'Firebase/Storage', '~> 10.18.0'

  # BoringSSL fix
  pod 'gRPC-Core', '1.44.0', :modular_headers => true
  pod 'gRPC-C++', '1.44.0', :modular_headers => true
  
  post_install do |installer|
    react_native_post_install(installer)
    
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.4'
        config.build_settings['ENABLE_BITCODE'] = 'NO'
        
        # BoringSSL warnings'i kapat
        if target.name == 'BoringSSL-GRPC'
          config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        end
        
        # gRPC warnings'i kapat
        if target.name.start_with?('gRPC')
          config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        end
        
        # RNFB warnings'i kapat
        if target.name.include?('RNFB')
          config.build_settings['CLANG_WARN_STRICT_PROTOTYPES'] = 'NO'
          config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        end
      end
    end
  end
end
```

#### 3. RNFBMessagingModule.h Düzeltme
Dosya: `ios/Pods/RNFBMessaging/ios/RNFBMessaging/RNFBMessagingModule.h`

```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@import UserNotifications;

@interface RNFBMessagingModule : RCTEventEmitter <RCTBridgeModule, UNUserNotificationCenterDelegate>
@end
```

#### 4. RNFBMessagingModule.m Temizleme
Dosya: `ios/Pods/RNFBMessaging/ios/RNFBMessaging/RNFBMessagingModule.m`

**Silinmesi gereken duplicate metodlar:**
- `RCT_EXPORT_METHOD(getDidOpenSettingsForNotification:...)` - 2. ve sonraki oluşumları sil
- `RCT_EXPORT_METHOD(setAutoInitEnabled:...)` - 2. ve sonraki oluşumları sil
- `RCT_EXPORT_METHOD(signalBackgroundMessageHandlerSet...)` - 2. ve sonraki oluşumları sil
- `RCT_EXPORT_METHOD(getToken...)` - 2. ve sonraki oluşumları sil
- `RCT_EXPORT_METHOD(deleteToken...)` - 2. ve sonraki oluşumları sil
- `RCT_EXPORT_METHOD(getAPNSToken...)` - 2. ve sonraki oluşumları sil

**Çözüm:** Her metoddan sadece BİR tane kalmalı. İkinci ve sonraki oluşumları bulup silin.

#### 5. Pod Install
```bash
cd ios
pod install
cd ..
```

#### 6. Xcode Build Settings Kontrol
Xcode'da projeyi açın:
```bash
open ios/Sahada.xcworkspace
```

Build Settings'de kontrol edin:
- **IPHONEOS_DEPLOYMENT_TARGET**: 13.4
- **ENABLE_BITCODE**: NO
- **CLANG_WARN_STRICT_PROTOTYPES**: NO (RNFB için)

---

## 🔍 Hata Analizi

### Duplicate Declaration Hataları
```
> 85 | RCT_EXPORT_METHOD(getDidOpenSettingsForNotification...
     ^ expected ':'
```

**Sebep:** Aynı metod birden fazla kez tanımlanmış
**Çözüm:** Duplicate olan metodları sil (yukarıdaki listeye bakın)

### Expected Method Body Hataları
```
> 90 | RCT_EXPORT_METHOD(setAutoInitEnabled
     ^ expected method body
```

**Sebep:** Metod tanımı eksik veya bozuk
**Çözüm:** Metod gövdesini ekle veya duplicate olanı sil

### RCT_EXTERN Hataları
```
> 17 | RCT_EXTERN const NSInteger RCTTextUpdateLagWarningThreshold;
     ^ expected ';' after top level declarator
```

**Sebep:** RCT_EXTERN yanlış kullanılmış
**Çözüm:** `const NSInteger` yerine `NSString *const` kullan

---

## 🎯 Başarı Kriterleri

Build başarılı olduğunda şunları göreceksiniz:
```
✅ Build Succeeded
✅ Installing Sahada.app
✅ Launching Sahada
```

---

## 🆘 Sorun Devam Ediyorsa

### 1. Tam temizlik yapın
```bash
cd mobile
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
rm -f ios/Podfile.lock
npm install
cd ios
pod install
cd ..
```

### 2. React Native cache'i temizleyin
```bash
npx react-native start --reset-cache
```

### 3. Xcode Derived Data temizleyin
Xcode menüsünden:
`Product > Clean Build Folder` (Shift + Cmd + K)

### 4. Firebase versiyonlarını kontrol edin
`package.json` dosyasında:
```json
{
  "@react-native-firebase/app": "^18.7.3",
  "@react-native-firebase/messaging": "^18.7.3",
  "@react-native-firebase/auth": "^18.7.3",
  "@react-native-firebase/firestore": "^18.7.3"
}
```

### 5. iOS deployment target kontrol edin
Tüm pods için minimum 13.4 olmalı.

---

## 📚 Ek Kaynaklar

- [React Native Firebase Docs](https://rnfirebase.io/)
- [iOS Build Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- [CocoaPods Troubleshooting](https://guides.cocoapods.org/using/troubleshooting)

---

## ✨ Sonuç

Bu düzeltmelerden sonra projeniz hatasız build olmalı. Sorun devam ederse:
1. Scriptleri çalıştırdığınızdan emin olun
2. Tam temizlik yapın
3. Manuel düzeltmeleri tek tek uygulayın
4. Build loglarını kontrol edin

**Not:** Mac üzerinde çalıştığınız için iOS build işlemleri direkt yapılabilir. Xcode'un en güncel versiyonunu kullandığınızdan emin olun.
