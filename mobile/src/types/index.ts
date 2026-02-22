/**
 * TypeScript Type Definitions
 * Shared types for the mobile app
 */

import { NavigatorScreenParams } from '@react-navigation/native';

export type RsvpStatus = 'yes' | 'no' | 'maybe' | 'pending';
export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';
export type PlayerRole = 'admin' | 'member' | 'guest' | 'venue_owner';
export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';
export type SubscriptionTier = 'free' | 'premium' | 'partner';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'waiting_approval';

// Domain defaults for Sahada workflows
export type MatchCapacity = 12 | 14 | 16;
export type AttendanceStatus = 'YES' | 'NO' | 'MAYBE' | 'CANCELLED';
export type MatchPaymentStatus = 'PAID' | 'PENDING' | 'REFUND';

export interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  rating: number;
  reliability: number;
  avatar: string;
  role: PlayerRole;
  tier?: SubscriptionTier;
  isCaptain?: boolean;
  phone?: string;
  email?: string;
  shirtNumber?: number;
  contactNumber?: string;
  referredBy?: string;
  trialStatus?: 'pending_approval' | 'in_trial' | 'promoted' | 'rejected';
  attributes?: {
    pac: number;
    sho: number;
    pas: number;
    dri: number;
    def: number;
    phy: number;
  };
}

export interface Match {
  id: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  status: MatchStatus;
  score?: string;
  teamId?: string;
  venueId?: string;
  capacity?: MatchCapacity;
  waitlistEnabled?: boolean;
  attendees?: Array<{
    playerId: string;
    status: AttendanceStatus;
  }>;
  mvpVotes?: Array<{
    playerId: string;
    voterId: string;
  }>;
  mvpWinner?: string;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  rating: number;
  image: string;
  features: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Payment {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  dueDate: string;
  status: MatchPaymentStatus;
  month: string;
  proofUrl?: string;
  teamId?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: 'aidat' | 'saha_kirasi' | 'ekipman' | 'diger' | 'gelir';
  amount: number;
  date: string;
  description: string;
  teamId?: string;
}

export interface TeamProfile {
  id: string;
  name: string;
  shortName?: string;
  inviteCode?: string;
  logo?: string;
  colors: string[];
  founderName: string;
  founderEmail?: string;
  foundedDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Poll {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  totalVotes: number;
  isVoted: boolean;
  expiresAt: string;
  teamId?: string;
  voters?: string[];
}

export interface JoinRequest {
  id: string;
  name: string;
  position: PlayerPosition;
  phone: string;
  avatar: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Navigation types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  MatchDetails: { matchId: string };
  VenueDetails: { venueId: string };
  VenueList: undefined;
  ProfileDetails: { userId: string };
  Settings: undefined;
  TeamSetup: undefined;
  MatchCreate: undefined;
  Admin: undefined;
  Notifications: undefined;
  Polls: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Matches: undefined;
  Team: undefined;
  Profile: undefined;
};
