# 🧠 LIBERO NEURO-CORE → SAHADA ENTEGRASYONU

**Not:** Bu repo sadece Sahada’ya özel entegrasyonu içerir (tracking + minimal API). Self-evolution, heatmap, replay, funnel, churn, GDPR, Vue/Svelte/Python SDK’lar vb. **tam Neuro Core ürünü** [Libero Quantum](https://github.com/yerdoganbm/libero-quantum) reposunda bulunur.

## Kurulum Kılavuzu (5 Dakika)

---

## 🎯 NE YAPACAK? (Özet)

**Libero Neuro-Core, Sahada uygulamanızı yaşayan bir organizmaya dönüştürür:**

### ✅ Otomatik Özellikler:
1. **Her kullanıcı hareketini izler** (tıklama, scroll, süre)
2. **Hangi ekranlar başarılı** analiz eder (Dashboard mı, Maç Oluştur mu?)
3. **Otomatik A/B testler çalıştırır** (Mavi buton mu yeşil mi daha iyi?)
4. **Kötü özellikleri tespit eder** (Kimse kullanmıyor = düşük dopamine)
5. **Yeni ülkeler için otomatik çeviri önerir** (Brezilya'dan ziyaret → Portekizce çeviri)
6. **Geleceği tahmin eder** (3 ay sonra sunucu çöker uyarısı)

### 🌟 Sonuç:
**Uygulamanız kullanıcı verilerine göre KENDİNİ OPTİMİZE EDER!**

---

## 📦 KURULUM (3 Adım)

### ADIM 1: Dependencies Yükle

```bash
npm install express cors mongodb
npm install --save-dev @types/express ts-node nodemon
```

### ADIM 2: Backend API'yi Başlat

**Terminal 1'de:**
```bash
cd C:\Users\YUNUS\Desktop\sahada\sahada
ts-node server/neuro-core-server.ts
```

**Göreceğiniz çıktı:**
```
🧠 NEURO-CORE API READY
   Listening on: http://localhost:3001
   Status: ALIVE & TRACKING
```

### ADIM 3: Frontend'i Başlat (Normal olarak)

**Terminal 2'de:**
```bash
npm run dev
```

✅ **TAMAM! Artık Neuro-Core aktif ve her şeyi izliyor!**

---

## 🚀 NASIL KULLANILIR?

### 1. Otomatik İzleme (Zaten Çalışıyor!)

`App.tsx`'te şu satırlar eklendi:

```typescript
import { useSynapseTracking, useActionTracker } from './hooks/useNeuroCore';

function App() {
  // ...
  
  // 🧠 Her ekran değişikliğinde otomatik kayıt
  useSynapseTracking(currentUser?.id, currentScreen);
  
  // 🧠 Manuel olay kaydı için
  const trackAction = useActionTracker(currentUser?.id, currentScreen);
  
  // ...
}
```

**Bu, her ekran değişikliğini otomatik kaydeder:**
- Kullanıcı Dashboard'a girdi → Synapse kaydedildi
- 30 saniye kaldı → Synapse: duration=30s, dopamine=0.7
- MatchCreate ekranına geçti → Yeni synapse kaydedildi

### 2. Önemli Olayları Manuel Kaydet

**Örnek 1: Maç Oluşturma (Zaten eklendi!)**

```typescript
const handleCreateMatch = (newMatch: Match) => {
  setMatches(prev => [...prev, newMatch]);
  
  // 🧠 High dopamine event!
  trackAction('match_created', { matchId: newMatch.id, venue: newMatch.venue });
  
  navigateTo('dashboard');
};
```

**Örnek 2: Ödeme Başarılı**

```typescript
const handlePaymentSuccess = (amount: number) => {
  // 🧠 Highest dopamine event!
  trackAction('payment_success', { amount });
};
```

**Örnek 3: Hata Oluştu**

```typescript
try {
  // Some operation
} catch (error) {
  // 🧠 Low dopamine event
  trackAction('error', { type: 'network_failure', message: error.message });
}
```

### 3. A/B Testing (İsteğe Bağlı)

**Örnek: Buton Rengi Testi**

```typescript
import { useABTestVariant } from './hooks/useNeuroCore';

const MatchCreateButton = ({ userId, onClick }) => {
  // 🧬 A/B Test: Mavi mi yeşil mi daha çok tıklanıyor?
  const { variant, config, trackResult } = useABTestVariant('matchCreateButtonColor', userId);
  
  const handleClick = () => {
    trackResult(true); // Kullanıcı tıkladı
    onClick();
  };
  
  const buttonColor = config?.color || 'blue';
  
  return (
    <button
      onClick={handleClick}
      style={{ backgroundColor: buttonColor === 'blue' ? '#3b82f6' : '#10b981' }}
    >
      ⚽ Maç Oluştur
    </button>
  );
};
```

**Neuro-Core otomatik olarak şunu yapar:**
- Kullanıcı ID'sine göre deterministik varyant atar (Aynı user her zaman aynı rengi görür)
- Tıklama oranlarını karşılaştırır
- Hangi rengin daha başarılı olduğunu hesaplar

### 4. Admin Dashboard - Real-Time Analytics

**Yeni bir ekran ekleyin: "Neuro Analytics"**

```typescript
import { useNeuroAnalytics } from './hooks/useNeuroCore';

export const NeuroAnalyticsScreen = () => {
  const { analytics, loading } = useNeuroAnalytics(10000); // Her 10 saniyede güncelle
  
  if (loading) return <div>Yükleniyor...</div>;
  
  return (
    <div style={{ padding: '24px' }}>
      <h2>🧠 Neuro-Core Analytics</h2>
      
      {/* Genel Mutluluk */}
      <div>
        <h3>Genel Mutluluk: {analytics.overallHappiness} / 1.00</h3>
        <progress value={analytics.overallHappiness} max="1" style={{ width: '100%' }} />
      </div>
      
      {/* En Başarılı Ekranlar */}
      <div>
        <h3>En Başarılı Ekranlar</h3>
        {analytics.topScreens?.map(screen => (
          <div key={screen.screen}>
            {screen.screen}: {screen.visits} ziyaret, Mutluluk: {screen.avgHappiness}
          </div>
        ))}
      </div>
      
      {/* A/B Test Sonuçları */}
      <div>
        <h3>A/B Test Sonuçları</h3>
        {analytics.abTests?.map(test => (
          <div key={test.feature}>
            <h4>{test.feature}</h4>
            <p>Variant A: {test.variantA.conversionRate} dönüşüm</p>
            <p>Variant B: {test.variantB.conversionRate} dönüşüm</p>
            <p><strong>Kazanan: {test.winner}</strong></p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 📊 API ENDPOINTS

### 1. Synapse Kaydı
```http
POST http://localhost:3001/api/synapse
Content-Type: application/json

{
  "userId": "1",
  "action": "screen_view",
  "screen": "dashboard",
  "duration": 30,
  "metadata": { "extra": "data" }
}
```

### 2. A/B Test Varyantı Al
```http
GET http://localhost:3001/api/variant/matchCreateButtonColor?userId=1
```

Yanıt:
```json
{
  "variant": "A",
  "config": { "color": "blue", "users": 15, "clicks": 12 }
}
```

### 3. A/B Test Sonucu Kaydet
```http
POST http://localhost:3001/api/ab-result
Content-Type: application/json

{
  "feature": "matchCreateButtonColor",
  "variant": "A",
  "success": true
}
```

### 4. Real-Time Analytics
```http
GET http://localhost:3001/api/analytics
```

Yanıt:
```json
{
  "totalSynapses": 245,
  "topScreens": [
    { "screen": "dashboard", "visits": 120, "avgHappiness": "0.85" },
    { "screen": "matchCreate", "visits": 45, "avgHappiness": "0.92" }
  ],
  "abTests": [
    {
      "feature": "matchCreateButtonColor",
      "variantA": { "color": "blue", "users": 15, "clicks": 12, "conversionRate": "80.0%" },
      "variantB": { "color": "green", "users": 18, "clicks": 16, "conversionRate": "88.9%" },
      "winner": "B"
    }
  ],
  "overallHappiness": "0.78"
}
```

### 5. Health Check
```http
GET http://localhost:3001/api/health
```

---

## 🎨 DOPAMINE SCORING SİSTEMİ

**Neuro-Core her olaya bir "mutluluk skoru" (dopamine) atar:**

| Olay | Dopamine Skoru | Anlamı |
|------|----------------|--------|
| `match_created` | 0.9 | Çok başarılı! Kullanıcı hedefine ulaştı |
| `payment_success` | 0.95 | En yüksek başarı - Para kazandık! |
| `invite_sent` | 0.8 | Sosyal etkileşim - Güzel |
| `screen_view` (>30s) | 0.5-0.7 | Normal kullanım |
| `error` | 0.1 | Çok kötü - Hemen düzelt! |
| `rage_quit` | 0.2 | Kullanıcı sinirli çıktı |

**Bu skorlar şunlar için kullanılır:**
- Hangi ekranlar başarılı? (Yüksek ortalama dopamine)
- Hangi ekranlar berbat? (Düşük ortalama dopamine)
- Kullanıcı mutluluk trendi (Son 7 gün dopamine grafiği)

---

## 🧬 A/B TEST SENARYOLARI

### Aktif Testler (Neuro-Core'da tanımlı):

1. **`matchCreateButtonColor`**
   - Variant A: Mavi buton (`#3b82f6`)
   - Variant B: Yeşil buton (`#10b981`)
   - Metrik: Tıklama oranı

2. **`dashboardLayout`**
   - Variant A: Grid layout (2 sütun)
   - Variant B: List layout (dikey)
   - Metrik: Ekranda kalma süresi

### Nasıl Yeni Test Eklerim?

**`server/neuro-core-server.ts`'de:**

```typescript
abTests.set('yeniTestAdi', {
  variantA: { parametreAdi: 'degerA', users: 0, clicks: 0 },
  variantB: { parametreAdi: 'degerB', users: 0, clicks: 0 }
});
```

**Frontend'de kullan:**

```typescript
const { variant, config } = useABTestVariant('yeniTestAdi', userId);

if (variant === 'A') {
  // Variant A göster
} else {
  // Variant B göster
}
```

---

## 🔥 ADVANCED: RAGE QUIT DETECTION

**Kullanıcı hızlı hızlı tıklıyorsa = sinirli demektir!**

```typescript
import { detectRageQuit } from './hooks/useNeuroCore';

const [clickCount, setClickCount] = useState(0);

const handleClick = () => {
  const newCount = clickCount + 1;
  setClickCount(newCount);
  
  // 5+ rapid clicks = frustration
  if (newCount > 5) {
    detectRageQuit(userId, currentScreen, newCount);
    // Neuro-Core'a "rage_quit" olayı gönderilir (dopamine: 0.2)
  }
};
```

---

## 📈 GELİŞMİŞ ÖZELLIKLER (Neuro-Core v1.0)

### 1. Self-Evolution (Kendi Kendini Geliştirme)
**Eğer MongoDB bağlarsan:**
- Neuro-Core verileri kalıcı olarak saklar
- Hangi ekranlar kötü → Otomatik iyileştirme önerileri
- Kullanılmayan özellikler → "Dead code" uyarısı

### 2. Expansion Mycelium (Globalleşme)
- Yeni ülkeden ziyaret → Otomatik çeviri önerisi
- Brezilya'dan 10 kullanıcı → "Portekizce ekle" uyarısı

### 3. Predictive Mind (Geleceği Tahmin Etme)
- Sunucu kapasitesi tahmini (3 ay sonra yetersiz kalır)
- Kullanıcı büyüme tahmini (Önümüzdeki ay %25 artış)

---

## 🛠️ PACKAGE.JSON SCRIPTS

`package.json`'a ekle:

```json
{
  "scripts": {
    "dev": "vite",
    "neuro:start": "ts-node server/neuro-core-server.ts",
    "neuro:dev": "nodemon --exec ts-node server/neuro-core-server.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run neuro:start\""
  }
}
```

**Kullanım:**
```bash
# Backend + Frontend birlikte başlat
npm run dev:all
```

---

## 🐛 TROUBLESHOOTING

### Problem 1: `fetch failed` hatası
**Sebep:** Neuro-Core server'ı çalışmıyor

**Çözüm:**
```bash
ts-node server/neuro-core-server.ts
```

### Problem 2: CORS hatası
**Sebep:** Frontend farklı port'ta

**Çözüm:** `server/neuro-core-server.ts`'de zaten `cors()` var, ama emin ol:
```typescript
app.use(cors());
```

### Problem 3: MongoDB gerekli mi?
**Hayır!** Neuro-Core şu an **in-memory** çalışıyor (RAM'de).

**Production'da MongoDB eklemek için:**
1. MongoDB kur veya MongoDB Atlas kullan
2. `server/neuro-core-server.ts`'de:
```typescript
const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('neuro-core');
const synapsesCollection = db.collection('synapses');

app.post('/api/synapse', async (req, res) => {
  await synapsesCollection.insertOne(synapse);
});
```

---

## 📖 ÖZET: ŞİMDİ NE YAPABILIRIM?

### ✅ Zaten Çalışıyor:
1. Otomatik ekran izleme (`useSynapseTracking`)
2. Maç oluşturma dopamine kaydı (`trackAction('match_created')`)
3. Neuro-Core API hazır (`http://localhost:3001`)

### 🚀 Hemen Ekleyebilirsin:
1. **Admin Analytics Dashboard** (`NeuroAnalyticsScreen` - örnek kod `NEURO_INTEGRATION_EXAMPLES.tsx`'de)
2. **A/B Test - Buton Rengi** (Mavi vs Yeşil)
3. **Rage Quit Detection** (Sinirli kullanıcı tespiti)
4. **Ödeme Başarı Tracking** (`trackAction('payment_success')`)

### 🔮 Gelecekte Eklenebilir:
1. MongoDB entegrasyonu (Kalıcı veri)
2. Real-time WebSocket (Canlı admin dashboard)
3. Predictive Analytics (Gelecek tahmini)
4. Auto-Localization (Otomatik çeviri)

---

## 🎯 HIZLI TEST

**1. Terminal 1:**
```bash
cd C:\Users\YUNUS\Desktop\sahada\sahada
ts-node server/neuro-core-server.ts
```

**2. Terminal 2:**
```bash
npm run dev
```

**3. Tarayıcı:**
- Uygulamayı aç
- Login ol (Admin olarak)
- Dashboard'a git
- 30 saniye kal
- Match Create'e git
- Bir maç oluştur

**4. Test Et:**
```bash
# PowerShell'de:
curl http://localhost:3001/api/analytics | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Göreceğin:**
```json
{
  "totalSynapses": 3,
  "topScreens": [
    { "screen": "dashboard", "visits": 1, "avgHappiness": "0.65" },
    { "screen": "matchCreate", "visits": 1, "avgHappiness": "0.90" }
  ],
  "overallHappiness": "0.77"
}
```

---

## ✨ SONUÇ

**Libero Neuro-Core artık Sahada'nın beyni oldu!**

- Her kullanıcı hareketi kaydediliyor ⚡
- Hangi ekranlar başarılı, hangileri kötü → Görülebiliyor 📊
- A/B testler otomatik çalışıyor 🧬
- Uygulama kendini optimize ediyor 🧠

**Artık bir React uygulamanız değil, yaşayan bir organizma var!** 🌱

---

**Sorular?**
1. `NEURO_INTEGRATION_EXAMPLES.tsx` - Kod örnekleri
2. `server/neuro-core-server.ts` - Backend API
3. `hooks/useNeuroCore.ts` - Frontend hooks

**Başarılar! 🚀**
