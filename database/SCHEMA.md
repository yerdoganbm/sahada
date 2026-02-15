# 🗄️ Sahada - Detaylı Veritabanı Şeması (PostgreSQL)

Bu doküman, Sahada halı saha otomasyon sisteminin tam PostgreSQL veritabanı şemasını, ilişkilerini, indexlerini ve migration stratejisini içerir.

---

## 📊 Tablo Özeti

| Tablo | Açıklama | İlişkiler |
|-------|----------|-----------|
| **teams** | Takım profilleri | → players, matches, payments, transactions, polls |
| **users** | Kullanıcılar (oyuncular, adminler, saha sahipleri) | → teams (teamId), venues (ownerId), scout_reports |
| **matches** | Maçlar | → teams, venues, match_attendees, mvp_votes |
| **match_attendees** | Maç katılımları (RSVP) | → matches, users |
| **mvp_votes** | MVP oylamaları | → matches, users (player, voter) |
| **venues** | Sahalar | → users (ownerId), reservations, venue_reviews |
| **reservations** | Saha rezervasyonları | → venues, teams |
| **venue_reviews** | Saha değerlendirmeleri | → venues, teams |
| **payments** | Aidat ve ödeme takibi | → users, teams, matches |
| **transactions** | Finansal işlemler | → teams |
| **polls** | Anketler | → teams, poll_votes |
| **poll_votes** | Anket oyları | → polls, users |
| **join_requests** | Takıma katılma talepleri | → teams, users (referredBy) |
| **scout_reports** | Scout değerlendirmeleri | → users (player, scout) |
| **talent_pool** | Yetenek havuzu | → users (discoveredBy), scout_reports |
| **notifications** | Uygulama bildirimleri | → users, teams |
| **message_logs** | WhatsApp/SMS mesaj logları | → teams |

---

## 1. **teams** - Takımlar

```sql
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
```

**İlişkiler:**
- `users.team_id → teams.id` (oyuncular)
- `matches.team_id → teams.id`
- `payments.team_id → teams.id`

---

## 2. **users** - Kullanıcılar

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(100),
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  
  -- Rol ve yetki
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest', 'venue_owner', 'scout')),
  is_captain BOOLEAN DEFAULT false,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'partner')),
  
  -- Oyuncu bilgileri
  position VARCHAR(3) CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  shirt_number INTEGER CHECK (shirt_number BETWEEN 1 AND 99),
  rating DECIMAL(3,1) DEFAULT 7.0 CHECK (rating BETWEEN 0 AND 10),
  reliability INTEGER DEFAULT 100 CHECK (reliability BETWEEN 0 AND 100),
  
  -- FIFA-like attributes (0-100)
  pac INTEGER CHECK (pac BETWEEN 0 AND 100),
  sho INTEGER CHECK (sho BETWEEN 0 AND 100),
  pas INTEGER CHECK (pas BETWEEN 0 AND 100),
  dri INTEGER CHECK (dri BETWEEN 0 AND 100),
  def INTEGER CHECK (def BETWEEN 0 AND 100),
  phy INTEGER CHECK (phy BETWEEN 0 AND 100),
  
  -- Scouting & Trial
  referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
  trial_status VARCHAR(20) CHECK (trial_status IN ('pending_approval', 'in_trial', 'promoted', 'rejected')),
  trial_matches_played INTEGER DEFAULT 0,
  trial_matches_total INTEGER DEFAULT 3,
  
  -- İstatistikler
  total_matches INTEGER DEFAULT 0,
  total_goals INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  mvp_count INTEGER DEFAULT 0,
  
  -- Saha sahibi bilgileri (venue_owner için)
  venue_owner_company_name VARCHAR(100),
  venue_owner_tax_number VARCHAR(20),
  venue_owner_iban VARCHAR(34),
  venue_owner_commission_rate DECIMAL(5,2) DEFAULT 15.00,
  
  -- Güvenlik
  biometric_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  
  -- Zaman damgaları
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_trial_status ON users(trial_status);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

---

## 3. **matches** - Maçlar

```sql
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT match_datetime_check CHECK (match_date >= CURRENT_DATE)
);

CREATE INDEX idx_matches_team_id ON matches(team_id);
CREATE INDEX idx_matches_venue_id ON matches(venue_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_upcoming ON matches(match_date, status) WHERE status = 'upcoming';
```

---

## 4. **match_attendees** - Maç katılımları

```sql
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
```

---

## 5. **mvp_votes** - MVP oylamaları

```sql
CREATE TABLE mvp_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Oy alan
  voter_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Oy veren
  
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(match_id, voter_id), -- Her oyuncu maçta bir kez oy verir
  CHECK (player_id != voter_id) -- Kendine oy veremez
);

CREATE INDEX idx_mvp_votes_match_id ON mvp_votes(match_id);
CREATE INDEX idx_mvp_votes_player_id ON mvp_votes(player_id);
```

---

## 6. **venues** - Sahalar

```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  name VARCHAR(200) NOT NULL,
  district VARCHAR(100),
  address TEXT,
  description TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  
  -- Görsel
  primary_image_url TEXT,
  image_urls TEXT[], -- Array of image URLs
  
  -- Fiyat
  price_per_hour DECIMAL(10,2) DEFAULT 0,
  weekday_morning DECIMAL(10,2),
  weekday_afternoon DECIMAL(10,2),
  weekday_prime DECIMAL(10,2),
  weekend_morning DECIMAL(10,2),
  weekend_afternoon DECIMAL(10,2),
  weekend_prime DECIMAL(10,2),
  
  -- Özellikler
  capacity VARCHAR(20), -- "14 kişilik"
  features TEXT[], -- ["Soyunma Odası", "Duş", "Kamera"]
  
  -- Konum
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Durum
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed', 'maintenance')),
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  review_count INTEGER DEFAULT 0,
  
  -- İstatistikler
  total_reservations INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  occupancy_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Çalışma saatleri (JSON)
  working_hours JSONB,
  
  -- Saha sahibi notları
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
CREATE INDEX idx_venues_location ON venues USING GIST(ll_to_earth(latitude, longitude));
```

---

## 7. **reservations** - Rezervasyonlar

```sql
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
  
  CONSTRAINT reservation_time_check CHECK (end_time > start_time),
  CONSTRAINT reservation_future_check CHECK (
    reservation_date > CURRENT_DATE 
    OR (reservation_date = CURRENT_DATE AND start_time > CURRENT_TIME)
  )
);

CREATE INDEX idx_reservations_venue_id ON reservations(venue_id);
CREATE INDEX idx_reservations_team_id ON reservations(team_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE UNIQUE INDEX idx_reservations_slot ON reservations(venue_id, reservation_date, start_time) 
  WHERE status != 'cancelled';
```

---

## 8. **venue_reviews** - Saha değerlendirmeleri

```sql
CREATE TABLE venue_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  team_name VARCHAR(100),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  -- Saha sahibi yanıtı
  response_text TEXT,
  response_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(venue_id, team_id) -- Her takım bir sahaya bir kez yorum yapar
);

CREATE INDEX idx_venue_reviews_venue_id ON venue_reviews(venue_id);
CREATE INDEX idx_venue_reviews_rating ON venue_reviews(rating);
```

---

## 9. **payments** - Ödemeler

```sql
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
  
  month VARCHAR(7), -- "2026-02" formatında
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
```

---

## 10. **transactions** - Finansal işlemler

```sql
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
```

---

## 11. **polls** - Anketler

```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- [{"id":"opt1","text":"Seçenek 1","votes":0}]
  
  total_votes INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  
  -- Transfer anketi ise
  related_transfer_id UUID,
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_polls_team_id ON polls(team_id);
CREATE INDEX idx_polls_expires_at ON polls(expires_at);
```

---

## 12. **poll_votes** - Anket oyları

```sql
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  option_id VARCHAR(50) NOT NULL, -- polls.options dizisindeki id
  
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(poll_id, voter_id) -- Her kullanıcı bir ankete bir kez oy verir
);

CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_voter_id ON poll_votes(voter_id);
```

---

## 13. **join_requests** - Takıma katılma talepleri

```sql
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
```

---

## 14. **scout_reports** - Scout raporları

```sql
CREATE TABLE scout_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scout_id UUID REFERENCES users(id) ON DELETE SET NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  
  -- Teknik (0-10)
  ball_control DECIMAL(3,1) CHECK (ball_control BETWEEN 0 AND 10),
  passing DECIMAL(3,1) CHECK (passing BETWEEN 0 AND 10),
  shooting DECIMAL(3,1) CHECK (shooting BETWEEN 0 AND 10),
  dribbling DECIMAL(3,1) CHECK (dribbling BETWEEN 0 AND 10),
  first_touch DECIMAL(3,1) CHECK (first_touch BETWEEN 0 AND 10),
  
  -- Fiziksel (0-10)
  speed DECIMAL(3,1) CHECK (speed BETWEEN 0 AND 10),
  stamina DECIMAL(3,1) CHECK (stamina BETWEEN 0 AND 10),
  strength DECIMAL(3,1) CHECK (strength BETWEEN 0 AND 10),
  agility DECIMAL(3,1) CHECK (agility BETWEEN 0 AND 10),
  
  -- Mental (0-10)
  positioning DECIMAL(3,1) CHECK (positioning BETWEEN 0 AND 10),
  decision_making DECIMAL(3,1) CHECK (decision_making BETWEEN 0 AND 10),
  game_reading DECIMAL(3,1) CHECK (game_reading BETWEEN 0 AND 10),
  work_rate DECIMAL(3,1) CHECK (work_rate BETWEEN 0 AND 10),
  teamwork DECIMAL(3,1) CHECK (teamwork BETWEEN 0 AND 10),
  
  overall_score DECIMAL(3,1) GENERATED ALWAYS AS (
    (ball_control + passing + shooting + dribbling + first_touch +
     speed + stamina + strength + agility +
     positioning + decision_making + game_reading + work_rate + teamwork) / 14
  ) STORED,
  
  potential DECIMAL(3,1) CHECK (potential BETWEEN 0 AND 10),
  recommendation VARCHAR(20) CHECK (recommendation IN ('sign_now', 'extend_trial', 'watch_more', 'reject')),
  
  strengths TEXT[],
  weaknesses TEXT[],
  detailed_notes TEXT,
  
  video_url TEXT,
  photo_urls TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scout_reports_player_id ON scout_reports(player_id);
CREATE INDEX idx_scout_reports_scout_id ON scout_reports(scout_id);
CREATE INDEX idx_scout_reports_match_id ON scout_reports(match_id);
```

---

## 15. **talent_pool** - Yetenek havuzu

```sql
CREATE TABLE talent_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  age INTEGER,
  position VARCHAR(3) CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  contact_phone VARCHAR(20) NOT NULL,
  avatar_url TEXT,
  
  discovered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  discovered_date DATE DEFAULT CURRENT_DATE,
  source VARCHAR(20) CHECK (source IN ('referral', 'open_trial', 'tournament', 'social_media', 'other')),
  
  status VARCHAR(20) DEFAULT 'scouting' CHECK (status IN ('scouting', 'in_trial', 'approved', 'rejected', 'signed')),
  trial_matches_played INTEGER DEFAULT 0,
  trial_matches_total INTEGER DEFAULT 3,
  
  average_score DECIMAL(3,1),
  potential_rating DECIMAL(3,1),
  
  final_decision VARCHAR(20) CHECK (final_decision IN ('sign', 'reject', 'extend_trial')),
  final_decision_by UUID REFERENCES users(id) ON DELETE SET NULL,
  final_decision_date DATE,
  final_decision_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_talent_pool_status ON talent_pool(status);
CREATE INDEX idx_talent_pool_discovered_by ON talent_pool(discovered_by);
CREATE INDEX idx_talent_pool_position ON talent_pool(position);
```

---

## 16. **notifications** - Bildirimler

```sql
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
```

---

## 17. **message_logs** - WhatsApp/SMS mesaj logları

```sql
CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  type VARCHAR(20) CHECK (type IN ('reminder', 'payment', 'squad', 'poll', 'announcement')),
  recipient VARCHAR(200) NOT NULL, -- Grup veya kişi adı
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
```

---

## 18. **sessions** - Oturum yönetimi (JWT/Token)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(255),
  
  device_info JSONB, -- {platform, model, osVersion}
  ip_address INET,
  
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

## 19. **push_tokens** - Push bildirimleri (FCM/APNs)

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  token VARCHAR(500) NOT NULL UNIQUE,
  platform VARCHAR(10) CHECK (platform IN ('ios', 'android', 'web')),
  
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_is_active ON push_tokens(is_active);
```

---

## 20. **venue_statistics** - Saha istatistikleri (toplam)

```sql
CREATE TABLE venue_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  
  period VARCHAR(10) CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_date DATE NOT NULL,
  
  total_reservations INTEGER DEFAULT 0,
  confirmed_reservations INTEGER DEFAULT 0,
  cancelled_reservations INTEGER DEFAULT 0,
  completed_reservations INTEGER DEFAULT 0,
  
  gross_revenue DECIMAL(12,2) DEFAULT 0,
  commission_amount DECIMAL(12,2) DEFAULT 0,
  net_revenue DECIMAL(12,2) DEFAULT 0,
  
  total_slots INTEGER DEFAULT 0,
  booked_slots INTEGER DEFAULT 0,
  occupancy_rate DECIMAL(5,2) DEFAULT 0,
  
  peak_hours JSONB, -- [{"hour":20,"count":5}]
  top_teams JSONB, -- [{"teamId":"...","teamName":"...","count":3}]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(venue_id, period, period_date)
);

CREATE INDEX idx_venue_statistics_venue_id ON venue_statistics(venue_id);
CREATE INDEX idx_venue_statistics_period ON venue_statistics(period, period_date);
```

---

## 📐 İlişki Diyagramı (ERD)

```
teams
  ├─→ users (team_id)
  ├─→ matches (team_id)
  ├─→ payments (team_id)
  ├─→ transactions (team_id)
  ├─→ polls (team_id)
  ├─→ join_requests (team_id)
  ├─→ reservations (team_id)
  └─→ notifications (team_id)

users
  ├─→ matches (created_by)
  ├─→ match_attendees (player_id)
  ├─→ mvp_votes (player_id, voter_id)
  ├─→ payments (player_id)
  ├─→ venues (owner_id) [venue_owner role]
  ├─→ scout_reports (player_id, scout_id)
  ├─→ talent_pool (discovered_by)
  ├─→ join_requests (referred_by)
  ├─→ poll_votes (voter_id)
  ├─→ sessions (user_id)
  ├─→ push_tokens (user_id)
  └─→ notifications (user_id)

matches
  ├─→ match_attendees (match_id)
  ├─→ mvp_votes (match_id)
  ├─→ payments (match_id)
  └─→ scout_reports (match_id)

venues
  ├─→ matches (venue_id)
  ├─→ reservations (venue_id)
  ├─→ venue_reviews (venue_id)
  └─→ venue_statistics (venue_id)

polls
  └─→ poll_votes (poll_id)
```

---

## 🔒 Güvenlik & Constraintler

### Row Level Security (RLS) - PostgreSQL
```sql
-- Örnek: users tablosunda RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi takımlarını görebilir
CREATE POLICY users_team_isolation ON users
  FOR SELECT
  USING (team_id = current_setting('app.current_team_id')::uuid);

-- Adminler her şeyi görebilir
CREATE POLICY users_admin_access ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = current_setting('app.current_user_id')::uuid 
      AND u.role = 'admin'
    )
  );
```

### Triggerlı otomasyonlar

**1. Güncelleme zaman damgası**
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**2. MVP kazanan otomatik update**
```sql
CREATE OR REPLACE FUNCTION update_mvp_winner()
RETURNS TRIGGER AS $$
DECLARE
  winner_id UUID;
BEGIN
  -- En çok oy alan oyuncuyu bul
  SELECT player_id INTO winner_id
  FROM mvp_votes
  WHERE match_id = NEW.match_id
  GROUP BY player_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  -- Maçın mvp_winner_id'sini güncelle
  UPDATE matches SET mvp_winner_id = winner_id WHERE id = NEW.match_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mvp_votes_update_winner AFTER INSERT OR DELETE ON mvp_votes
  FOR EACH ROW EXECUTE FUNCTION update_mvp_winner();
```

**3. Saha rating güncellemesi**
```sql
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE venues SET
    rating = (SELECT AVG(rating) FROM venue_reviews WHERE venue_id = NEW.venue_id),
    review_count = (SELECT COUNT(*) FROM venue_reviews WHERE venue_id = NEW.venue_id)
  WHERE id = NEW.venue_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venue_reviews_update_rating AFTER INSERT OR UPDATE OR DELETE ON venue_reviews
  FOR EACH ROW EXECUTE FUNCTION update_venue_rating();
```

**4. Ödeme durumu kontrol**
```sql
CREATE OR REPLACE FUNCTION check_overdue_payments()
RETURNS void AS $$
BEGIN
  UPDATE payments
  SET status = 'overdue'
  WHERE status = 'pending' AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Cron (pg_cron) ile günlük çalıştır:
-- SELECT cron.schedule('check-overdue', '0 6 * * *', 'SELECT check_overdue_payments()');
```

---

## 📦 Seed Data Örnekleri

`database/seeds/001_initial_data.sql`:

```sql
-- 1. Örnek takım
INSERT INTO teams (id, name, short_name, invite_code, primary_color, secondary_color, founded_year, founder_name, founder_email)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Sahada FC', 'SFC', 'SFC2026', '#10B981', '#0B0F1A', '2024', 'Ahmet Yılmaz', 'ahmet@sahada.app');

-- 2. Örnek kullanıcılar
INSERT INTO users (id, team_id, name, phone, email, role, is_captain, position, rating, reliability, avatar_url)
VALUES
  ('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'Ahmet Yılmaz', '+905321234567', 'ahmet@sahada.app', 'admin', true, 'MID', 8.5, 95, 'https://i.pravatar.cc/150?u=1'),
  ('22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'Mehmet Demir', '+905321234568', 'mehmet@sahada.app', 'member', false, 'DEF', 7.2, 88, 'https://i.pravatar.cc/150?u=2'),
  ('77777777-7777-7777-7777-777777777777', '550e8400-e29b-41d4-a716-446655440000', 'Burak Yılmaz', '+905327654321', 'burak@sahada.app', 'member', true, 'FWD', 8.0, 90, 'https://i.pravatar.cc/150?u=7');

-- 3. Örnek sahalar
INSERT INTO venues (id, name, district, address, phone, price_per_hour, capacity, rating, features, primary_image_url, latitude, longitude)
VALUES
  ('v1111111-1111-1111-1111-111111111111', 'Olimpik Halı Saha', 'Kadıköy', 'Kadıköy Mah. Sahil Cad. No:123', '+902161234567', 1200, '14 kişilik', 4.8, ARRAY['Soyunma Odası', 'Duş', 'Kamera', 'Otopark'], 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400', 40.9880, 29.0267),
  ('v2222222-2222-2222-2222-222222222222', 'Merkez Arena', 'Beşiktaş', 'Beşiktaş Mah. Spor Sk. No:45', '+902123456789', 1000, '12 kişilik', 4.5, ARRAY['Soyunma Odası', 'Duş', 'Kafeterya'], 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400', 41.0426, 28.9956);

-- 4. Örnek maç
INSERT INTO matches (id, team_id, venue_id, match_date, match_time, location, status, price_per_person, capacity)
VALUES
  ('m1111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'v1111111-1111-1111-1111-111111111111', CURRENT_DATE + 1, '20:00:00', 'Olimpik Halı Saha', 'upcoming', 120, 14);

-- 5. Örnek katılımlar
INSERT INTO match_attendees (match_id, player_id, status)
VALUES
  ('m1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'YES'),
  ('m1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'YES'),
  ('m1111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'MAYBE');
```

---

## 🚀 Migration Stratejisi

### Araçlar
- **Node.js:** `node-pg-migrate` veya `knex.js`
- **Supabase:** Native migration dashboard
- **Prisma:** `prisma migrate`

### Sıra
1. `001_create_base_tables.sql` - teams, users
2. `002_create_match_system.sql` - matches, match_attendees, mvp_votes
3. `003_create_venue_system.sql` - venues, reservations, venue_reviews
4. `004_create_financial_system.sql` - payments, transactions
5. `005_create_social_features.sql` - polls, poll_votes, notifications
6. `006_create_scout_system.sql` - scout_reports, talent_pool, join_requests
7. `007_create_auth_system.sql` - sessions, push_tokens, message_logs
8. `008_create_triggers.sql` - Tüm triggerlar
9. `009_seed_data.sql` - Test verisi

---

## 📈 Performans & Ölçeklenebilirlik

### Partitioning
Büyük tablolar için:
```sql
-- matches tablosunu yıla göre partition
CREATE TABLE matches_2026 PARTITION OF matches
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

### Materialized Views
Sık kullanılan toplamalar için:
```sql
CREATE MATERIALIZED VIEW team_stats AS
SELECT 
  t.id AS team_id,
  t.name,
  COUNT(DISTINCT m.id) AS total_matches,
  COUNT(DISTINCT u.id) AS total_members,
  AVG(u.rating) AS avg_rating
FROM teams t
LEFT JOIN matches m ON m.team_id = t.id
LEFT JOIN users u ON u.team_id = t.id
GROUP BY t.id, t.name;

CREATE UNIQUE INDEX ON team_stats(team_id);

-- Günlük refresh:
-- SELECT cron.schedule('refresh-stats', '0 0 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY team_stats');
```

---

## 🔍 Örnek Sorgular

**1. Yaklaşan maçlar (Dashboard)**
```sql
SELECT m.*, v.name AS venue_name, 
       COUNT(ma.id) FILTER (WHERE ma.status = 'YES') AS confirmed_count
FROM matches m
LEFT JOIN venues v ON v.id = m.venue_id
LEFT JOIN match_attendees ma ON ma.match_id = m.id
WHERE m.team_id = $1 AND m.status = 'upcoming' AND m.match_date >= CURRENT_DATE
GROUP BY m.id, v.name
ORDER BY m.match_date, m.match_time
LIMIT 5;
```

**2. Takım kadrosu + istatistikler**
```sql
SELECT u.*,
       COUNT(DISTINCT ma.match_id) AS matches_played,
       COUNT(mv.id) AS mvp_count
FROM users u
LEFT JOIN match_attendees ma ON ma.player_id = u.id AND ma.status = 'YES'
LEFT JOIN mvp_votes mv ON mv.player_id = u.id
WHERE u.team_id = $1 AND u.deleted_at IS NULL
GROUP BY u.id
ORDER BY u.rating DESC;
```

**3. Finansal rapor (aylık)**
```sql
SELECT 
  DATE_TRUNC('month', transaction_date) AS month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS balance
FROM transactions
WHERE team_id = $1
GROUP BY month
ORDER BY month DESC;
```

**4. Saha doluluk oranı**
```sql
WITH slots AS (
  SELECT 
    venue_id,
    COUNT(*) AS total_slots,
    COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed')) AS booked_slots
  FROM reservations
  WHERE reservation_date BETWEEN $1 AND $2
  GROUP BY venue_id
)
SELECT v.name, v.district,
       s.booked_slots,
       s.total_slots,
       ROUND((s.booked_slots::DECIMAL / NULLIF(s.total_slots, 0)) * 100, 2) AS occupancy_rate
FROM venues v
JOIN slots s ON s.venue_id = v.id
ORDER BY occupancy_rate DESC;
```

---

Bu şema Sahada'nın tüm özelliklerini (takım yönetimi, maç, finansal, rezervasyon, scout, bildirim) destekler.
