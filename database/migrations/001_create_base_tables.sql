-- Migration 001: Base Tables (teams, users)
-- Kullanım: psql -U postgres -d sahada -f 001_create_base_tables.sql

BEGIN;

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(20),
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#10B981',
  secondary_color VARCHAR(7) DEFAULT '#0B0F1A',
  founded_year VARCHAR(4),
  founder_name VARCHAR(100),
  founder_email VARCHAR(100),
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'partner')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_invite_code ON teams(invite_code);
CREATE INDEX idx_teams_is_active ON teams(is_active);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(100),
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest', 'venue_owner', 'scout')),
  is_captain BOOLEAN DEFAULT false,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'partner')),
  
  position VARCHAR(3) CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  shirt_number INTEGER CHECK (shirt_number BETWEEN 1 AND 99),
  rating DECIMAL(3,1) DEFAULT 7.0 CHECK (rating BETWEEN 0 AND 10),
  reliability INTEGER DEFAULT 100 CHECK (reliability BETWEEN 0 AND 100),
  
  pac INTEGER CHECK (pac BETWEEN 0 AND 100),
  sho INTEGER CHECK (sho BETWEEN 0 AND 100),
  pas INTEGER CHECK (pas BETWEEN 0 AND 100),
  dri INTEGER CHECK (dri BETWEEN 0 AND 100),
  def INTEGER CHECK (def BETWEEN 0 AND 100),
  phy INTEGER CHECK (phy BETWEEN 0 AND 100),
  
  referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
  trial_status VARCHAR(20) CHECK (trial_status IN ('pending_approval', 'in_trial', 'promoted', 'rejected')),
  trial_matches_played INTEGER DEFAULT 0,
  trial_matches_total INTEGER DEFAULT 3,
  
  total_matches INTEGER DEFAULT 0,
  total_goals INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  mvp_count INTEGER DEFAULT 0,
  
  venue_owner_company_name VARCHAR(100),
  venue_owner_tax_number VARCHAR(20),
  venue_owner_iban VARCHAR(34),
  venue_owner_commission_rate DECIMAL(5,2) DEFAULT 15.00,
  
  biometric_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_trial_status ON users(trial_status);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

COMMIT;
