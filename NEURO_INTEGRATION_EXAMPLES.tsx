/**
 * SAHADA - NEURO-CORE INTEGRATION ÖRNEKLERI
 * 
 * Bu dosya Neuro-Core'un Sahada uygulamasına nasıl entegre edileceğini gösterir
 */

// ═══════════════════════════════════════════════════════════════════════
// ÖRNEK 1: A/B Test ile Buton Rengi Değiştirme
// ═══════════════════════════════════════════════════════════════════════

import { useABTestVariant } from './hooks/useNeuroCore';

export const MatchCreateButton = ({ userId, onClick }) => {
  // 🧬 A/B Test: Mavi mi yeşil mi daha çok tıklanıyor?
  const { variant, config, trackResult } = useABTestVariant('matchCreateButtonColor', userId);
  
  const handleClick = () => {
    trackResult(true); // Success: Kullanıcı butona tıkladı
    onClick();
  };
  
  const buttonColor = config?.color || 'blue';
  
  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: buttonColor === 'blue' ? '#3b82f6' : '#10b981',
        padding: '12px 24px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '16px'
      }}
    >
      ⚽ Maç Oluştur
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ÖRNEK 2: Dashboard Layout A/B Test
// ═══════════════════════════════════════════════════════════════════════

export const DashboardWithABTest = ({ userId }) => {
  const { variant, config } = useABTestVariant('dashboardLayout', userId);
  
  const layout = config?.layout || 'grid';
  
  return (
    <div>
      <h2>Dashboard</h2>
      {layout === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Grid layout */}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* List layout */}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ÖRNEK 3: Manuel Olay Kaydı (Error, Success, vb.)
// ═══════════════════════════════════════════════════════════════════════

import { useActionTracker } from './hooks/useNeuroCore';

export const PaymentScreen = ({ userId, currentScreen }) => {
  const trackAction = useActionTracker(userId, currentScreen);
  
  const handlePayment = async () => {
    try {
      const result = await processPayment();
      
      // ✅ SUCCESS: High dopamine event!
      trackAction('payment_success', { amount: result.amount });
      
      alert('Ödeme başarılı!');
    } catch (error) {
      // ❌ ERROR: Low dopamine event
      trackAction('error', { type: 'payment_failed', message: error.message });
      
      alert('Ödeme başarısız!');
    }
  };
  
  return (
    <button onClick={handlePayment}>
      Ödeme Yap
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ÖRNEK 4: Rage Quit Detection (Sinirli Kullanıcı Tespiti)
// ═══════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { detectRageQuit } from './hooks/useNeuroCore';

export const FrustratingForm = ({ userId, currentScreen }) => {
  const [clickCount, setClickCount] = useState(0);
  
  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    // Rapid clicks = frustration
    if (newCount > 5) {
      detectRageQuit(userId, currentScreen, newCount);
    }
  };
  
  return (
    <div onClick={handleClick}>
      {/* Your frustrating UI here */}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ÖRNEK 5: Admin Dashboard - Real-Time Analytics
// ═══════════════════════════════════════════════════════════════════════

import { useNeuroAnalytics } from './hooks/useNeuroCore';

export const NeuroAnalyticsDashboard = () => {
  const { analytics, loading } = useNeuroAnalytics(10000); // Refresh every 10s
  
  if (loading) return <div>Yükleniyor...</div>;
  
  return (
    <div style={{ padding: '24px' }}>
      <h2>🧠 Neuro-Core Analytics</h2>
      
      {/* Overall Happiness */}
      <div style={{ marginBottom: '24px' }}>
        <h3>Genel Mutluluk Skoru: {analytics.overallHappiness} / 1.00</h3>
        <progress value={analytics.overallHappiness} max="1" style={{ width: '100%' }} />
      </div>
      
      {/* Top Screens */}
      <div style={{ marginBottom: '24px' }}>
        <h3>En Başarılı Ekranlar</h3>
        {analytics.topScreens?.map((screen: any) => (
          <div key={screen.screen} style={{ marginBottom: '8px' }}>
            <strong>{screen.screen}</strong>: {screen.visits} ziyaret, 
            Mutluluk: {screen.avgHappiness}
          </div>
        ))}
      </div>
      
      {/* A/B Test Results */}
      <div>
        <h3>A/B Test Sonuçları</h3>
        {analytics.abTests?.map((test: any) => (
          <div key={test.feature} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #ccc' }}>
            <h4>{test.feature}</h4>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <strong>Variant A:</strong><br />
                Kullanıcı: {test.variantA.users}<br />
                Tıklama: {test.variantA.clicks}<br />
                Dönüşüm: {test.variantA.conversionRate}
              </div>
              <div>
                <strong>Variant B:</strong><br />
                Kullanıcı: {test.variantB.users}<br />
                Tıklama: {test.variantB.clicks}<br />
                Dönüşüm: {test.variantB.conversionRate}
              </div>
            </div>
            <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
              Kazanan: {test.winner}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '24px', fontSize: '12px', color: '#666' }}>
        Toplam Synapse: {analytics.totalSynapses} | 
        Güncelleme: Her 10 saniyede bir
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// KULLANIM KILAVUZU
// ═══════════════════════════════════════════════════════════════════════

/**
 * APP.TSX İÇİNDE NASIL KULLANILIR?
 * 
 * 1. Otomatik Tracking:
 *    - useSynapseTracking() hook'u her ekran değişikliğini otomatik izler
 *    - Eklediğiniz her yeni ekran otomatik olarak kaydedilir
 * 
 * 2. Manuel Action Tracking:
 *    const trackAction = useActionTracker(currentUser?.id, currentScreen);
 *    
 *    // Önemli olayları kaydet:
 *    trackAction('match_created', { matchId: '123' });
 *    trackAction('payment_success', { amount: 50 });
 *    trackAction('invite_sent', { receiverId: '456' });
 *    trackAction('error', { type: 'network_failure' });
 * 
 * 3. A/B Testing:
 *    const { variant, config, trackResult } = useABTestVariant('feature_name', userId);
 *    
 *    if (variant === 'A') {
 *      // Show variant A
 *    } else {
 *      // Show variant B
 *    }
 *    
 *    trackResult(true); // User clicked/interacted successfully
 * 
 * 4. Analytics Dashboard:
 *    const { analytics } = useNeuroAnalytics(10000);
 *    
 *    // analytics.topScreens, analytics.abTests, analytics.overallHappiness
 * 
 * 5. Server Başlatma:
 *    Terminal'de:
 *    cd server
 *    ts-node neuro-core-server.ts
 * 
 *    Veya package.json'a ekle:
 *    "scripts": {
 *      "neuro:start": "ts-node server/neuro-core-server.ts"
 *    }
 */
