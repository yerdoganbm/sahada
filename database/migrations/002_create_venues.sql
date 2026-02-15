-- Migration 002: Venues (matches'tan önce çalışmalı)
-- Kullanım: psql -U postgres -d sahada -f 002_create_venues.sql

BEGIN;

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  name VARCHAR(200) NOT NULL,
  district VARCHAR(100),
  address TEXT,
  description TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  
  primary_image_url TEXT,
  image_urls TEXT[],
  
  price_per_hour DECIMAL(10,2) DEFAULT 0,
  weekday_morning DECIMAL(10,2),
  weekday_afternoon DECIMAL(10,2),
  weekday_prime DECIMAL(10,2),
  weekend_morning DECIMAL(10,2),
  weekend_afternoon DECIMAL(10,2),
  weekend_prime DECIMAL(10,2),
  
  capacity VARCHAR(20),
  features TEXT[],
  
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed', 'maintenance')),
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  review_count INTEGER DEFAULT 0,
  
  total_reservations INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  occupancy_rate DECIMAL(5,2) DEFAULT 0,
  
  working_hours JSONB,
  door_code VARCHAR(50),
  contact_person VARCHAR(100),
  contact_phone VARCHAR(20),
  custom_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_owner_id ON venues(owner_id);
CREATE INDEX idx_venues_district ON venues(district);
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_venues_rating ON venues(rating);

CREATE TRIGGER venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

COMMIT;
