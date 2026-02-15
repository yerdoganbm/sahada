
export enum Tab {
  Home = 'Home',
  Matches = 'Matches',
  Team = 'Team',
  Profile = 'Profile'
}

export type ScreenName = 'welcome' | 'login' | 'joinTeam' | 'teamSetup' | 'createProfile' | 'dashboard' | 'matches' | 'team' | 'profile' | 'editProfile' | 'matchDetails' | 'matchCreate' | 'payments' | 'admin' | 'members' | 'venues' | 'venueDetails' | 'venueAdd' | 'lineupManager' | 'squadShare' | 'settings' | 'leaderboard' | 'financialReports' | 'debtList' | 'subscription' | 'polls' | 'booking' | 'tournament' | 'whatsappCenter' | 'attendance' | 'reserveSystem' | 'messageLogs' | 'notifications' | 'venueOwnerDashboard' | 'reservationManagement' | 'reservationDetails' | 'venueCalendar' | 'venueFinancialReports' | 'venueSettings' | 'customerManagement' | 'scoutDashboard' | 'scoutReports' | 'talentPool';

export type SubscriptionTier = 'free' | 'premium' | 'partner';

/** Domain: Attendance. YES/NO/MAYBE + sonradan CANCELLED. */
export type RsvpStatus = 'yes' | 'maybe' | 'no' | 'pending' | 'cancelled';

export interface TeamProfile {
  id: string;
  name: string;
  shortName: string;
  colors: [string, string]; // Primary and Secondary hex colors
  foundedYear: string;
  logo: string;
  inviteCode: string; // New field for joining
  founderName?: string; // Kurucu adı
  founderEmail?: string; // Kurucu e-postası
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
  role?: 'admin' | 'member' | 'guest' | 'venue_owner';
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
  // SCOUTING & TRIAL PROCESS FIELDS
  referredBy?: string; // ID of the member who referred this player
  trialStatus?: 'pending_approval' | 'in_trial' | 'rejected'; // Trial phase status
  contactNumber?: string; // Contact information for guest players
  
  // SCOUT EVALUATION FIELDS
  scoutReports?: ScoutReport[]; // Tüm scout raporları
  potentialRating?: number; // 1-10 (gelecek potansiyeli)
  scoutScore?: number; // 0-100 (toplam scout puanı)
  lastEvaluationDate?: string;
  
  // VENUE OWNER FIELDS
  venueOwnerInfo?: {
    venueIds: string[]; // Sahip olduğu sahalar
    businessInfo?: {
      companyName?: string;
      taxNumber?: string;
      iban: string;
      bankName: string;
      accountHolder: string;
    };
    commissionRate: number; // %15, %20 gibi
    totalRevenue: number;
    totalReservations: number;
    responseTime: number; // Ortalama yanıt süresi (dakika)
  };
}

/** Domain: Match capacity 12 | 14 | 16. Kadro dolunca WAITLIST. */
export type MatchCapacity = 12 | 14 | 16;

export interface Match {
  id: string;
  date: string;
  time: string;
  location: string;
  venueId?: string;
  opponent?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  score?: string;
  pricePerPerson: number;
  /** Capacity: 12, 14, or 16 (default 14). */
  capacity?: MatchCapacity;
  attendees?: {
    playerId: string;
    status: RsvpStatus;
  }[];
  mvpVotes?: {
    playerId: string;
    voterId: string;
  }[];
  mvpWinner?: string;
}

/** Domain: Payment. PAID | PENDING | REFUND. */
export interface Payment {
  id: string;
  playerId: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'waiting_approval' | 'refund';
  date?: string;
  proofUrl?: string;
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
  ownerId?: string; // Saha sahibinin ID'si
  name: string;
  district: string;
  address: string;
  image: string;
  images?: string[]; // Çoklu fotoğraf
  description?: string;
  price: number;
  rating: number;
  reviewCount?: number;
  status: 'active' | 'archived' | 'price_update' | 'closed' | 'maintenance';
  features: string[];
  phone: string;
  email?: string;
  capacity: string;
  
  // Fiyatlandırma (detaylı)
  pricing?: {
    weekdayMorning: number; // 08:00-12:00
    weekdayAfternoon: number; // 12:00-18:00
    weekdayPrime: number; // 18:00-22:00
    weekendMorning: number;
    weekendAfternoon: number;
    weekendPrime: number;
  };
  
  // Çalışma saatleri
  workingHours?: {
    monday: { open: string; close: string; isClosed: boolean };
    tuesday: { open: string; close: string; isClosed: boolean };
    wednesday: { open: string; close: string; isClosed: boolean };
    thursday: { open: string; close: string; isClosed: boolean };
    friday: { open: string; close: string; isClosed: boolean };
    saturday: { open: string; close: string; isClosed: boolean };
    sunday: { open: string; close: string; isClosed: boolean };
  };
  
  // İstatistikler
  stats?: {
    totalReservations: number;
    totalRevenue: number;
    averageRating: number;
    occupancyRate: number; // %78 gibi
    cancelRate: number;
  };
  
  organizerNotes?: {
    doorCode?: string;
    contactPerson: string;
    contactPhone: string;
    lastUpdate: string;
    customNotes: string;
  };
  priceHistory?: { date: string; price: number; reason: string }[];
  createdAt?: string;
  updatedAt?: string;
}

// Rezervasyon durumu
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// Rezervasyon
export interface Reservation {
  id: string;
  venueId: string;
  venueName: string;
  teamId?: string;
  teamName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // dakika
  price: number;
  status: ReservationStatus;
  participants: number;
  contactPerson: string;
  contactPhone: string;
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'cash' | 'credit_card' | 'bank_transfer';
}

// Saha değerlendirmesi
export interface VenueReview {
  id: string;
  venueId: string;
  teamId: string;
  teamName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  response?: {
    text: string;
    date: string;
  };
}

// Saha istatistikleri
export interface VenueStatistics {
  venueId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string;
  
  reservations: {
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  
  revenue: {
    gross: number;
    commission: number;
    net: number;
  };
  
  occupancy: {
    totalSlots: number;
    bookedSlots: number;
    rate: number; // yüzde
  };
  
  peakHours: {
    hour: number;
    reservationCount: number;
  }[];
  
  topTeams: {
    teamId: string;
    teamName: string;
    reservationCount: number;
    totalSpent: number;
  }[];
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

// Scout & Talent Management Types
export interface ScoutReport {
  id: string;
  playerId: string;
  scoutId: string; // Who made the report
  scoutName: string;
  date: string;
  matchId?: string; // Optional: Which match was evaluated
  
  // Performance Metrics (0-10)
  technical: {
    ballControl: number;
    passing: number;
    shooting: number;
    dribbling: number;
    firstTouch: number;
  };
  
  physical: {
    speed: number;
    stamina: number;
    strength: number;
    agility: number;
  };
  
  mental: {
    positioning: number;
    decisionMaking: number;
    gameReading: number;
    workRate: number;
    teamwork: number;
  };
  
  // Overall Assessment
  overallScore: number; // Auto-calculated from above metrics
  potential: number; // 1-10 (future potential)
  recommendation: 'sign_now' | 'extend_trial' | 'watch_more' | 'reject';
  
  // Notes
  strengths: string[];
  weaknesses: string[];
  detailedNotes: string;
  
  // Video/Photo Evidence
  videoUrl?: string;
  photoUrls?: string[];
}

export interface TalentPoolPlayer {
  id: string;
  name: string;
  age: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  contactNumber: string;
  avatar: string;
  
  // Discovery Info
  discoveredBy: string; // Scout/Member ID
  discoveredDate: string;
  source: 'referral' | 'open_trial' | 'tournament' | 'social_media' | 'other';
  
  // Current Status
  status: 'scouting' | 'in_trial' | 'approved' | 'rejected' | 'signed';
  trialMatchesPlayed: number;
  trialMatchesTotal: number; // e.g., 3 trial matches
  
  // Evaluation
  scoutReports: ScoutReport[];
  averageScore?: number;
  potentialRating?: number;
  
  // Decision
  finalDecision?: 'sign' | 'reject' | 'extend_trial';
  finalDecisionBy?: string; // Admin/Captain ID
  finalDecisionDate?: string;
  finalDecisionNotes?: string;
}

export interface ScoutingCriteria {
  id: string;
  name: string;
  category: 'technical' | 'physical' | 'mental';
  weight: number; // 0-100 (importance weight)
  description: string;
}

