/**
 * TypeScript Type Definitions
 * Shared types for the mobile app — synced with web types.ts
 */

import { NavigatorScreenParams } from '@react-navigation/native';

// ─── Base Types ────────────────────────────────────────────────────
export type RsvpStatus = 'yes' | 'no' | 'maybe' | 'pending' | 'cancelled';
export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';
export type PlayerRole = 'admin' | 'member' | 'guest' | 'venue_owner' | 'venue_staff' | 'venue_accountant';
export type Role = PlayerRole;
export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';
export type SubscriptionTier = 'free' | 'premium' | 'partner';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'waiting_approval';

// Domain defaults for Sahada workflows
export type MatchCapacity = 12 | 14 | 16;
export type AttendanceStatus = 'YES' | 'NO' | 'MAYBE' | 'CANCELLED';
export type MatchPaymentStatus = 'PAID' | 'PENDING' | 'REFUND';

// ─── Player ────────────────────────────────────────────────────────
export interface Player {
  id: string;
  name: string;
  teamId?: string;
  activeTeamId?: string;
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
  whatsappEnabled?: boolean;
  authzMigrationVersion?: number;
  trialStatus?: 'pending_approval' | 'in_trial' | 'promoted' | 'rejected';
  attributes?: {
    pac: number;
    sho: number;
    pas: number;
    dri: number;
    def: number;
    phy: number;
  };
  // Stats
  goals?: number;
  assists?: number;
  mvpCount?: number;
  matchesPlayed?: number;
  // Scout fields
  scoutReports?: ScoutReport[];
  potentialRating?: number;
  scoutScore?: number;
  lastEvaluationDate?: string;
  // Venue owner
  venueOwnerInfo?: {
    venueIds: string[];
    businessInfo?: {
      companyName?: string;
      taxNumber?: string;
      iban: string;
      bankName: string;
      accountHolder: string;
    };
    commissionRate: number;
    totalRevenue: number;
    totalReservations: number;
    responseTime: number;
  };
}

// ─── Match ─────────────────────────────────────────────────────────
export interface Match {
  id: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  status: MatchStatus;
  score?: string;
  teamId?: string;
  teamName?: string;
  opponent?: string;
  venueId?: string;
  capacity?: MatchCapacity;
  pricePerPerson?: number;
  waitlistEnabled?: boolean;
  goingCount?: number;
  waitlistCount?: number;
  attendees?: Array<{ playerId: string; status: AttendanceStatus }>;
  mvpVotes?: Array<{ playerId: string; voterId: string }>;
  mvpWinner?: string;
  // Payment hub fields
  iban?: string;
  ibanHolder?: string;
  dueAt?: string;
  matchDescription?: string;
}

// ─── Venue ─────────────────────────────────────────────────────────
export interface Venue {
  id: string;
  ownerId?: string;
  name: string;
  location: string;
  district?: string;
  address?: string;
  description?: string;
  pricePerHour: number;
  price?: number;
  rating: number;
  reviewCount?: number;
  image: string;
  images?: string[];
  features: string[];
  phone?: string;
  email?: string;
  capacity?: string;
  status?: 'active' | 'archived' | 'price_update' | 'closed' | 'maintenance' | 'pending_review';
  coordinates?: { latitude: number; longitude: number };
  pricing?: {
    weekdayMorning: number;
    weekdayAfternoon: number;
    weekdayPrime: number;
    weekendMorning: number;
    weekendAfternoon: number;
    weekendPrime: number;
  };
  workingHours?: Record<string, { open: string; close: string; isClosed: boolean }>;
  stats?: {
    totalReservations: number;
    totalRevenue: number;
    averageRating: number;
    occupancyRate: number;
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
  cancellationPolicy?: { freeCancelUntilHours: number; latePenaltyPercent: number };
  venueLocation?: VenueLocation;
}

// ─── Payment ───────────────────────────────────────────────────────
export interface Payment {
  id: string;
  playerId: string;
  playerName: string;
  matchId?: string;
  amount: number;
  dueDate: string;
  status: MatchPaymentStatus | 'paid' | 'pending' | 'failed' | 'waiting_approval' | 'refund';
  date?: string;
  month: string;
  proofUrl?: string;
  proofSubmittedAt?: string;
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

// ─── Team ──────────────────────────────────────────────────────────
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
  foundedYear?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  ownerUserId?: string;
  captainUserId: string;
  memberUserIds: string[];
  createdAt: string;
  avatar?: string;
  description?: string;
  city?: string;
}

export interface TeamInvite {
  id: string;
  teamId: string;
  code: string;
  createdByUserId: string;
  status: 'active' | 'revoked';
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  usesCount: number;
  autoApprove: boolean;
}

export interface TeamJoinRequest {
  id: string;
  teamId: string;
  inviteCode: string;
  userId: string;
  displayName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
  resolvedByUserId?: string;
}

// ─── Poll & Transfer ───────────────────────────────────────────────
export interface Poll {
  id: string;
  question: string;
  options: Array<{ id: string; text: string; votes: number }>;
  totalVotes: number;
  isVoted: boolean;
  expiresAt: string;
  endDate?: string;
  teamId?: string;
  voters?: string[];
  relatedTransferId?: string;
}

export interface TransferRequest {
  id: string;
  playerId: string;
  proposerId: string;
  status: 'pending_captain' | 'voting' | 'approved' | 'rejected';
  pollId?: string;
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

// ─── Reservation ───────────────────────────────────────────────────
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  venueId: string;
  venueName: string;
  teamId?: string;
  teamName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
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
  createdByUserId?: string;
  depositRequired?: boolean;
  depositAmount?: number;
  depositPaidAt?: string;
  holdExpiresAt?: string;
  paymentProofUrl?: string;
  isCaptainFlow?: boolean;
  recurringRuleId?: string;
  source?: 'manual' | 'booking' | 'recurring';
  customerName?: string;
  customerPhone?: string;
  checkInStatus?: 'not_started' | 'ready' | 'checked_in' | 'no_show';
  checkInCode?: string;
}

// ─── Guest Session ─────────────────────────────────────────────────
export interface GuestSession {
  guestId: string;
  displayName: string;
  joinCode: string;
  rsvpStatus?: RsvpStatus;
  createdAt: string;
}

// ─── Notifications ─────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: 'system' | 'match' | 'payment' | 'social';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionScreen?: string;
}

// ─── Waitlist ──────────────────────────────────────────────────────
export type WaitlistStatus = 'waiting' | 'offered' | 'accepted' | 'expired' | 'cancelled';

export interface WaitlistEntry {
  id: string;
  venueId: string;
  venueName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  createdByUserId: string;
  createdByName: string;
  status: WaitlistStatus;
  createdAt: string;
  offeredAt?: string;
  offerExpiresAt?: string;
  acceptedAt?: string;
  cancelledAt?: string;
  reservationId?: string;
}

// ─── Audit ─────────────────────────────────────────────────────────
export interface AuditEvent {
  id: string;
  at: string;
  actorUserId: string;
  actorName: string;
  actorRole: Role;
  entityType: 'reservation' | 'venue' | 'waitlist';
  entityId: string;
  action: string;
  meta?: Record<string, unknown>;
}

// ─── Scout & Talent ────────────────────────────────────────────────
export interface ScoutReport {
  id: string;
  playerId: string;
  scoutId: string;
  scoutName: string;
  date: string;
  matchId?: string;
  technical: { ballControl: number; passing: number; shooting: number; dribbling: number; firstTouch: number };
  physical: { speed: number; stamina: number; strength: number; agility: number };
  mental: { positioning: number; decisionMaking: number; gameReading: number; workRate: number; teamwork: number };
  overallScore: number;
  potential: number;
  recommendation: 'sign_now' | 'extend_trial' | 'watch_more' | 'reject';
  strengths: string[];
  weaknesses: string[];
  detailedNotes: string;
  videoUrl?: string;
  photoUrls?: string[];
}

export interface TalentPoolPlayer {
  id: string;
  name: string;
  age: number;
  position: PlayerPosition;
  contactNumber: string;
  avatar: string;
  discoveredBy: string;
  discoveredDate: string;
  source: 'referral' | 'open_trial' | 'tournament' | 'social_media' | 'other';
  status: 'scouting' | 'in_trial' | 'approved' | 'rejected' | 'signed';
  trialMatchesPlayed: number;
  trialMatchesTotal: number;
  scoutReports: ScoutReport[];
  averageScore?: number;
  potentialRating?: number;
  finalDecision?: 'sign' | 'reject' | 'extend_trial';
  finalDecisionBy?: string;
  finalDecisionDate?: string;
  finalDecisionNotes?: string;
}

// ─── Tournament ────────────────────────────────────────────────────
export interface TournamentTeam {
  id: string;
  name: string;
  logo: string;
  stats: { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number };
}

export interface BracketMatch {
  id: string;
  round: 'quarter' | 'semi' | 'final';
  team1: { id: string; name: string; score?: number } | null;
  team2: { id: string; name: string; score?: number } | null;
  winnerId?: string;
  date: string;
}

// ─── WhatsApp & Messaging ──────────────────────────────────────────
export interface MessageLog {
  id: string;
  type: 'reminder' | 'payment' | 'squad' | 'poll';
  recipient: string;
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
  content: string;
}

export type TemplateKey = 'CONFIRMED' | 'CANCELLED' | 'REMINDER_24H' | 'REMINDER_3H' | 'DEPOSIT_PENDING' | 'MAINTENANCE_NOTICE';

export interface MessageTemplate {
  id: string;
  venueId: string;
  key: TemplateKey;
  title: string;
  body: string;
  createdAt: string;
}

export interface OutboxMessage {
  id: string;
  venueId?: string;
  teamId?: string;
  reservationId?: string;
  toLabel: string;
  phone?: string;
  templateKey?: TemplateKey;
  body: string;
  at: string;
  createdAt: string;
  createdByUserId: string;
  status: 'draft' | 'copied';
}

// ─── Business Pack ─────────────────────────────────────────────────
export type RecurrenceFreq = 'WEEKLY';

export interface RecurringRule {
  id: string;
  venueId: string;
  venueName: string;
  fieldId?: string;
  createdByUserId: string;
  customerName: string;
  customerPhone?: string;
  startDate: string;
  endDate?: string;
  freq: RecurrenceFreq;
  byWeekdays: number[];
  startTime: string;
  durationMinutes: number;
  autoConfirm: boolean;
  pricingMode: 'fixed' | 'bucket';
  fixedPrice?: number;
  paymentMode: 'invoice_monthly' | 'pay_each';
  status: 'active' | 'paused' | 'cancelled';
  createdAt: string;
  lastGeneratedDate?: string;
}

export type CashMethod = 'cash' | 'card' | 'bank_transfer';

export interface CashEntry {
  id: string;
  venueId: string;
  at: string;
  actorUserId: string;
  actorRole: Role;
  reservationId?: string;
  customerName?: string;
  method: CashMethod;
  amount: number;
  note?: string;
}

export interface DayClose {
  id: string;
  venueId: string;
  date: string;
  closedAt: string;
  closedByUserId: string;
  totals: { cash: number; card: number; bank_transfer: number; total: number };
  entriesCount: number;
  note?: string;
}

export interface MaintenanceTask {
  id: string;
  venueId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  repeatsWeekly?: boolean;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  createdAt: string;
  createdByUserId: string;
}

export interface IssueTicket {
  id: string;
  venueId: string;
  title: string;
  description?: string;
  photoUrl?: string;
  status: 'open' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  createdByUserId: string;
}

// ─── Location / Maps ───────────────────────────────────────────────
export interface LatLng {
  lat: number;
  lng: number;
}

export type ServiceArea = { type: 'radius'; meters: number } | { type: 'polygon'; points: LatLng[] };

export interface VenueLocation {
  placeId?: string;
  formattedAddress?: string;
  latLng?: LatLng;
  addressComponents?: { city?: string; district?: string; neighborhood?: string; postalCode?: string };
  entrance?: LatLng;
  parking?: LatLng;
  meetup?: LatLng;
  serviceArea?: ServiceArea;
  verifiedAt?: string;
  verifiedBy?: 'gps_owner_check';
  source?: 'places_autocomplete' | 'manual_pin';
}

// ─── Captain Wallet ────────────────────────────────────────────────
export type MoneyMethod = 'cash' | 'eft' | 'card';
export type LedgerDirection = 'member_to_captain' | 'captain_to_venue' | 'refund_to_captain' | 'captain_to_member';

export interface LedgerEntry {
  id: string;
  at: string;
  teamId?: string;
  reservationId?: string;
  matchId?: string;
  actorUserId: string;
  direction: LedgerDirection;
  fromUserId?: string;
  toUserId?: string;
  method: MoneyMethod;
  amount: number;
  note?: string;
  proofUrl?: string;
}

export type CollectionMode = 'split_equal' | 'manual';
export type CaptainPayPlan = 'deposit_now_rest_later' | 'all_cash_on_site' | 'all_eft' | 'pay_later_hold';

export interface CaptainPaymentPlan {
  id: string;
  teamId: string;
  reservationId: string;
  plan: CaptainPayPlan;
  collectionMode: CollectionMode;
  createdAt: string;
  currency: 'TRY';
  totalPrice: number;
  depositRequired: boolean;
  depositAmount: number;
  depositMethod?: MoneyMethod;
  restAmount: number;
  restMethodPreference?: 'cash' | 'eft' | 'any';
  dueAt?: string;
  status: 'draft' | 'collecting' | 'ready_to_pay' | 'paid_to_venue' | 'refunded' | 'cancelled';
  depositPaidAt?: string;
}

/** Single proof/receipt entry attached to a contribution */
export interface ProofEntry {
  id: string;
  url: string;
  type: 'image' | 'pdf' | 'link';
  method: MoneyMethod;
  amount: number;
  note?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewNote?: string;
}

export interface MemberContribution {
  id: string;
  teamId: string;
  reservationId: string;
  memberUserId: string;
  memberName: string;
  expectedAmount: number;
  paidAmount: number;
  status: 'unpaid' | 'partial' | 'paid';
  lastUpdatedAt: string;
  proofUrl?: string;
  proofNote?: string;
  proofHistory?: ProofEntry[];
}

export interface CaptainPayoutProfile {
  captainUserId: string;
  iban?: string;
  accountName?: string;
  bankName?: string;
  phoneForCash?: string;
  note?: string;
}

export interface MatchRSVP {
  id: string;
  teamId?: string;
  reservationId?: string;
  matchId?: string;
  userId: string;
  status: 'going' | 'not_going' | 'maybe' | 'unset';
  updatedAt: string;
  note?: string;
}

export interface MemberProfile {
  userId: string;
  fullName?: string;
  phone?: string;
  createdAt: string;
  status: 'active' | 'incomplete';
}

export interface InboxItem {
  id: string;
  at: string;
  userId: string;
  teamId?: string;
  reservationId?: string;
  title: string;
  body: string;
  status: 'unread' | 'read';
}

// ─── Navigation ────────────────────────────────────────────────────
export type RootStackParamList = {
  Welcome: undefined;
  Login: { userType?: 'venue_owner' | 'venue_staff'; pendingJoinCode?: string; pendingRole?: 'captain' | 'member' } | undefined;
  Register: { prefillPhone?: string; inviteCode?: string };
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  MatchDetails: { matchId: string };
  VenueDetails: { venueId: string };
  VenueList: undefined;
  ProfileDetails: { userId: string };
  Settings: undefined;
  TeamSwitch: undefined;
  TeamSetup: { prefillPhone?: string } | undefined;
  MatchCreate: undefined;
  Admin: undefined;
  Notifications: undefined;
  Polls: undefined;
  EditProfile: undefined;
  Leaderboard: undefined;
  JoinTeam: { inviteCode?: string } | undefined;
  MemberManagement: undefined;
  ScoutReports: undefined;
  TalentPool: undefined;
  ScoutDashboard: undefined;
  LineupManager: undefined;
  DebtList: undefined;
  CreateProfile: undefined;
  CustomerManagement: undefined;
  ReservationDetails: { reservationId?: string } | undefined;
  VenueCalendar: undefined;
  VenueOwnerDashboard: undefined;
  FinancialReports: undefined;
  VenueFinancialReports: undefined;
  ReservationManagement: undefined;
  Attendance: undefined;
  Booking: { venueId?: string; venueName?: string } | undefined;
  PaymentLedger: { myPaymentsOnly?: boolean } | undefined;
  WhatsAppIntegration: undefined;
  VenueAdd: undefined;
  Subscription: undefined;
  Tournament: undefined;
  ReserveSystem: undefined;
  SquadShareWizard: undefined;
  MessageLogs: undefined;
  TeamChat: undefined;
  MatchAnalysis: { matchId: string };
  // Captain / Member screens
  CaptainBookingFlow: undefined;
  CaptainOutbox: undefined;
  CaptainDashboard: undefined;
  MemberOnboarding: undefined;
  MemberPayments: undefined;
  MemberHome: undefined;
  MemberMatchDetails: { matchId: string };
  MemberMatchHub: { matchId: string };
  PhoneAuth: { pendingJoinCode?: string; pendingRole?: string } | undefined;
  // Team management
  TeamList: undefined;
  TeamManagement: undefined;
  // Venue screens
  VenueLocationEditor: { venueId: string; venueName?: string } | undefined;
  VenueOwnerOnboarding: { phone?: string } | undefined;
  VenueSettings: undefined;
  VenueAnalytics: undefined;
  // Business pack
  AuditLog: undefined;
  RecurringManagement: undefined;
  CashRegister: undefined;
  MaintenanceCenter: undefined;
  BroadcastCenter: undefined;
  // Payment
  ReservationPaymentHub: { reservationId?: string } | undefined;
  MyReservations: undefined;
  // Venue owner EFT inbox
  VenueIncomingEft: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Matches: undefined;
  Team: undefined;
  Profile: undefined;
};
