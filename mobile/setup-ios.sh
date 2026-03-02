#!/bin/bash

echo "🚀 iOS Build Otomatik Kurulum Başlıyor..."
echo "=========================================="

cd "$(dirname "$0")"

# Renkler
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}1. Node modules temizleniyor...${NC}"
rm -rf node_modules package-lock.json
npm install

echo -e "${GREEN}✓ Node modules yüklendi${NC}"

echo -e "${YELLOW}2. iOS klasörü kontrol ediliyor...${NC}"
if [ ! -d "ios" ]; then
  echo -e "${YELLOW}iOS klasörü yok, Expo prebuild çalıştırılıyor...${NC}"
  npx expo prebuild --platform ios --clean
  echo -e "${GREEN}✓ iOS projesi oluşturuldu${NC}"
fi

echo -e "${YELLOW}3. Podfile güncelleniyor...${NC}"
if [ -f "Podfile.template" ]; then
  cp Podfile.template ios/Podfile
  echo -e "${GREEN}✓ Podfile güncellendi${NC}"
else
  echo -e "${YELLOW}Podfile.template bulunamadı, mevcut Podfile kullanılıyor${NC}"
fi

echo -e "${YELLOW}4. CocoaPods yükleniyor...${NC}"
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..

echo -e "${GREEN}✓ CocoaPods yüklendi${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Kurulum tamamlandı!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Şimdi uygulamayı çalıştırabilirsiniz:${NC}"
echo -e "${GREEN}npx react-native run-ios${NC}"
echo ""
echo -e "${YELLOW}Veya Xcode'dan:${NC}"
echo -e "${GREEN}open ios/Sahada.xcworkspace${NC}"
