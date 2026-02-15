-- Migration 005: Financial System (payments, transactions)
-- Kullanım: psql -U postgres -d sahada -f 005_create_financial_system.sql

BEGIN;

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'waiting_approval', 'refund')),
  payment_type VARCHAR(20) DEFAULT 'aidat' CHECK (payment_type IN ('aidat', 'match_fee', 'equipment', 'other')),
  
  month VARCHAR(7),
  proof_url TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_team_id ON payments(team_id);
CREATE INDEX idx_payments_player_id ON payments(player_id);
CREATE INDEX idx_payments_match_id ON payments(match_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_month ON payments(month);

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('aidat', 'saha_kirasi', 'ekipman', 'diger', 'gelir')),
  
  amount DECIMAL(10,2) NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending')),
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_team_id ON transactions(team_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

CREATE OR REPLACE FUNCTION check_overdue_payments()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE payments
  SET status = 'overdue'
  WHERE status = 'pending' AND due_date < CURRENT_DATE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;
