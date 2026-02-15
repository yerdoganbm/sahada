# 📱 Sahada - Mobile-First Halı Saha Otomasyonu

**Maç Senin. Kontrol Sende.**

[![PWA Ready](https://img.shields.io/badge/PWA-ready-10B981?style=flat-square)](/)
[![Mobile Optimized](https://img.shields.io/badge/Mobile-optimized-10B981?style=flat-square)](/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square)](/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square)](/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=flat-square)](/)

---

## ✨ Özellikler

### 📱 Mobile-First Design
- ✅ **Responsive**: Tüm ekran boyutları (320px+)
- ✅ **Touch-Optimized**: 44px minimum touch targets
- ✅ **PWA**: Offline support, install to home screen
- ✅ **Native-like UX**: Bottom tabs, pull to refresh, swipe gestures
- ✅ **Safe Areas**: Notch & home indicator support

### ⚽ Halı Saha Yönetimi
- ✅ **52 Ekran**: Dashboard, maç, takım, saha, ödeme, polling, ve daha fazlası
- ✅ **RBAC**: Admin, Kaptan, Üye, Saha Sahibi, Scout rolleri
- ✅ **Real-time**: WhatsApp entegrasyonu, bildirimler
- ✅ **Analytics**: Libero Quantum Genesis test framework

### 🚀 Teknoloji Stack
- **Frontend**: React 19.2, TypeScript 5.8, Vite 6.4
- **Backend**: Express.js, MongoDB
- **Test**: Playwright (E2E, Integration, Unit, RBAC, A11y)
- **AI**: Neuro Core (behavioral analytics)

---

## 🎯 Hızlı Başlangıç

### 1️⃣ Kurulum
```bash
# Clone repository
git clone [your-repo-url]
cd sahada

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 2️⃣ Test Kullanıcıları
Giriş ekranında:
- **Admin**: `1` → Ahmet Yılmaz (tüm yetkiler)
- **Kaptan**: `7` → Burak Yılmaz (kaptan yetkisi)
- **Üye**: `2` → Mehmet Demir (standart üye)

### 3️⃣ Tarayıcıda Aç
```
http://localhost:3000
```

**Mobile test için:**
- DevTools → Device Toolbar (Ctrl+Shift+M)
- Veya telefondan: `http://[your-ip]:3000`

---

## 📱 Mobile Özellikler

### Bottom Navigation
4 ana tab:
- 🏠 Ana Sayfa (Dashboard)
- ⚽ Maçlar
- 👥 Takım
- 👤 Profil

### Pull to Refresh
Herhangi bir ekranda aşağı çekerek yenile.

### PWA Install
- **Android**: "Ana ekrana ekle" banner
- **iOS**: Safari → Share → "Add to Home Screen"

### Gestures
- **Swipe**: Ekranlar arası geçiş
- **Haptic Feedback**: Touch geri bildirimi
- **Safe Areas**: iPhone notch desteği

---

## 🧪 Test Komutları

```bash
# Tüm testler
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (headed)
npm run test:headed

# PWA test (Lighthouse)
npm run build
npm run preview
# DevTools → Lighthouse → PWA
```

---

## 📦 Production Build

```bash
# Build
npm run build

# Preview
npm run preview

# Deploy (Vercel)
vercel --prod

# Deploy (Netlify)
netlify deploy --prod
```

---

## 📂 Proje Yapısı

```
sahada/
├── src/
│   ├── screens/           # 52 ekran
│   ├── components/        # Reusable components
│   │   ├── BottomNav.tsx       # Mobile navigation
│   │   ├── MobileHeader.tsx    # Mobile header
│   │   ├── PullToRefresh.tsx   # Pull gesture
│   │   └── InstallBanner.tsx   # PWA prompt
│   ├── hooks/
│   │   └── useMobileFeatures.ts  # Mobile hooks
│   ├── styles/
│   │   ├── animations.css  # Animations
│   │   └── mobile.css      # Responsive styles
│   ├── App.tsx            # Main app
│   └── types.ts           # TypeScript types
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── icons/             # App icons
├── server/
│   ├── api-server.ts      # Express API
│   └── db/                # MongoDB
├── tests/                 # Playwright tests
└── package.json
```

---

## 🎨 Design System

### Colors
- **Primary**: `#10B981` (Emerald-500)
- **Secondary**: `#0B0F1A` (Deep Navy)
- **Surface**: `#151e32` (Card background)
- **Alert**: `#F59E0B` (Warning Orange)

### Typography
- **Font**: Inter (sans-serif)
- **Mono**: JetBrains Mono

### Spacing
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 24px

---

## 📱 PWA Features

- ✅ **Offline Mode**: Service worker caching
- ✅ **Install Prompt**: Add to home screen
- ✅ **App Shortcuts**: Quick actions
- ✅ **Push Notifications**: (Ready)
- ✅ **Background Sync**: (Ready)
- ✅ **Share Target**: Share to app

---

## 🎯 Ekranlar (52)

### Team Management
- Dashboard, Team List, Match Details, Lineup Manager
- Member Management, Join Requests, Transfer System
- Scout Dashboard, Talent Pool, Scout Reports

### Venue Management
- Venue List, Venue Details, Venue Calendar
- Reservation System, Financial Reports
- Customer Management

### Match & Payment
- Match Create, Match Details, Attendance
- Payment Ledger, Debt List, Financial Reports
- Polls, Leaderboard, Tournament

### Admin & Settings
- Admin Dashboard, WhatsApp Integration
- Settings, Profile, Notifications
- Message Logs, Booking System

---

## 🔐 Authentication & RBAC

### Roles
- **Admin**: Tüm yönetim yetkileri
- **Captain**: Takım yönetimi, kadro
- **Member**: Standart üye özellikleri
- **Venue Owner**: Saha yönetimi
- **Scout**: Yetenek keşfi

### Protected Routes
- Admin dashboard, financial reports, member management
- Venue owner dashboard, reservations
- Scout dashboard, talent pool

---

## 🧠 Neuro Core Analytics

Otomatik kullanıcı davranış analizi:
- Screen tracking
- Action logging
- Pattern recognition
- Predictive insights

```typescript
import { useSynapseTracking } from './hooks/useNeuroCore';

// Auto-track screen changes
useSynapseTracking(userId, currentScreen);
```

---

## 🎊 Changelog

### v1.0.0 - Mobile Uyumluluk (2026-02-15)
- ✅ Responsive CSS eklendi
- ✅ PWA manifest ve service worker
- ✅ Bottom navigation
- ✅ Mobile header
- ✅ Pull to refresh
- ✅ Install banner
- ✅ Mobile hooks (gestures, haptics, PWA)
- ✅ Safe area support
- ✅ Touch optimizations

### v0.9.0 - Web App (Önceki)
- ✅ 52 ekran geliştirme
- ✅ RBAC implementation
- ✅ MongoDB entegrasyonu
- ✅ Playwright test suite
- ✅ Libero Quantum Genesis
- ✅ Neuro Core analytics

---

## 📚 Dokümantasyon

- [`APP_STRUCTURE.md`](./APP_STRUCTURE.md) - Uygulama yapısı
- [`BACKEND_SETUP.md`](./BACKEND_SETUP.md) - Backend kurulumu
- [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) - Deploy rehberi
- [`MOBILE_IMPROVEMENTS.md`](./MOBILE_IMPROVEMENTS.md) - Mobile özellikler
- [`README_FULL.md`](./README_FULL.md) - Detaylı README

---

## 🤝 Contributing

Pull requests memnuniyetle karşılanır!

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - Detaylar için `LICENSE` dosyasına bakın.

---

## 📞 İletişim

**Sahada Team**  
Email: [your-email]  
GitHub: [your-github]

---

## 🎯 Roadmap

### Yakında
- [ ] Backend API deployment
- [ ] Real-time WebSocket
- [ ] Push notifications (Firebase)
- [ ] Biometric auth (Touch ID, Face ID)
- [ ] Location services
- [ ] Camera integration
- [ ] Multi-language support (i18n)

### Gelecek
- [ ] Native mobile apps (React Native)
- [ ] Desktop app (Electron)
- [ ] Voice commands
- [ ] AI match predictions
- [ ] Social features

---

**⚽ Sahada - Maç Senin. Kontrol Sende.** 🚀
