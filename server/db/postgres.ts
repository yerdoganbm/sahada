/**
 * PostgreSQL connection (DB_TYPE=postgres)
 * database/migrations ve database/seeds calistirildiktan sonra kullanilir.
 */

import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.PG_URL ||
  'postgresql://postgres:postgres@localhost:5432/sahada';

let pool: pg.Pool | null = null;

export function getPostgresPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function connectPostgres(): Promise<pg.Pool> {
  const p = getPostgresPool();
  const client = await p.connect();
  client.release();
  return p;
}

export async function checkPostgresHealth(): Promise<boolean> {
  try {
    const p = getPostgresPool();
    const client = await p.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (e) {
    console.error('PostgreSQL health check failed:', e);
    return false;
  }
}

export async function closePostgres(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL pool closed');
  }
}
