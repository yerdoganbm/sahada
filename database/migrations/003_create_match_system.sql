-- Migration 003: Match System (venues 002'de oluşturulmuş olmalı)
-- Kullanım: psql -U postgres -d sahada -f 003_create_match_system.sql

BEGIN;

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  
  match_date DATE NOT NULL,
  match_time TIME NOT NULL,
  location VARCHAR(200),
  opponent VARCHAR(100),
  
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  score_home INTEGER,
  score_away INTEGER,
  
  price_per_person DECIMAL(10,2) DEFAULT 0,
  capacity INTEGER DEFAULT 14 CHECK (capacity IN (12, 14, 16)),
  waitlist_enabled BOOLEAN DEFAULT true,
  
  mvp_winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_team_id ON matches(team_id);
CREATE INDEX idx_matches_venue_id ON matches(venue_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_upcoming ON matches(match_date, status) WHERE status = 'upcoming';

CREATE TRIGGER matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TABLE match_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  status VARCHAR(20) DEFAULT 'MAYBE' CHECK (status IN ('YES', 'NO', 'MAYBE', 'CANCELLED')),
  is_waitlist BOOLEAN DEFAULT false,
  waitlist_position INTEGER,
  
  rsvp_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(match_id, player_id)
);

CREATE INDEX idx_match_attendees_match_id ON match_attendees(match_id);
CREATE INDEX idx_match_attendees_player_id ON match_attendees(player_id);
CREATE INDEX idx_match_attendees_status ON match_attendees(status);

CREATE TABLE mvp_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(match_id, voter_id),
  CHECK (player_id != voter_id)
);

CREATE INDEX idx_mvp_votes_match_id ON mvp_votes(match_id);
CREATE INDEX idx_mvp_votes_player_id ON mvp_votes(player_id);

CREATE OR REPLACE FUNCTION update_mvp_winner()
RETURNS TRIGGER AS $$
DECLARE
  winner_id UUID;
BEGIN
  SELECT player_id INTO winner_id
  FROM mvp_votes
  WHERE match_id = COALESCE(NEW.match_id, OLD.match_id)
  GROUP BY player_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  UPDATE matches SET mvp_winner_id = winner_id 
  WHERE id = COALESCE(NEW.match_id, OLD.match_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mvp_votes_update_winner AFTER INSERT OR DELETE ON mvp_votes
  FOR EACH ROW EXECUTE PROCEDURE update_mvp_winner();

COMMIT;
