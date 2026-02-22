-- =============================================
-- Sahada – PostgreSQL Schema (Firestore ile uyumlu)
-- Çalıştırma: psql -U postgres -d sahada -f scripts/schema.sql
-- =============================================

-- Mevcut tabloları temizle (dikkat: DROP CASCADE)
DROP TABLE IF EXISTS match_attendees CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS bracket_matches CASCADE;
DROP TABLE IF EXISTS tournament_teams CASCADE;
DROP TABLE IF EXISTS scout_reports CASCADE;
DROP TABLE IF EXISTS talent_pool CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS join_requests CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- 1. teams
CREATE TABLE teams (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(32),
  invite_code VARCHAR(64) NOT NULL UNIQUE,
  primary_color VARCHAR(20),
  secondary_color VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. users
CREATE TABLE users (
  id VARCHAR(128) PRIMARY KEY,
  team_id VARCHAR(128) REFERENCES teams(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(32) NOT NULL CHECK (role IN ('admin', 'member', 'guest', 'venue_owner')),
  position VARCHAR(8) NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  rating DECIMAL(3,1) DEFAULT 7,
  reliability INT DEFAULT 100,
  avatar TEXT,
  is_captain BOOLEAN DEFAULT FALSE,
  tier VARCHAR(32) CHECK (tier IN ('free', 'premium', 'partner')),
  shirt_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);

-- 3. venues
CREATE TABLE venues (
  id VARCHAR(128) PRIMARY KEY,
  owner_id VARCHAR(128),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address TEXT,
  price_per_hour INT NOT NULL,
  rating DECIMAL(2,1),
  primary_image_url TEXT,
  features TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. matches
CREATE TABLE matches (
  id VARCHAR(128) PRIMARY KEY,
  team_id VARCHAR(128) REFERENCES teams(id),
  venue_id VARCHAR(128) REFERENCES venues(id),
  match_date DATE NOT NULL,
  match_time VARCHAR(16) NOT NULL,
  location VARCHAR(255),
  venue_name VARCHAR(255),
  status VARCHAR(32) NOT NULL CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  price_per_person INT,
  capacity INT,
  score VARCHAR(16),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_team_id ON matches(team_id);
CREATE INDEX idx_matches_venue_id ON matches(venue_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);

-- 5. match_attendees (matches.attendees array → tablo)
CREATE TABLE match_attendees (
  id SERIAL PRIMARY KEY,
  match_id VARCHAR(128) NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id VARCHAR(128) NOT NULL REFERENCES users(id),
  status VARCHAR(8) NOT NULL CHECK (status IN ('YES', 'NO', 'MAYBE')),
  UNIQUE(match_id, player_id)
);

CREATE INDEX idx_match_attendees_match ON match_attendees(match_id);

-- 6. join_requests
CREATE TABLE join_requests (
  id VARCHAR(128) PRIMARY KEY,
  team_id VARCHAR(128) NOT NULL REFERENCES teams(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  position VARCHAR(8) NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  avatar TEXT,
  status VARCHAR(32) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  referrer_id VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_join_requests_team ON join_requests(team_id);

-- 7. notifications
CREATE TABLE notifications (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128),
  team_id VARCHAR(128),
  type VARCHAR(32) NOT NULL CHECK (type IN ('match', 'payment', 'squad', 'social', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  action_screen VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_team ON notifications(team_id);

-- 8. payments
CREATE TABLE payments (
  id VARCHAR(128) PRIMARY KEY,
  player_id VARCHAR(128) NOT NULL REFERENCES users(id),
  player_name VARCHAR(255),
  team_id VARCHAR(128),
  amount INT NOT NULL,
  due_date DATE,
  status VARCHAR(32) NOT NULL CHECK (status IN ('PAID', 'PENDING', 'REFUND')),
  month VARCHAR(16),
  proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_player ON payments(player_id);
CREATE INDEX idx_payments_team ON payments(team_id);

-- 9. transactions
CREATE TABLE transactions (
  id VARCHAR(128) PRIMARY KEY,
  team_id VARCHAR(128),
  type VARCHAR(32) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(64),
  amount INT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  title VARCHAR(255),
  status VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_team ON transactions(team_id);

-- 10. polls
CREATE TABLE polls (
  id VARCHAR(128) PRIMARY KEY,
  team_id VARCHAR(128),
  question TEXT NOT NULL,
  total_votes INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  voters TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. poll_options (polls.options array → tablo)
CREATE TABLE poll_options (
  id SERIAL PRIMARY KEY,
  poll_id VARCHAR(128) NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id VARCHAR(32) NOT NULL,
  text VARCHAR(255) NOT NULL,
  votes INT DEFAULT 0,
  UNIQUE(poll_id, option_id)
);

-- 12. reservations
CREATE TABLE reservations (
  id VARCHAR(128) PRIMARY KEY,
  venue_id VARCHAR(128) NOT NULL REFERENCES venues(id),
  venue_name VARCHAR(255),
  team_name VARCHAR(255),
  date DATE NOT NULL,
  start_time VARCHAR(16) NOT NULL,
  end_time VARCHAR(16) NOT NULL,
  duration INT,
  price INT,
  status VARCHAR(32) NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  participants INT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(32),
  payment_status VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_venue ON reservations(venue_id);

-- 13. talent_pool (scout)
CREATE TABLE talent_pool (
  id VARCHAR(128) PRIMARY KEY,
  team_id VARCHAR(128),
  name VARCHAR(255) NOT NULL,
  position VARCHAR(8) NOT NULL,
  contact_number VARCHAR(32),
  avatar TEXT,
  discovered_by VARCHAR(128),
  discovered_date DATE,
  source VARCHAR(32),
  status VARCHAR(32),
  trial_matches_played INT,
  trial_matches_total INT,
  average_score DECIMAL(3,1),
  potential_rating DECIMAL(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. scout_reports
CREATE TABLE scout_reports (
  id VARCHAR(128) PRIMARY KEY,
  player_id VARCHAR(128),
  scout_id VARCHAR(128),
  scout_name VARCHAR(255),
  report_date DATE,
  overall_score DECIMAL(3,1),
  potential DECIMAL(3,1),
  recommendation VARCHAR(64),
  strengths TEXT[],
  weaknesses TEXT[],
  detailed_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. tournament_teams
CREATE TABLE tournament_teams (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo TEXT,
  played INT DEFAULT 0,
  won INT DEFAULT 0,
  drawn INT DEFAULT 0,
  lost INT DEFAULT 0,
  gf INT DEFAULT 0,
  ga INT DEFAULT 0,
  points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. bracket_matches
CREATE TABLE bracket_matches (
  id VARCHAR(128) PRIMARY KEY,
  round VARCHAR(32) CHECK (round IN ('quarter', 'semi', 'final')),
  team1_id VARCHAR(128),
  team1_name VARCHAR(255),
  team1_score INT,
  team2_id VARCHAR(128),
  team2_name VARCHAR(255),
  team2_score INT,
  winner_id VARCHAR(128),
  match_date VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
