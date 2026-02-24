# Gemini'ye yapıştır: Metro / Watchman sorunu – kesin çözüm

Aşağıdaki metni kopyalayıp Gemini'ye yapıştır.

---

## Prompt (Türkçe)

```
Sen bir React Native / Expo ve Metro uzmanısın. Aşağıdaki sorunu kesin çözmem gerekiyor.

ORTOM:
- macOS (zsh)
- React Native + Expo (~50) projesi, klasör yapısı: repo kökü (sahada) ve altında mobile/
- Metro Bundler, Expo start ile çalışıyor
- Kullanıcı sudo yetkisine sahip DEĞİL ("user is not in the sudoers file")

SORUN:
- "npx expo start" veya "npm run mobile:start" çalıştırınca Metro, Watchman'ı kullanmaya çalışıyor.
- "Waiting for Watchman 'watch-project' (10s)...", (30s), (50s)... diye bekliyor; 110+ saniye geçse bile node crawler'a düşmüyor.
- Watchman kurulu; FSEventStreamStart / FSEvents hataları da olabiliyor.
- Amaç: Watchman kullanılmadan Metro'nun SADECE node crawler ile çalışması ve birkaç saniye içinde "Waiting on http://localhost:8081" + QR kodun gelmesi.

DENENENLER (işe yaramadı):
1. CI=1, EXPO_NO_WATCHMAN=1, WATCHMAN_SOCK=/dev/null ortam değişkenleri – Metro yine Watchman bekliyor.
2. metro.config.js içinde watcher.useWatchman: false veya server.watcher.watchman.useWatchman: false – bu Expo/Metro sürümü "Unknown option" diyor, desteklenmiyor.
3. Başlamadan önce watchman shutdown-server ve watch-del-all – yine aynı bekleme.
4. PATH'e sahte bir "watchman" script koyup (exit 1 döndüren) öncelik vermek – Metro yine Watchman bekliyor (belki farklı yoldan veya alt process'te gerçek watchman'ı buluyor).
5. brew uninstall watchman – kullanıcıda sudo yok, yapılamıyor.

İSTİYORUM:
- Sudo veya Watchman'ı kaldırmak zorunda kalmadan, bu Mac'te Metro'nun Watchman'a hiç başvurmadan veya anında "Watchman yok/çalışmıyor" deyip node crawler'a geçmesini sağlayan KESİN çözüm.
- Mümkünse: metro.config.js, ortam değişkenleri veya başlatma script'i (bash) ile yapılabilir bir adım adım çözüm.
- Eğer tek yol Watchman'ı kaldırmaksa, sudo olmadan (ör. Homebrew dizinini kullanıcı sahibi yapmak, veya farklı bir kullanıcı/ortam) nasıl yapılacağını da yaz.

Proje kökü: örn. ~/Documents/sahada
Mobile proje: ~/Documents/sahada/mobile
Başlatma: repo kökünden "npm run mobile:start" (script: git pull sonra "cd mobile && npx expo start").
```

---

## Prompt (English – backup)

```
You are an expert in React Native, Expo, and Metro. I need a definitive fix for the following.

ENVIRONMENT:
- macOS (zsh), React Native + Expo (~50), repo root (sahada) with mobile/ subfolder.
- Metro runs via "npx expo start" or "npm run mobile:start".
- User has NO sudo ("user is not in the sudoers file").

PROBLEM:
- When starting Expo, Metro tries to use Watchman and hangs: "Waiting for Watchman 'watch-project' (10s)...", (30s), (50s)... It never switches to node crawler even after 110+ seconds.
- Watchman is installed; FSEventStreamStart / FSEvents errors can also occur.
- Goal: Metro must use ONLY the node crawler (no Watchman), and show "Waiting on http://localhost:8081" + QR within a few seconds.

ALREADY TRIED (did not work):
1. CI=1, EXPO_NO_WATCHMAN=1, WATCHMAN_SOCK=/dev/null – Metro still waits for Watchman.
2. watcher.useWatchman: false or server.watcher.watchman.useWatchman: false in metro.config.js – this Expo/Metro version reports "Unknown option", not supported.
3. Running watchman shutdown-server and watch-del-all before start – same hang.
4. Putting a fake "watchman" script (exit 1) first in PATH – Metro still waits (may be resolving or invoking Watchman elsewhere).
5. brew uninstall watchman – not possible without sudo.

REQUIRED:
- A definitive solution so that on this Mac Metro does not use Watchman (or immediately falls back to node crawler) without needing sudo or uninstalling Watchman, if possible.
- Prefer steps using metro.config.js, environment variables, or a bash startup script.
- If the only reliable fix is removing Watchman, explain how to do it without sudo (e.g. fixing Homebrew dir ownership or using another user/env).
```

---

Bu dosyayı projede tutup ihtiyaçta Gemini'ye yapıştırabilirsin.
