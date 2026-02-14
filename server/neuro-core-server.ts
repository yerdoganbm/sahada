/**
 * SAHADA İÇİN NEURO-CORE ENTEGRASYONU
 * 
 * Bu dosya Sahada projesinde Neuro-Core'u başlatır
 */

// server/neuro-core-server.ts

import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
app.use(cors());
app.use(express.json());

// Basit in-memory storage (production'da MongoDB kullan)
const synapses: any[] = [];
const abTests: Map<string, any> = new Map();

// Initialize A/B tests
abTests.set('matchCreateButtonColor', {
  variantA: { color: 'blue', users: 0, clicks: 0 },
  variantB: { color: 'green', users: 0, clicks: 0 }
});

abTests.set('dashboardLayout', {
  variantA: { layout: 'grid', users: 0, timeSpent: 0 },
  variantB: { layout: 'list', users: 0, timeSpent: 0 }
});

// ═══════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/synapse - Kullanıcı hareketini kaydet
 */
app.post('/api/synapse', (req, res) => {
  const synapse = {
    userId: req.body.userId,
    action: req.body.action,
    screen: req.body.screen,
    duration: req.body.duration || 0,
    timestamp: new Date(),
    metadata: req.body.metadata || {}
  };

  // Calculate dopamine (happiness) score
  let dopamine = 0.5; // neutral
  
  if (synapse.action === 'match_created') dopamine = 0.9;
  if (synapse.action === 'payment_success') dopamine = 0.95;
  if (synapse.action === 'invite_sent') dopamine = 0.8;
  if (synapse.action === 'error') dopamine = 0.1;
  if (synapse.action === 'rage_quit' || synapse.duration < 5) dopamine = 0.2;
  
  synapse.dopamineScore = dopamine;
  
  synapses.push(synapse);
  
  console.log(`⚡ Synapse: ${synapse.userId} → ${synapse.action} (dopamine: ${dopamine})`);
  
  res.json({ 
    status: 'captured', 
    dopamine,
    totalSynapses: synapses.length 
  });
});

/**
 * GET /api/variant/:feature - A/B test varyantı al
 */
app.get('/api/variant/:feature', (req, res) => {
  const feature = req.params.feature;
  const userId = req.query.userId as string;
  
  const test = abTests.get(feature);
  
  if (!test) {
    return res.json({ variant: 'A', reason: 'no_test_active' });
  }
  
  // Deterministic: Aynı user her zaman aynı varyantı görsün
  const variant = parseInt(userId, 36) % 2 === 0 ? 'A' : 'B';
  
  // Track assignment
  if (variant === 'A') test.variantA.users++;
  else test.variantB.users++;
  
  res.json({ 
    variant,
    config: variant === 'A' ? test.variantA : test.variantB
  });
});

/**
 * POST /api/ab-result - A/B test sonucu kaydet
 */
app.post('/api/ab-result', (req, res) => {
  const { feature, variant, success } = req.body;
  
  const test = abTests.get(feature);
  if (!test) return res.json({ error: 'test_not_found' });
  
  if (variant === 'A') test.variantA.clicks += success ? 1 : 0;
  else test.variantB.clicks += success ? 1 : 0;
  
  res.json({ status: 'recorded' });
});

/**
 * GET /api/analytics - Real-time analytics
 */
app.get('/api/analytics', (req, res) => {
  // Top screens by dopamine
  const screenStats = synapses.reduce((acc: any, s) => {
    if (!acc[s.screen]) acc[s.screen] = { visits: 0, totalDopamine: 0 };
    acc[s.screen].visits++;
    acc[s.screen].totalDopamine += s.dopamineScore;
    return acc;
  }, {});
  
  const topScreens = Object.entries(screenStats)
    .map(([screen, stats]: [string, any]) => ({
      screen,
      visits: stats.visits,
      avgHappiness: (stats.totalDopamine / stats.visits).toFixed(2)
    }))
    .sort((a: any, b: any) => b.avgHappiness - a.avgHappiness);
  
  // A/B test results
  const abResults: any[] = [];
  abTests.forEach((test, feature) => {
    const aRate = test.variantA.users > 0 ? (test.variantA.clicks / test.variantA.users) : 0;
    const bRate = test.variantB.users > 0 ? (test.variantB.clicks / test.variantB.users) : 0;
    
    abResults.push({
      feature,
      variantA: { ...test.variantA, conversionRate: (aRate * 100).toFixed(1) + '%' },
      variantB: { ...test.variantB, conversionRate: (bRate * 100).toFixed(1) + '%' },
      winner: aRate > bRate ? 'A' : bRate > aRate ? 'B' : 'TIE'
    });
  });
  
  res.json({
    totalSynapses: synapses.length,
    topScreens: topScreens.slice(0, 5),
    abTests: abResults,
    overallHappiness: (synapses.reduce((sum, s) => sum + s.dopamineScore, 0) / synapses.length).toFixed(2)
  });
});

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'alive',
    organism: 'libero-neuro-core',
    heartbeat: 'active',
    synapses: synapses.length,
    timestamp: new Date()
  });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🧠 NEURO-CORE API READY`);
  console.log(`   Listening on: http://localhost:${PORT}`);
  console.log(`   Status: ALIVE & TRACKING\n`);
});

export default app;
