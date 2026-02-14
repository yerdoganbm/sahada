/**
 * SAHADA - NEURO-CORE INTEGRATION HOOKS
 * 
 * Bu custom hook'lar kullanıcı davranışını otomatik izler
 */

import { useEffect, useState, useCallback } from 'react';

const NEURO_API = 'http://localhost:3001/api';

// ═══════════════════════════════════════════════════════════════════════
// HOOK 1: Synapse Tracking (Otomatik İzleme)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Her ekran değişikliğinde kullanıcı davranışını kaydeder
 */
export const useSynapseTracking = (
  userId: string | undefined,
  currentScreen: string
) => {
  useEffect(() => {
    if (!userId) return;

    const startTime = Date.now();

    // Ekran yüklendiğinde
    console.log(`⚡ Synapse: User ${userId} entered ${currentScreen}`);

    return () => {
      // Ekrandan çıkarken - süreyi hesapla
      const duration = (Date.now() - startTime) / 1000; // seconds

      fetch(`${NEURO_API}/synapse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'screen_view',
          screen: currentScreen,
          duration
        })
      }).catch(err => console.log('Synapse failed:', err));

      console.log(`⚡ Synapse: User ${userId} left ${currentScreen} (${duration}s)`);
    };
  }, [userId, currentScreen]);
};

// ═══════════════════════════════════════════════════════════════════════
// HOOK 2: Action Tracking (Manuel Olaylar)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Önemli olayları manuel olarak kaydet (ödeme, maç oluşturma, vb.)
 */
export const useActionTracker = (userId: string | undefined, currentScreen: string) => {
  const trackAction = useCallback((action: string, metadata?: any) => {
    if (!userId) return;

    fetch(`${NEURO_API}/synapse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action,
        screen: currentScreen,
        duration: 0,
        metadata: metadata || {}
      })
    }).catch(err => console.log('Action tracking failed:', err));

    console.log(`⚡ Action: ${userId} → ${action}`);
  }, [userId, currentScreen]);

  return trackAction;
};

// ═══════════════════════════════════════════════════════════════════════
// HOOK 3: A/B Test Variant (Otomatik Varyant)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Kullanıcıya A/B test varyantı atar
 */
export const useABTestVariant = (feature: string, userId: string | undefined) => {
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`${NEURO_API}/variant/${feature}?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setVariant(data.variant);
        setConfig(data.config);
        setLoading(false);
        console.log(`🧬 A/B Test: ${feature} → Variant ${data.variant}`);
      })
      .catch(err => {
        console.log('A/B test fetch failed:', err);
        setLoading(false);
      });
  }, [feature, userId]);

  // Track result (success/failure)
  const trackResult = useCallback((success: boolean) => {
    fetch(`${NEURO_API}/ab-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature, variant, success })
    });
  }, [feature, variant]);

  return { variant, config, loading, trackResult };
};

// ═══════════════════════════════════════════════════════════════════════
// HOOK 4: Real-Time Analytics (Canlı Veriler)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Real-time analytics verilerini çeker (admin dashboard için)
 */
export const useNeuroAnalytics = (refreshInterval: number = 10000) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = () => {
      fetch(`${NEURO_API}/analytics`)
        .then(res => res.json())
        .then(data => {
          setAnalytics(data);
          setLoading(false);
        })
        .catch(err => console.log('Analytics fetch failed:', err));
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { analytics, loading };
};

// ═══════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Dopamine (mutluluk) olaylarını kaydet
 */
export const trackDopamine = (
  userId: string,
  action: 'match_created' | 'payment_success' | 'invite_sent' | 'error' | 'rage_quit',
  screen: string
) => {
  fetch(`${NEURO_API}/synapse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      action,
      screen,
      duration: 0
    })
  });
};

/**
 * Rage quit detection (kullanıcı sinirli çıkıyor)
 */
export const detectRageQuit = (userId: string, screen: string, clickCount: number) => {
  if (clickCount > 5) { // 5+ rapid clicks = frustration
    trackDopamine(userId, 'rage_quit', screen);
    console.log('⚠️ Rage quit detected!');
  }
};
