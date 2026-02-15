# Sahada Backend & Database Setup

## 🚀 Quick Start

### 1. MongoDB Kurulumu

#### Windows
```powershell
# MongoDB Community Edition indir ve kur
# https://www.mongodb.com/try/download/community

# MongoDB servisini başlat
net start MongoDB
```

#### Mac
```bash
# Homebrew ile kur
brew tap mongodb/brew
brew install mongodb-community

# MongoDB başlat
brew services start mongodb-community
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# MongoDB başlat
sudo systemctl start mongodb
```

### 2. Bağımlılıkları Kur

```bash
npm install
```

### 3. Environment Variables

`.env.local` dosyasını düzenle:

```env
MONGODB_URI=mongodb://localhost:27017/sahada
PORT=3001
```

### 4. API Server'ı Başlat

```bash
# Sadece API server
npm run api

# API server + watch mode
npm run api:dev

# Frontend + API birlikte
npm run dev:all
```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Players
```
GET    /api/players
GET    /api/players/:id
POST   /api/players
PUT    /api/players/:id
DELETE /api/players/:id
```

### Matches
```
GET    /api/matches
GET    /api/matches/:id
POST   /api/matches
PUT    /api/matches/:id
POST   /api/matches/:id/rsvp
```

### Venues
```
GET    /api/venues
GET    /api/venues/:id
POST   /api/venues
```

### Payments
```
GET    /api/payments
PUT    /api/payments/:id
```

### Transactions
```
GET    /api/transactions
POST   /api/transactions
```

### Teams
```
GET    /api/teams/:id
POST   /api/teams
```

### Polls
```
GET    /api/polls
POST   /api/polls/:id/vote
```

## 🗄️ Database Collections

- `players` - Oyuncu bilgileri
- `matches` - Maç kayıtları
- `venues` - Saha bilgileri
- `payments` - Ödeme kayıtları
- `transactions` - Mali işlemler
- `teams` - Takım profilleri
- `reservations` - Rezervasyonlar
- `polls` - Anketler
- `scoutReports` - Scout raporları
- `talentPool` - Yetenek havuzu

## 🔧 API Client Kullanımı

Frontend'de API'yi kullanmak için:

```typescript
import { api } from './api/client';

// Oyuncuları getir
const { data, error } = await api.getPlayers();

// Maç oluştur
await api.createMatch(matchData);

// RSVP güncelle
await api.updateMatchRSVP(matchId, playerId, 'yes');
```

## 🧪 Test

API'yi test etmek için:

```bash
# Health check
curl http://localhost:3001/api/health

# Oyuncuları listele
curl http://localhost:3001/api/players

# Maçları listele
curl http://localhost:3001/api/matches
```

## 📊 MongoDB GUI Tools

MongoDB'yi görselleştirmek için:

- [MongoDB Compass](https://www.mongodb.com/products/compass) (Official)
- [Studio 3T](https://studio3t.com/)
- [Robo 3T](https://robomongo.org/)

## 🔐 Production Notları

Production'da şunları unutma:

1. `.env.local` dosyasını production sunucusunda oluştur
2. MongoDB connection string'i güvenli şekilde sakla
3. Rate limiting ekle (express-rate-limit)
4. CORS ayarlarını production domain ile güncelle
5. HTTPS kullan
6. Database backup stratejisi oluştur
7. MongoDB Atlas kullanarak cloud database'e geç

## 🚨 Troubleshooting

### MongoDB bağlanamıyor
```bash
# MongoDB çalışıyor mu kontrol et
mongosh

# Veya
mongo
```

### Port zaten kullanımda
```bash
# PORT değişkenini .env.local'de değiştir
PORT=3002
```

### TypeScript hataları
```bash
# Type definitions kur
npm install -D @types/mongodb @types/express @types/cors
```
