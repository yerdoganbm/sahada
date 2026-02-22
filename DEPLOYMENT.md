# Sahada API – Deploy Özeti

## Ortam değişkenleri (production)

- **DB_TYPE** – `mongo` (varsayılan) veya `postgres`
- **MONGODB_URI** – MongoDB bağlantı (DB_TYPE=mongo), örn. `mongodb+srv://user:pass@cluster.mongodb.net/sahada`
- **DATABASE_URL** – PostgreSQL bağlantı (DB_TYPE=postgres), örn. `postgresql://user:pass@host:5432/sahada`
- **JWT_SECRET** – Güçlü, rastgele secret (production’da mutlaka değiştir)
- **PORT** – Sunucu portu (varsayılan 3001)
- **CORS_ORIGIN** – İzin verilen origin’ler (virgülle ayrılmış) veya `*`
- **RATE_LIMIT_MAX** – Dakikada max istek (varsayılan 100)

## Veritabanı

- **MongoDB:** Atlas veya kendi sunucunuz; `MONGODB_URI` ve `DB_NAME` ayarlayın.
- **PostgreSQL:** `database/README.md` içindeki sırayla migration ve seed’leri çalıştırın; `DATABASE_URL` ve `DB_TYPE=postgres` kullanın.  
  Not: Şu an API CRUD işlemleri hâlâ MongoDB üzerinden; sadece bağlantı ve health check Postgres’e göre yapılır. Tam Postgres kullanımı için endpoint’lerin Postgres’e taşınması gerekir.

## Auth

- **POST /api/auth/login** – Body: `{ "phone": "..." }` veya `{ "email": "..." }`. Cevap: `{ token, user }`.
- İsteklerde **Authorization: Bearer &lt;token&gt;** veya **X-User-Id: &lt;userId&gt;** gönderin.

## Push bildirimleri

- **POST /api/push-tokens** – Body: `{ "token": "FCM/APNs token", "platform": "ios"|"android" }`. Giriş gerekli (Bearer veya X-User-Id).

## Çalıştırma

```bash
npm install
npm run api
# veya production: NODE_ENV=production npm run api
```

## Hosting örnekleri

- **Railway / Render / Fly.io:** Projeyi bağlayıp `npm run api` (veya `node dist/api-server.js`) ile başlatın; env’leri panelden verin.
- **Docker:** `Dockerfile` ile `node` image’ı, `PORT` expose edin, `CMD ["node", "dist/api-server.js"]` (önce `npm run build` ile TS derlenmeli veya `ts-node server/api-server.ts` kullanın).

Detaylı kurulum için `BACKEND_SETUP.md` ve `database/README.md` dosyalarına bakın.
