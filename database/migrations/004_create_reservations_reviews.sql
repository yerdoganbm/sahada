-- Migration 004: Reservations & Venue Reviews (venues 002'de oluşturulmuş olmalı)
-- Kullanım: psql -U postgres -d sahada -f 004_create_reservations_reviews.sql

BEGIN;

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  team_name VARCHAR(100),
  contact_person VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  participants INTEGER DEFAULT 14,
  notes TEXT,
  
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'credit_card', 'bank_transfer')),
  
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT reservation_time_check CHECK (end_time > start_time)
);

CREATE INDEX idx_reservations_venue_id ON reservations(venue_id);
CREATE INDEX idx_reservations_team_id ON reservations(team_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE UNIQUE INDEX idx_reservations_slot ON reservations(venue_id, reservation_date, start_time) 
  WHERE status != 'cancelled';

CREATE TRIGGER reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TABLE venue_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  team_name VARCHAR(100),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  response_text TEXT,
  response_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(venue_id, team_id)
);

CREATE INDEX idx_venue_reviews_venue_id ON venue_reviews(venue_id);
CREATE INDEX idx_venue_reviews_rating ON venue_reviews(rating);

CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE venues SET
    rating = (SELECT COALESCE(AVG(rating), 0) FROM venue_reviews WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)),
    review_count = (SELECT COUNT(*) FROM venue_reviews WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id))
  WHERE id = COALESCE(NEW.venue_id, OLD.venue_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venue_reviews_update_rating AFTER INSERT OR UPDATE OR DELETE ON venue_reviews
  FOR EACH ROW EXECUTE PROCEDURE update_venue_rating();

COMMIT;
