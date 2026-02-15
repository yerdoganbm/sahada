-- Seed 001: Örnek takım, kullanıcılar, saha ve maç (tüm migration'lar çalıştıktan sonra)
-- Kullanım: psql -U postgres -d sahada -f database/seeds/001_initial_data.sql
-- Veya: cd database && for f in migrations/*.sql; do psql -U postgres -d sahada -f "$f"; done && psql -U postgres -d sahada -f seeds/001_initial_data.sql

BEGIN;

-- Sabit UUID'ler (tekrar çalıştırmada hata vermemek için ON CONFLICT / EXISTS kullanıyoruz)
-- Takım
INSERT INTO teams (id, name, short_name, invite_code, primary_color, secondary_color, is_active)
VALUES (
  'a0000001-0000-4000-8000-000000000001',
  'Sahada Demo Takım',
  'SDT',
  'DEMO2026',
  '#10B981',
  '#0B0F1A',
  true
)
ON CONFLICT (id) DO NOTHING;
-- invite_code unique olduğu için id ile conflict olmaz; id ile eşleşmezse insert eder. ON CONFLICT (id) kullandık.

-- Kullanıcılar (takıma bağlı)
INSERT INTO users (id, team_id, name, email, phone, role, is_captain, position, shirt_number, rating, reliability)
VALUES
  (
    'b0000001-0000-4000-8000-000000000001',
    'a0000001-0000-4000-8000-000000000001',
    'Demo Admin',
    'admin@demo.sahada.app',
    '+905551110001',
    'admin',
    true,
    'MID',
    10,
    7.5,
    100
  ),
  (
    'b0000001-0000-4000-8000-000000000002',
    'a0000001-0000-4000-8000-000000000001',
    'Demo Üye 1',
    'uye1@demo.sahada.app',
    '+905551110002',
    'member',
    false,
    'DEF',
    4,
    7.0,
    95
  ),
  (
    'b0000001-0000-4000-8000-000000000003',
    'a0000001-0000-4000-8000-000000000001',
    'Demo Üye 2',
    'uye2@demo.sahada.app',
    '+905551110003',
    'member',
    false,
    'FWD',
    9,
    7.2,
    90
  )
ON CONFLICT (id) DO NOTHING;

-- Saha (owner isteğe bağlı; NULL bırakıyoruz)
INSERT INTO venues (id, name, district, address, phone, price_per_hour, capacity, status, rating, review_count)
VALUES (
  'c0000001-0000-4000-8000-000000000001',
  'Demo Halı Saha',
  'Kadıköy',
  'Demo Mah. Saha Sok. No:1',
  '+902161234567',
  800.00,
  '14 kişilik',
  'active',
  4.5,
  12
)
ON CONFLICT (id) DO NOTHING;

-- Maç (yaklaşan)
INSERT INTO matches (id, team_id, venue_id, match_date, match_time, location, opponent, status, price_per_person, capacity, created_by)
VALUES (
  'd0000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000001',
  CURRENT_DATE + INTERVAL '7 days',
  '20:00',
  'Demo Halı Saha',
  'Rakip Takım',
  'upcoming',
  50.00,
  14,
  'b0000001-0000-4000-8000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Maç katılımları (RSVP)
INSERT INTO match_attendees (match_id, player_id, status, is_waitlist)
VALUES
  ('d0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'YES', false),
  ('d0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000002', 'YES', false),
  ('d0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000003', 'MAYBE', false)
ON CONFLICT (match_id, player_id) DO NOTHING;

COMMIT;

-- Not: Uygulama tarafında X-User-Id header'ı ile test için bir user id kullanın, örn:
-- b0000001-0000-4000-8000-000000000001 (Demo Admin)
