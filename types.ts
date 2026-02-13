
export enum Tab {
  Home = 'Home',
  Matches = 'Matches',
  Team = 'Team',
  Profile = 'Profile'
}

export type ScreenName = 'welcome' | 'login' | 'joinTeam' | 'teamSetup' | 'createProfile' | 'dashboard' | 'matches' | 'team' | 'profile' | 'editProfile' | 'matchDetails' | 'matchCreate' | 'payments' | 'admin' | 'members' | 'venues' | 'venueDetails' | 'venueAdd' | 'lineupManager' | 'squadShare' | 'settings' | 'leaderboard' | 'financialReports' | 'subscription' | 'polls' | 'booking' | 'tournament' | 'whatsappCenter' | 'attendance' | 'reserveSystem' | 'messageLogs' | 'notifications';

export type SubscriptionTier = 'free' | 'premium' | 'partner';

export type RsvpStatus = 'yes' | 'maybe' | 'no' | 'pending';

export interface TeamProfile {
  id: string;
  name: string;
  shortName: string;
  colors: [string, string]; // Primary and Secondary hex colors
  foundedYear: string;
  logo: string;
  inviteCode: string; // New field for joining
}

export interface JoinRequest {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  phone: string;
  avatar: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  rating: number; // 1-10
  reliability: number; // 0-100%
  avatar: string;
  isCaptain?: boolean;
  role?: 'admin' | 'member' | 'guest';
  tier?: SubscriptionTier;
  marketValue?: string; // e.g. "Free Agent" or "1.2k"
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
  opponent?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  score?: string;
  pricePerPerson: number;
}

export interface Payment {
  id: string;
  playerId: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'waiting_approval';
  date?: string;
  proofUrl?: string; // For receipt upload
}

export interface Transaction {
  id: string;
  title: string;
  category: 'gelir' | 'gider' | 'ekipman';
  date: string;
  amount: number;
  description?: string;
  status: 'completed' | 'pending';
}

export interface Venue {
  id: string;
  name: string;
  district: string;
  address: string;
  image: string;
  price: number;
  rating: number;
  status: 'active' | 'archived' | 'price_update';
  features: string[];
  phone: string;
  capacity: string;
  organizerNotes?: {
    doorCode?: string;
    contactPerson: string;
    contactPhone: string;
    lastUpdate: string;
    customNotes: string;
  };
  priceHistory?: { date: string; price: number; reason: string }[];
}

export interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  isVoted: boolean;
  endDate: string;
  relatedTransferId?: string; // Links poll to a transfer request
}

export interface TransferRequest {
  id: string;
  playerId: string;
  proposerId: string;
  status: 'pending_captain' | 'voting' | 'approved' | 'rejected';
  pollId?: string;
}

// Tournament Types
export interface TournamentTeam {
  id: string;
  name: string;
  logo: string;
  stats: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number; // Goals For
    ga: number; // Goals Against
    points: number;
  };
}

export interface BracketMatch {
  id: string;
  round: 'quarter' | 'semi' | 'final';
  team1: { id: string; name: string; score?: number } | null;
  team2: { id: string; name: string; score?: number } | null;
  winnerId?: string;
  date: string;
}

// WhatsApp & Automation Types
export interface MessageLog {
  id: string;
  type: 'reminder' | 'payment' | 'squad' | 'poll';
  recipient: string; // Group name or individual name
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
  content: string;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  content: string;
  variables: string[]; // e.g. ['{tarih}', '{saat}']
}

export interface AutomationRule {
  id: string;
  title: string;
  isEnabled: boolean;
  description: string;
}

// New Types for Chat and Notifications
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface AppNotification {
  id: string;
  type: 'system' | 'match' | 'payment' | 'social';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionScreen?: ScreenName;
}
