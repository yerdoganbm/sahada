/**
 * Unified DB access: DB_TYPE=mongo | postgres
 * Mongo: getCollection, checkDatabaseHealth from mongodb
 * Postgres: getPostgresPool, checkPostgresHealth from postgres
 */

export const DB_TYPE = process.env.DB_TYPE || 'mongo';

export {
  connectToDatabase,
  getCollection,
  getDatabase,
  checkDatabaseHealth as checkMongoHealth,
  closeDatabaseConnection,
  Collections,
} from './mongodb';

export {
  getPostgresPool,
  connectPostgres,
  checkPostgresHealth,
  closePostgres,
} from './postgres';

export async function checkDatabaseHealth(): Promise<boolean> {
  if (DB_TYPE === 'postgres') {
    const { checkPostgresHealth } = await import('./postgres');
    return checkPostgresHealth();
  }
  const { checkDatabaseHealth: mongoHealth } = await import('./mongodb');
  return mongoHealth();
}
