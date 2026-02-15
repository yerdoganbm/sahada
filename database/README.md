# Sahada Veritabanı

PostgreSQL şeması, migration'lar ve seed verisi.

## Sıra

1. Veritabanı oluştur: `CREATE DATABASE sahada;`
2. Migration'ları sırayla çalıştır:
   - `001_create_base_tables.sql` — teams, users
   - `002_create_venues.sql` — venues
   - `003_create_match_system.sql` — matches, match_attendees, mvp_votes
   - `004_create_reservations_reviews.sql` — reservations, venue_reviews
   - `005_create_financial_system.sql` — payments, transactions
   - `006_create_social_and_auth.sql` — polls, poll_votes, join_requests, notifications, message_logs, sessions, push_tokens
3. İsteğe bağlı seed: `seeds/001_initial_data.sql`

## Örnek (bash)

```bash
cd database
export PGDATABASE=sahada
psql -U postgres -c "CREATE DATABASE sahada;" 2>/dev/null || true
for f in migrations/001_create_base_tables.sql migrations/002_create_venues.sql migrations/003_create_match_system.sql migrations/004_create_reservations_reviews.sql migrations/005_create_financial_system.sql migrations/006_create_social_and_auth.sql; do
  psql -U postgres -d sahada -f "$f"
done
psql -U postgres -d sahada -f seeds/001_initial_data.sql
```

## Seed sonrası test kullanıcısı

- **User ID (X-User-Id):** `b0000001-0000-4000-8000-000000000001` (Demo Admin)
- Takım: Sahada Demo Takım, invite_code: `DEMO2026`

Detaylı şema: [SCHEMA.md](./SCHEMA.md)
