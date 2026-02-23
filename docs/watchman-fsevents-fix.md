# Watchman "FSEventStreamStart failed" Hatası — Çözüm

Bu hata React Native / Metro çalıştırırken Watchman'ın dosya izleyicisini başlatamadığında çıkar.

## 1. Watchman'ı sıfırla ve yeniden başlat

Terminalde (Mac):

```bash
watchman shutdown-server
watchman watch-del-all
```

Sonra projede tekrar:

```bash
cd mobile
npm start
# veya: npx react-native start
```

## 2. Watchman yüklü değilse veya güncelle

```bash
brew install watchman
# veya güncelle:
brew upgrade watchman
watchman watch-del-all
```

## 3. Dosya limitini artır (EMFILE / çok fazla izleme)

```bash
ulimit -n          # mevcut limit (örn. 256)
ulimit -n 4096     # oturum için artır
```

Kalıcı yapmak için `~/.zshrc` veya `~/.bash_profile` sonuna ekle:

```bash
ulimit -n 4096
```

## 4. Watchman log'una bak

Hata mesajındaki log dosyasına bak (FSEvents satırları):

```bash
cat ~/.local/state/watchman/$(whoami)-state/log | grep -i fsevents
```

## 5. Geçici çözüm: Watchman olmadan çalıştır

Metro'yu Watchman kullanmadan başlatmak için (daha yavaş olabilir):

```bash
cd mobile
CI=1 npx react-native start
```

veya `metro.config.js` ile watchman'ı kapatma seçenekleri varsa kullan.

## 6. Tam temizlik (son çare)

```bash
cd mobile
rm -rf node_modules
npm install
watchman watch-del-all
npm start
```

## 7. Watchman'ı kaldır (FSEvents hatası devam ederse)

Metro sürekli Watchman'a bağlanmaya çalışıyorsa, Watchman'ı tamamen kaldır. Metro otomatik olarak node crawler kullanır:

```bash
brew uninstall watchman
```

Sonra `npm run mobile:start` veya `npx expo start`. Gerekirse tekrar yüklersin: `brew install watchman`.
