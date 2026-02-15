/**
 * MongoDB Connection and Database Utilities
 * Centralized database connection management for Sahada App
 */

import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sahada';
const DB_NAME = process.env.DB_NAME || 'sahada';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect to MongoDB
 * Reuses existing connection if available
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) {
    return { client, db };
  }

  try {
    client = await MongoClient.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    db = client.db(DB_NAME);

    console.log('✅ MongoDB connected successfully');
    
    // Create indexes
    await createIndexes(db);

    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

/**
 * Get database instance
 */
export async function getDatabase(): Promise<Db> {
  if (!db) {
    const { db: database } = await connectToDatabase();
    return database;
  }
  return db;
}

/**
 * Get a specific collection
 */
export async function getCollection<T = any>(collectionName: string): Promise<Collection<T>> {
  const database = await getDatabase();
  return database.collection<T>(collectionName);
}

/**
 * Close database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
}

/**
 * Create database indexes for performance
 */
async function createIndexes(database: Db): Promise<void> {
  try {
    // Players Collection Indexes
    await database.collection('players').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { phone: 1 }, unique: true, sparse: true },
      { key: { email: 1 }, unique: true, sparse: true },
      { key: { role: 1 } },
      { key: { teamId: 1 } },
      { key: { createdAt: -1 } },
    ]);

    // Matches Collection Indexes
    await database.collection('matches').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { teamId: 1 } },
      { key: { date: -1 } },
      { key: { status: 1 } },
      { key: { venueId: 1 } },
    ]);

    // Venues Collection Indexes
    await database.collection('venues').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { name: 1 } },
      { key: { ownerId: 1 } },
      { key: { location: '2dsphere' } }, // Geospatial index for location-based queries
    ]);

    // Payments Collection Indexes
    await database.collection('payments').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { playerId: 1 } },
      { key: { teamId: 1 } },
      { key: { status: 1 } },
      { key: { dueDate: -1 } },
    ]);

    // Transactions Collection Indexes
    await database.collection('transactions').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { teamId: 1 } },
      { key: { category: 1 } },
      { key: { date: -1 } },
    ]);

    // Teams Collection Indexes
    await database.collection('teams').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { name: 1 } },
      { key: { ownerId: 1 } },
      { key: { createdAt: -1 } },
    ]);

    // Reservations Collection Indexes
    await database.collection('reservations').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { venueId: 1 } },
      { key: { teamId: 1 } },
      { key: { startTime: 1 } },
      { key: { status: 1 } },
    ]);

    // Scout Reports Collection Indexes
    await database.collection('scoutReports').createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { playerId: 1 } },
      { key: { scoutId: 1 } },
      { key: { createdAt: -1 } },
    ]);

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    // Don't throw - indexes are performance optimization, not critical
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const database = await getDatabase();
    await database.admin().ping();
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

/**
 * Collection names enum for type safety
 */
export enum Collections {
  PLAYERS = 'players',
  MATCHES = 'matches',
  VENUES = 'venues',
  PAYMENTS = 'payments',
  TRANSACTIONS = 'transactions',
  TEAMS = 'teams',
  RESERVATIONS = 'reservations',
  POLLS = 'polls',
  SCOUT_REPORTS = 'scoutReports',
  TALENT_POOL = 'talentPool',
  NOTIFICATIONS = 'notifications',
  JOIN_REQUESTS = 'joinRequests',
}
