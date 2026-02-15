-- Migration 006: Social & Auth (polls, join_requests, notifications, message_logs, sessions, push_tokens)
-- Kullanım: psql -U postgres -d sahada -f 006_create_social_and_auth.sql

BEGIN;

CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  
  total_votes INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  related_transfer_id UUID,
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_polls_team_id ON polls(team_id);
CREATE INDEX idx_polls_expires_at ON polls(expires_at);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  option_id VARCHAR(50) NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(poll_id, voter_id)
);

CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_voter_id ON poll_votes(voter_id);

CREATE TABLE join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  position VARCHAR(3) CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  avatar_url TEXT,
  
  referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invite_code VARCHAR(20),
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_join_requests_team_id ON join_requests(team_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);
CREATE INDEX idx_join_requests_referred_by ON join_requests(referred_by);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  type VARCHAR(20) CHECK (type IN ('system', 'match', 'payment', 'social', 'admin')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  action_screen VARCHAR(50),
  action_params JSONB,
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  type VARCHAR(20) CHECK (type IN ('reminder', 'payment', 'squad', 'poll', 'announcement')),
  recipient VARCHAR(200) NOT NULL,
  phone_number VARCHAR(20),
  
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMPTZ,
  failed_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_logs_team_id ON message_logs(team_id);
CREATE INDEX idx_message_logs_status ON message_logs(status);
CREATE INDEX idx_message_logs_type ON message_logs(type);
CREATE INDEX idx_message_logs_sent_at ON message_logs(sent_at);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(255),
  
  device_info JSONB,
  ip_address INET,
  
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  token VARCHAR(500) NOT NULL,
  platform VARCHAR(10) CHECK (platform IN ('ios', 'android', 'web')),
  
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_is_active ON push_tokens(is_active);

COMMIT;
