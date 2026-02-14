# 🧠 LIBERO NEURO-CORE ARŞİTEKTÜRÜ

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      SAHADA REACT APP                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  App.tsx (Main Component)                                 │   │
│  │                                                            │   │
│  │  🧠 useSynapseTracking(userId, currentScreen)            │   │
│  │     ↓ Otomatik her ekran değişikliğinde                  │   │
│  │     ↓ Duration tracking (Ekranda kalma süresi)           │   │
│  │                                                            │   │
│  │  🧠 trackAction = useActionTracker(userId, screen)       │   │
│  │     ↓ Manuel önemli olaylar                               │   │
│  │     ↓ match_created, payment_success, error, vb.         │   │
│  │                                                            │   │
│  │  🧬 useABTestVariant(feature, userId)                    │   │
│  │     ↓ A/B Test varyantı al                                │   │
│  │     ↓ Tıklama sonuçlarını kaydet                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              │ HTTP Fetch                         │
│                              ↓                                    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │
┌─────────────────────────────────────────────────────────────────┐
│           NEURO-CORE API SERVER (Node.js/Express)               │
│                  http://localhost:3001                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  POST /api/synapse                                        │   │
│  │  ↓ Kullanıcı hareketi kaydet                             │   │
│  │  ↓ Dopamine score hesapla (0.1 - 0.95)                   │   │
│  │  ↓ In-memory array'e ekle                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  GET /api/variant/:feature?userId=X                      │   │
│  │  ↓ A/B Test varyantı döndür (A veya B)                   │   │
│  │  ↓ Deterministik: Aynı user → Aynı variant               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  POST /api/ab-result                                      │   │
│  │  ↓ Kullanıcı tıkladı mı? (success: true/false)           │   │
│  │  ↓ Conversion rate güncelle                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  GET /api/analytics                                       │   │
│  │  ↓ Real-time analytics döndür                            │   │
│  │  ↓ Top screens by happiness                              │   │
│  │  ↓ A/B test results                                       │   │
│  │  ↓ Overall happiness score                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  DATA STORAGE (In-Memory)                                │   │
│  │                                                            │   │
│  │  synapses: Array<{                                        │   │
│  │    userId, action, screen, duration,                      │   │
│  │    dopamineScore, timestamp, metadata                     │   │
│  │  }>                                                        │   │
│  │                                                            │   │
│  │  abTests: Map<string, {                                   │   │
│  │    variantA: { config, users, clicks },                   │   │
│  │    variantB: { config, users, clicks }                    │   │
│  │  }>                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ (Optional: Future)
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                        MONGODB (Optional)                        │
│                                                                   │
│  Collections:                                                     │
│  - synapses (Kalıcı kullanıcı hareketleri)                      │
│  - ab_tests (A/B test sonuçları)                                │
│  - predictions (Gelecek tahminleri)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Ekran Değişikliği

```
1. Kullanıcı Dashboard'a girer
   ↓
2. useSynapseTracking() başlar
   ↓
3. Ekrandan çıktığında (unmount):
   ↓
4. Duration hesapla (Date.now() - startTime)
   ↓
5. POST /api/synapse {
      userId: "1",
      action: "screen_view",
      screen: "dashboard",
      duration: 30
   }
   ↓
6. Neuro-Core dopamine hesaplar:
   - duration > 30s → dopamine = 0.65
   - duration < 5s → dopamine = 0.2 (rage quit)
   ↓
7. Synapse kaydedilir
   ↓
8. Console: ⚡ Synapse: User 1 → screen_view (dopamine: 0.65)
```

---

## Data Flow: Maç Oluşturma

```
1. Kullanıcı "Maç Oluştur" butonuna tıklar
   ↓
2. handleCreateMatch() çağrılır
   ↓
3. setMatches(prev => [...prev, newMatch])
   ↓
4. trackAction('match_created', { matchId: newMatch.id })
   ↓
5. POST /api/synapse {
      userId: "1",
      action: "match_created",
      screen: "matchCreate",
      metadata: { matchId: "xyz" }
   }
   ↓
6. Neuro-Core dopamine hesaplar:
   - action = 'match_created' → dopamine = 0.9 (YÜKSEK!)
   ↓
7. Synapse kaydedilir
   ↓
8. Dashboard'a yönlenir
```

---

## Data Flow: A/B Test (Buton Rengi)

```
1. MatchCreateButton render olur
   ↓
2. useABTestVariant('matchCreateButtonColor', userId)
   ↓
3. GET /api/variant/matchCreateButtonColor?userId=1
   ↓
4. Neuro-Core hesaplar:
   - parseInt(userId, 36) % 2 === 0 → Variant A (Mavi)
   - parseInt(userId, 36) % 2 === 1 → Variant B (Yeşil)
   ↓
5. Variant A döndürülür
   ↓
6. variantA.users++ (Kullanıcı sayısı artar)
   ↓
7. Buton mavi renkte render olur
   ↓
8. Kullanıcı butona tıklar:
   ↓
9. trackResult(true)
   ↓
10. POST /api/ab-result {
       feature: 'matchCreateButtonColor',
       variant: 'A',
       success: true
   }
   ↓
11. variantA.clicks++ (Tıklama sayısı artar)
   ↓
12. Analytics:
    - Variant A: 15 kullanıcı, 12 tıklama → %80 conversion
    - Variant B: 18 kullanıcı, 16 tıklama → %88.9 conversion
    - Kazanan: Variant B (Yeşil buton)
```

---

## Data Flow: Admin Analytics Dashboard

```
1. Admin "Neuro Analytics" ekranına girer
   ↓
2. useNeuroAnalytics(10000) başlar
   ↓
3. Her 10 saniyede bir:
   GET /api/analytics
   ↓
4. Neuro-Core hesaplar:
   - Top screens by dopamine
   - A/B test results (conversion rates)
   - Overall happiness (ortalama dopamine)
   ↓
5. Analytics state güncellenir
   ↓
6. UI re-render olur:
   - Genel Mutluluk: 0.78 / 1.00
   - En Başarılı Ekranlar:
     1. matchCreate: 0.92 happiness
     2. dashboard: 0.85 happiness
     3. payment: 0.88 happiness
   - A/B Test Sonuçları:
     matchCreateButtonColor: Kazanan B (Yeşil)
```

---

## Dopamine Scoring System

```
ACTION                 DOPAMINE    ANILAMI
─────────────────────  ──────────  ───────────────────────────
payment_success        0.95        🔥 En yüksek başarı!
match_created          0.90        ⚡ Çok başarılı kullanım
invite_sent            0.80        👥 Sosyal etkileşim
screen_view (>30s)     0.65        ✅ Normal kullanım
screen_view (10-30s)   0.50        😐 Orta kullanım
screen_view (<5s)      0.20        😤 Rage quit (sinirli)
error                  0.10        ❌ Çok kötü - acil düzelt!
```

---

## A/B Test Strategy

```
TEST: matchCreateButtonColor
├─ Variant A: Mavi (#3b82f6)
│  ├─ Users: 15
│  ├─ Clicks: 12
│  └─ Conversion: 80.0%
│
└─ Variant B: Yeşil (#10b981)
   ├─ Users: 18
   ├─ Clicks: 16
   └─ Conversion: 88.9%

WINNER: B (Yeşil) → %8.9 daha iyi!
ACTION: Tüm kullanıcılar için yeşil yap
```

---

## Future Architecture (MongoDB + Real-Time)

```
┌─────────────────────────────────────────────────────────────────┐
│                      SAHADA REACT APP                            │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ WebSocket (Real-Time)
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│           NEURO-CORE API (Node.js + Socket.io)                  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  LOBE 1: SENSORY CORTEX (Duyusal Korteks)               │   │
│  │  ↓ Real-time synapse streaming                           │   │
│  │  ↓ Global pattern recognition                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  LOBE 2: EVOLUTION ENGINE (Evrim Motoru)                │   │
│  │  ↓ Micro-mutations (kod değişiklikleri)                  │   │
│  │  ↓ Natural selection (başarısız kodu sil)                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  LOBE 3: EXPANSION MYCELIUM (Genişleme Ağı)             │   │
│  │  ↓ Auto-localization (Yeni ülke tespit)                 │   │
│  │  ↓ Cultural adaptation                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  LOBE 4: PREDICTIVE MIND (Öngörücü Zihin)               │   │
│  │  ↓ Shadow simulation (Sanal bot testleri)                │   │
│  │  ↓ Future predictions (Sunucu kapasitesi tahmini)        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ MongoDB
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                        MONGODB DATABASE                          │
│                                                                   │
│  synapses: { userId, action, screen, dopamine, timestamp }      │
│  abTests: { feature, variants, results }                         │
│  predictions: { type, forecast, confidence, timestamp }          │
│  mutations: { componentName, oldCode, newCode, success }         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Checklist

### ✅ TAMAMLANDI:
- [x] Neuro-Core server dosyası (`server/neuro-core-server.ts`)
- [x] Custom hooks (`hooks/useNeuroCore.ts`)
- [x] App.tsx entegrasyonu (otomatik tracking)
- [x] Manuel action tracking (match_created)
- [x] A/B test infrastructure
- [x] Analytics API endpoint
- [x] Dopamine scoring system
- [x] package.json scripts

### 🚀 HEMEN EKLENEBİLİR:
- [ ] Admin Analytics Dashboard (screen)
- [ ] A/B test buton rengi (component)
- [ ] Rage quit detection
- [ ] Ödeme success tracking
- [ ] Hata tracking (error)

### 🔮 GELECEK (v2.0):
- [ ] MongoDB entegrasyonu
- [ ] WebSocket real-time streaming
- [ ] 4 Lobe architecture (Neuro-Core v1.0)
- [ ] Self-modifying code (Evolution Engine)
- [ ] Predictive analytics (Predictive Mind)
- [ ] Auto-localization (Expansion Mycelium)

---

## Komutlar

```bash
# Backend başlat
npm run neuro:start

# Backend + hot reload
npm run neuro:dev

# Frontend başlat
npm run dev

# Analytics test et
curl http://localhost:3001/api/analytics | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Health check
curl http://localhost:3001/api/health
```

---

**Artık Sahada bir React uygulaması değil, yaşayan bir organizma! 🌱**
