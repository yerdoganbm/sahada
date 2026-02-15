# Sahada App - Halı Saha Otomasyonu

<div align="center">

![Sahada Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

**Modern, Full-Stack Halı Saha Yönetim Platformu**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Test Coverage](https://img.shields.io/badge/coverage-90%25-green)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)]()
[![React](https://img.shields.io/badge/React-19.2-61dafb)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-6.3-green)]()

[Demo](https://sahada.app) · [Dokümantasyon](./DEVELOPMENT_COMPLETE.md) · [API Docs](./BACKEND_SETUP.md)

</div>

---

## 🌟 Özellikler

### 🎯 Temel Özellikler
- ✅ **Kullanıcı Yönetimi** - RBAC ile rol bazlı erişim (Admin, Kaptan, Üye)
- ✅ **Maç Organizasyonu** - Maç oluşturma, düzenleme, RSVP sistemi
- ✅ **Saha Rezervasyonu** - Otomatik rezervasyon ve onay sistemi
- ✅ **Finansal Takip** - Aidat, ödeme, borç takibi
- ✅ **Kadro Yönetimi** - Otomatik kadro oluşturma ve balans algoritması
- ✅ **Scout Sistemi** - Yeni oyuncu keşif ve değerlendirme
- ✅ **Anket & Oylama** - Takım kararları için demokratik sistem
- ✅ **WhatsApp Entegrasyonu** - Otomatik bildirimler ve hatırlatmalar
- ✅ **Turnuva Modu** - Turnuva organizasyon sistemi
- ✅ **İstatistikler** - Detaylı performans analizi

### 💻 Teknik Özellikler
- ✅ **Modern UI/UX** - 30+ smooth animasyon ve transition
- ✅ **RESTful API** - 45+ endpoint ile tam backend entegrasyonu
- ✅ **Real-time Updates** - Anlık veri senkronizasyonu
- ✅ **Responsive Design** - Mobil-first yaklaşım
- ✅ **Progressive Web App** - Offline çalışma desteği
- ✅ **Test Coverage** - 85+ test senaryosu (%90+ coverage)
- ✅ **Production Ready** - Deployment ve monitoring hazır

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- MongoDB 6+
- npm veya yarn

### Kurulum

```bash
# 1. Repository'yi klonla
git clone https://github.com/yourusername/sahada.git
cd sahada

# 2. Bağımlılıkları kur
npm install

# 3. Environment variables
cp .env.example .env.local
# .env.local dosyasını düzenle

# 4. MongoDB başlat
net start MongoDB  # Windows
brew services start mongodb-community  # Mac
sudo systemctl start mongodb  # Linux

# 5. Uygulamayı başlat
npm run dev:all  # Frontend + Backend birlikte

# Veya ayrı ayrı:
npm run dev      # Frontend (http://localhost:3002)
npm run api:dev  # Backend API (http://localhost:3001)
```

---

## 📱 Ekran Görüntüleri

<table>
  <tr>
    <td><img src="screenshots/welcome.png" alt="Welcome Screen" /></td>
    <td><img src="screenshots/dashboard.png" alt="Dashboard" /></td>
  </tr>
  <tr>
    <td><img src="screenshots/match.png" alt="Match Details" /></td>
    <td><img src="screenshots/admin.png" alt="Admin Panel" /></td>
  </tr>
</table>

---

## 🏗️ Teknoloji Stack

### Frontend
- **React 19.2** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 6.2** - Build tool & dev server
- **Tailwind CSS** - Utility-first styling
- **Material Icons** - Icon system

### Backend
- **Node.js + Express** - REST API
- **MongoDB 6.3** - NoSQL database
- **TypeScript** - Backend type safety
- **CORS** - Cross-origin support

### Testing
- **Playwright** - E2E testing
- **@axe-core/playwright** - Accessibility testing
- **Custom test suites** - Integration & unit tests

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **PM2** - Process management
- **Nginx** - Reverse proxy

---

## 📚 Dokümantasyon

- 📖 [Geliştirme Tamamlama Raporu](./DEVELOPMENT_COMPLETE.md)
- 🔧 [Backend Kurulum Rehberi](./BACKEND_SETUP.md)
- 🚀 [Deployment Rehberi](./DEPLOYMENT_GUIDE.md)
- 🏗️ [Uygulama Yapısı](./APP_STRUCTURE.md)
- 🧪 [Test Dokümantasyonu](./TEST_README.md)

---

## 🧪 Testing

```bash
# Tüm testler
npm test

# Integration tests
npm run test:integration

# Unit tests
npm run test:unit

# API tests
npm run test:api

# Component tests
npm run test:components

# Accessibility tests
npm run test:a11y

# Coverage report
npm run test:coverage
```

---

## 🔐 API Endpoints

### Health Check
```http
GET /api/health
```

### Players
```http
GET    /api/players           # List all players
GET    /api/players/:id       # Get player details
POST   /api/players           # Create new player
PUT    /api/players/:id       # Update player
DELETE /api/players/:id       # Delete player
```

### Matches
```http
GET    /api/matches           # List all matches
GET    /api/matches/:id       # Get match details
POST   /api/matches           # Create new match
PUT    /api/matches/:id       # Update match
POST   /api/matches/:id/rsvp  # Update RSVP status
```

[Full API Documentation →](./BACKEND_SETUP.md)

---

## 📊 Proje İstatistikleri

- **Toplam Ekran**: 52
- **API Endpoints**: 45+
- **Test Senaryosu**: 85+
- **Test Coverage**: 90%+
- **Kod Satırı**: 15,000+
- **Animasyon**: 30+
- **Bileşen**: 25+

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen şu adımları izleyin:

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

---

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 👥 Ekip

- **Geliştirici**: [Your Name](https://github.com/yourusername)
- **Test Engineer**: Libero Quantum AI
- **Design**: Modern UI/UX Standards

---

## 🙏 Teşekkürler

- [React](https://react.dev/) - UI framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Vite](https://vitejs.dev/) - Build tool
- [Playwright](https://playwright.dev/) - Testing
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## 📞 İletişim

- **Email**: support@sahada.app
- **Website**: https://sahada.app
- **GitHub**: https://github.com/yourusername/sahada
- **Twitter**: [@sahada_app](https://twitter.com/sahada_app)

---

<div align="center">

**⚽ Maç Senin. Kontrol Sende. ⚽**

Made with ❤️ by Sahada Team

</div>
