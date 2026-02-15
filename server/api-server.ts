/**
 * Express API Server for Sahada App
 * Provides RESTful endpoints for all app features
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectToDatabase, getCollection, Collections, checkDatabaseHealth } from './db/mongodb';
import type { Player, Match, Venue, Payment, Transaction, TeamProfile, Reservation, Poll } from '../types';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const dbHealthy = await checkDatabaseHealth();
    res.json({
      status: 'ok',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// ============================================
// PLAYERS API
// ============================================

// Get all players
app.get('/api/players', async (req: Request, res: Response) => {
  try {
    const { teamId, role } = req.query;
    const collection = await getCollection<Player>(Collections.PLAYERS);
    
    const filter: any = {};
    if (teamId) filter.teamId = teamId;
    if (role) filter.role = role;
    
    const players = await collection.find(filter).toArray();
    res.json(players);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get player by ID
app.get('/api/players/:id', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Player>(Collections.PLAYERS);
    const player = await collection.findOne({ id: req.params.id });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create player
app.post('/api/players', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Player>(Collections.PLAYERS);
    const newPlayer: Player = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await collection.insertOne(newPlayer as any);
    res.status(201).json(newPlayer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update player
app.put('/api/players/:id', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Player>(Collections.PLAYERS);
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    
    const result = await collection.updateOne(
      { id: req.params.id },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({ message: 'Player updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete player
app.delete('/api/players/:id', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Player>(Collections.PLAYERS);
    const result = await collection.deleteOne({ id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({ message: 'Player deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MATCHES API
// ============================================

// Get all matches
app.get('/api/matches', async (req: Request, res: Response) => {
  try {
    const { teamId, status, upcoming } = req.query;
    const collection = await getCollection<Match>(Collections.MATCHES);
    
    const filter: any = {};
    if (teamId) filter.teamId = teamId;
    if (status) filter.status = status;
    
    let matches = await collection.find(filter).sort({ date: -1 }).toArray();
    
    // Filter upcoming matches
    if (upcoming === 'true') {
      const now = new Date();
      matches = matches.filter((m: any) => new Date(m.date) >= now);
    }
    
    res.json(matches);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get match by ID
app.get('/api/matches/:id', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Match>(Collections.MATCHES);
    const match = await collection.findOne({ id: req.params.id });
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.json(match);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create match
app.post('/api/matches', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Match>(Collections.MATCHES);
    const newMatch: Match = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await collection.insertOne(newMatch as any);
    res.status(201).json(newMatch);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update match
app.put('/api/matches/:id', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Match>(Collections.MATCHES);
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    
    const result = await collection.updateOne(
      { id: req.params.id },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.json({ message: 'Match updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update match RSVP
app.post('/api/matches/:id/rsvp', async (req: Request, res: Response) => {
  try {
    const { playerId, status } = req.body;
    const collection = await getCollection<Match>(Collections.MATCHES);
    
    const match = await collection.findOne({ id: req.params.id });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    const attendees = (match as any).attendees || [];
    const existingIndex = attendees.findIndex((a: any) => a.playerId === playerId);
    
    if (existingIndex >= 0) {
      attendees[existingIndex].status = status;
    } else {
      attendees.push({ playerId, status });
    }
    
    await collection.updateOne(
      { id: req.params.id },
      { $set: { attendees, updatedAt: new Date().toISOString() } }
    );
    
    res.json({ message: 'RSVP updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// VENUES API
// ============================================

// Get all venues
app.get('/api/venues', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Venue>(Collections.VENUES);
    const venues = await collection.find({}).toArray();
    res.json(venues);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get venue by ID
app.get('/api/venues/:id', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Venue>(Collections.VENUES);
    const venue = await collection.findOne({ id: req.params.id });
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json(venue);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create venue
app.post('/api/venues', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Venue>(Collections.VENUES);
    const newVenue: Venue = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await collection.insertOne(newVenue as any);
    res.status(201).json(newVenue);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PAYMENTS API
// ============================================

// Get all payments
app.get('/api/payments', async (req: Request, res: Response) => {
  try {
    const { teamId, playerId, status } = req.query;
    const collection = await getCollection<Payment>(Collections.PAYMENTS);
    
    const filter: any = {};
    if (teamId) filter.teamId = teamId;
    if (playerId) filter.playerId = playerId;
    if (status) filter.status = status;
    
    const payments = await collection.find(filter).sort({ dueDate: -1 }).toArray();
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment
app.put('/api/payments/:id', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Payment>(Collections.PAYMENTS);
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    
    const result = await collection.updateOne(
      { id: req.params.id },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ message: 'Payment updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TRANSACTIONS API
// ============================================

// Get all transactions
app.get('/api/transactions', async (req: Request, res: Response) => {
  try {
    const { teamId, category } = req.query;
    const collection = await getCollection<Transaction>(Collections.TRANSACTIONS);
    
    const filter: any = {};
    if (teamId) filter.teamId = teamId;
    if (category) filter.category = category;
    
    const transactions = await collection.find(filter).sort({ date: -1 }).toArray();
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
app.post('/api/transactions', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Transaction>(Collections.TRANSACTIONS);
    const newTransaction: Transaction = {
      ...req.body,
      date: req.body.date || new Date().toISOString(),
    };
    
    await collection.insertOne(newTransaction as any);
    res.status(201).json(newTransaction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TEAMS API
// ============================================

// Get team profile
app.get('/api/teams/:id', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<TeamProfile>(Collections.TEAMS);
    const team = await collection.findOne({ id: req.params.id });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create team
app.post('/api/teams', async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<TeamProfile>(Collections.TEAMS);
    const newTeam: TeamProfile = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await collection.insertOne(newTeam as any);
    res.status(201).json(newTeam);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// POLLS API
// ============================================

// Get all polls
app.get('/api/polls', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.query;
    const collection = await getCollection<Poll>(Collections.POLLS);
    
    const filter: any = {};
    if (teamId) filter.teamId = teamId;
    
    const polls = await collection.find(filter).sort({ createdAt: -1 }).toArray();
    res.json(polls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vote on poll
app.post('/api/polls/:id/vote', async (req: Request, res: Response) => {
  try {
    const { optionId, userId } = req.body;
    const collection = await getCollection<Poll>(Collections.POLLS);
    
    const poll = await collection.findOne({ id: req.params.id });
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Check if user already voted
    if ((poll as any).voters?.includes(userId)) {
      return res.status(400).json({ error: 'User already voted' });
    }
    
    // Update vote count
    const options = (poll as any).options.map((opt: any) => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );
    
    await collection.updateOne(
      { id: req.params.id },
      { 
        $set: { options, totalVotes: (poll as any).totalVotes + 1 },
        $push: { voters: userId }
      }
    );
    
    res.json({ message: 'Vote recorded successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Sahada API Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
