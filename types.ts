
export enum Tab {
  Home = 'Home',
  Matches = 'Matches',
  Team = 'Team',
  Profile = 'Profile'
}

export type ScreenName = 'welcome' | 'login' | 'phoneAuth' | 'joinTeam' | 'memberOnboarding' | 'teamSetup' | 'createProfile' | 'dashboard' | 'matches' | 'team' | 'profile' | 'editProfile' | 'matchDetails' | 'matchCreate' | 'payments' | 'admin' | 'members' | 'venues' | 'venueDetails' | 'venueAdd' | 'lineupManager' | 'squadShare' | 'settings' | 'leaderboard' | 'financialReports' | 'debtList' | 'subscription' | 'polls' | 'booking' | 'tournament' | 'whatsappCenter' | 'attendance' | 'reserveSystem' | 'messageLogs' | 'notifications' | 'venueOwnerDashboard' | 'reservationManagement' | 'reservationDetails' | 'venueCalendar' | 'venueFinancialReports' | 'venueSettings' | 'customerManagement' | 'scoutDashboard' | 'scoutReports' | 'talentPool' | 'venueOwnerOnboarding' | 'myReservations' | 'auditLog' | 'venueAnalytics' | 'recurringManagement' | 'cashRegister' | 'maintenanceCenter' | 'broadcastCenter' | 'memberMatchHub' | 'captainDashboard' | 'teamManagement' | 'captainBookingFlow' | 'reservationPaymentHub' | 'memberHome' | 'memberMatchDetails' | 'memberPayments' | 'captainOutbox' | 'venueStaffManagement';

export type SubscriptionTier = 'free' | 'premium' | 'partner';

/** Domain: Attendance. YES/NO/MAYBE + sonradan CANCELLED. */
export type RsvpStatus = 'yes' | 'maybe' | 'no' | 'pending' | 'cancelled';

/** All user roles */
export type Role = 'admin' | 'member' | 'guest' | 'venue_owner' | 'venue_staff' | 'venue_accountant';

// ─── Permission matrix ────────────────────────────────────────────────────────
export const PERMS: Record<Role, ScreenName[]> = {
  admin:             ['dashboard','team','matches','payments','admin','members','venues','venueDetails','booking','financialReports','debtList','lineupManager','squadShare','polls','settings','leaderboard','tournament','attendance','matchDetails','matchCreate','editProfile','profile','notifications','whatsappCenter','reserveSystem','messageLogs','subscription','scoutDashboard','talentPool','scoutReports','myReservations'],
  member:            ['dashboard','team','matches','venues','venueDetails','booking','polls','leaderboard','tournament','attendance','matchDetails','editProfile','profile','notifications','settings','myReservations'],
  guest:             ['dashboard','team','venues','venueDetails','profile','notifications','settings'],
  venue_owner:       ['venueOwnerDashboard','reservationManagement','reservationDetails','venueCalendar','venueFinancialReports','venueSettings','customerManagement','auditLog','venueAnalytics','venueStaffManagement','notifications','settings','profile'],
  venue_staff:       ['venueOwnerDashboard','reservationManagement','reservationDetails','venueCalendar','customerManagement','notifications','settings','profile'],
  venue_accountant:  ['venueFinancialReports','venueAnalytics','auditLog','notifications','settings','profile'],
};

// ─── Waitlist ─────────────────────────────────────────────────────────────────
export type WaitlistStatus = 'waiting' | 'offered' | 'accepted' | 'expired' | 'cancelled';

export interface WaitlistEntry {
  id: string;
  venueId: string;
  venueName: string;
  date: string;              // ISO YYYY-MM-DD
  startTime: string;         // "18:00"
  durationMinutes: number;
  createdByUserId: string;
  createdByName: string;
  status: WaitlistStatus;
  createdAt: string;
  offeredAt?: string;
  offerExpiresAt?: string;   // now + 15 dk
  acceptedAt?: string;
  cancelledAt?: string;
  reservationId?: string;    // oluşturulan rezervasyon ID'si
}

// ─── Alternative slot offer ───────────────────────────────────────────────────
export interface AlternativeSlot {
  date: string;
  startTime: string;
  durationMinutes: number;
  price: number;
}

export interface AlternativeSlotOffer {
  id: string;
  proposedByUserId: string;
  proposedAt: string;
  expiresAt: string;          // now + 6h
  alternatives: AlternativeSlot[];
  status: 'offered' | 'accepted' | 'expired' | 'rejected';
  acceptedAlternativeIndex?: number;
  acceptedAt?: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────
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
  role?: Role;
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
  
  // MOCK STATS (gol, asist, MVP, maç sayısı - istatistik ekranları için)
  goals?: number;
  assists?: number;
  mvpCount?: number;
  matchesPlayed?: number;

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
  // PAYMENT HUB fields (opsiyonel, backward-compatible)
  iban?: string;             // Kaptan/takım IBAN (TR33...)
  ibanHolder?: string;       // Hesap sahibi adı
  dueAt?: string;            // ISO date string - ödeme son tarihi
  matchDescription?: string; // Havale açıklaması: "Sahada FC Maç Katılım"
}

/** Domain: Payment. PAID | PENDING | REFUND. */
export interface Payment {
  id: string;
  playerId: string;
  matchId?: string;          // which match this payment is for
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'waiting_approval' | 'refund';
  date?: string;
  proofUrl?: string;
  proofSubmittedAt?: string;
}

/** Guest session — no account, just a name for RSVP */
export interface GuestSession {
  guestId: string;           // local id e.g. "guest_1234"
  displayName: string;
  joinCode: string;
  rsvpStatus?: RsvpStatus;
  createdAt: string;
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
  status: 'active' | 'archived' | 'price_update' | 'closed' | 'maintenance' | 'pending_review';
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
  cancellationPolicy?: { freeCancelUntilHours: number; latePenaltyPercent: number };
  location?: VenueLocation; // LOCATION MODULE
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
  // PRO: kapora & hold
  createdByUserId?: string;
  depositRequired?: boolean;
  depositAmount?: number;
  depositPaidAt?: string;
  holdExpiresAt?: string;             // soft-lock: dolunca slot boşa çıkar
  paymentProofUrl?: string;
  refundedAt?: string;
  refundedAmount?: number;
  penaltyAmount?: number;
  cancellationPolicy?: {
    freeCancelUntilHours: number;
    latePenaltyPercent: number;
  };
  // PRO++
  waitlistEntryId?: string;
  alternativeOffer?: AlternativeSlotOffer;
  // BUSINESS PACK: Recurring
  recurringRuleId?: string;
  source?: 'manual' | 'booking' | 'recurring';
  customerName?: string;
  customerPhone?: string;
  // BUSINESS PACK: Cash
  collectedTotal?: number;
  collectedMethods?: Partial<Record<'cash' | 'card' | 'bank_transfer', number>>;
  balanceDue?: number;
  // BUSINESS PACK: Check-in
  checkInStatus?: 'not_started' | 'ready' | 'checked_in' | 'no_show';
  checkInCode?: string;
  checkInReadyAt?: string;
  checkedInAt?: string;
  noShowAt?: string;
  noShowReason?: string;
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


// ═══════════════════════════════════════════════════════════════
// BUSINESS PACK TYPES
// ═══════════════════════════════════════════════════════════════

// ── Recurring Booking ────────────────────────────────────────
export type RecurrenceFreq = 'WEEKLY';

export interface RecurringRule {
  id: string;
  venueId: string;
  venueName: string;
  fieldId?: string;
  createdByUserId: string;
  customerName: string;
  customerPhone?: string;
  startDate: string;       // YYYY-MM-DD
  endDate?: string;
  freq: RecurrenceFreq;
  byWeekdays: number[];    // 0=Sun…6=Sat
  startTime: string;       // "20:00"
  durationMinutes: number;
  autoConfirm: boolean;
  pricingMode: 'fixed' | 'bucket';
  fixedPrice?: number;
  paymentMode: 'invoice_monthly' | 'pay_each';
  status: 'active' | 'paused' | 'cancelled';
  createdAt: string;
  lastGeneratedDate?: string;
}

// ── Cash Register ─────────────────────────────────────────────
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

// ── Maintenance ───────────────────────────────────────────────
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

// ── Messaging / WhatsApp ──────────────────────────────────────
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
  venueId: string;
  toLabel: string;
  phone?: string;
  templateKey?: TemplateKey;
  body: string;
  createdAt: string;
  createdByUserId: string;
  status: 'draft' | 'copied';
}

// ═══════════════════════════════════════════════════════════════
// LOCATION / MAPS MODULE
// ═══════════════════════════════════════════════════════════════

export interface LatLng {
  lat: number;
  lng: number;
}

export type ServiceArea =
  | { type: 'radius'; meters: number }
  | { type: 'polygon'; points: LatLng[] };

export interface VenueLocation {
  placeId?: string;
  formattedAddress?: string;
  latLng?: LatLng;
  addressComponents?: {
    city?: string;
    district?: string;
    neighborhood?: string;
    postalCode?: string;
  };
  entrance?: LatLng;
  parking?: LatLng;
  meetup?: LatLng;
  serviceArea?: ServiceArea;
  verifiedAt?: string;
  verifiedBy?: 'gps_owner_check';
  source?: 'places_autocomplete' | 'manual_pin';
}

// ═══════════════════════════════════════════════════════════════
// CAPTAIN WALLET + TEAM MODULE
// ═══════════════════════════════════════════════════════════════

export interface Team {
  id: string;
  name: string;
  /** Creator / owner of the team (can reassign captain) */
  ownerUserId?: string;
  /** Active captain — can be changed by owner */
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
  code: string;           // 8 char e.g. "SAHADA24"
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
  /** 'image' | 'pdf' | 'link' */
  type: 'image' | 'pdf' | 'link';
  method: MoneyMethod;
  amount: number;
  note?: string;
  submittedAt: string;
  /** Captain review */
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
  /** Ordered proof history (newest first) */
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

// Member Inbox (opsiyonel — outbox'tan türetilmiş read-only bildirimler)
export interface InboxItem {
  id: string;
  at: string;
  userId: string;       // alıcı üye
  teamId?: string;
  reservationId?: string;
  title: string;
  body: string;
  status: 'unread' | 'read';
}
