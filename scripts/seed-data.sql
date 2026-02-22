-- =============================================
-- Sahada – Örnek veri (schema.sql sonrası çalıştır)
-- psql -U postgres -d sahada -f scripts/seed-data.sql
-- =============================================

-- teams
INSERT INTO teams (id, name, short_name, invite_code, primary_color, secondary_color) VALUES
('team1', 'Sahada Demo Takım', 'SDT', 'DEMO2025', '#10B981', '#0B0F1A');

-- users
INSERT INTO users (id, team_id, name, phone, email, role, position, rating, reliability, avatar, is_captain, tier, shirt_number) VALUES
('user1', 'team1', 'Demo Admin', '05321234567', 'admin@demo.com', 'admin', 'MID', 7, 100, 'https://i.pravatar.cc/150?u=admin', TRUE, 'premium', NULL),
('user2', 'team1', 'Mehmet Demir', '05329876543', 'mehmet@demo.com', 'member', 'FWD', 6.5, 90, 'https://i.pravatar.cc/150?u=mehmet', FALSE, 'free', 10),
('user3', 'team1', 'Caner Erkin', '05335556677', 'caner@demo.com', 'member', 'DEF', 7.2, 95, 'https://i.pravatar.cc/150?u=caner', FALSE, 'free', 3);

-- venues
INSERT INTO venues (id, name, location, address, price_per_hour, rating, primary_image_url, features) VALUES
('venue1', 'Olimpik Halı Saha', 'Kadıköy', 'Fenerbahçe Mah. Kalamış Cad. No:88', 1200, 4.8, 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400', ARRAY['Otopark', 'Duş', 'Kafe']),
('venue2', 'Merkez Arena', 'Beşiktaş', NULL, 1000, 4.5, NULL, ARRAY['Duş']);

-- matches
INSERT INTO matches (id, team_id, venue_id, match_date, match_time, location, venue_name, status, price_per_person, capacity, score) VALUES
('match1', 'team1', 'venue1', CURRENT_DATE + 1, '20:00', 'Kadıköy', 'Olimpik Halı Saha', 'upcoming', 120, 14, NULL),
('match2', 'team1', 'venue2', CURRENT_DATE - 1, '21:00', 'Beşiktaş', 'Merkez Arena', 'completed', 150, 14, '3-2');

-- match_attendees (match2 için)
INSERT INTO match_attendees (match_id, player_id, status) VALUES
('match2', 'user1', 'YES'),
('match2', 'user2', 'YES'),
('match2', 'user3', 'YES');

-- join_requests
INSERT INTO join_requests (id, team_id, name, phone, position, avatar, status) VALUES
('jr1', 'team1', 'Ali Veli', '05321112233', 'MID', 'https://i.pravatar.cc/150?u=ali', 'pending');

-- notifications
INSERT INTO notifications (id, type, title, message, is_read) VALUES
('n1', 'match', 'Maç hatırlatması', 'Yarın 20:00 maçına 2 saat kaldı.', FALSE),
('n2', 'payment', 'Ödeme hatırlatması', 'Bu ayın aidat ödemesi bekleniyor.', TRUE);

-- payments
INSERT INTO payments (id, player_id, player_name, team_id, amount, status, month) VALUES
('p1', 'user1', 'Demo Admin', 'team1', 150, 'PAID', '2025-02'),
('p2', 'user2', 'Mehmet Demir', 'team1', 150, 'PENDING', '2025-02');

-- transactions
INSERT INTO transactions (id, team_id, type, category, amount, date, description) VALUES
('t1', 'team1', 'income', 'gelir', 2100, '2025-02-12', '14 Oyuncu Katılımı'),
('t2', 'team1', 'expense', 'saha_kirasi', -1800, '2025-02-12', 'Saha Kirası');

-- polls
INSERT INTO polls (id, team_id, question, total_votes) VALUES
('poll1', 'team1', 'Bu haftanın MVP''si kim?', 7);

INSERT INTO poll_options (poll_id, option_id, text, votes) VALUES
('poll1', 'o1', 'Ahmet', 5),
('poll1', 'o2', 'Mehmet', 2);
