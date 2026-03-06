/**
 * Deep Linking Configuration
 * Handles sahada:// and https://sahada.app URLs
 * Synced with web App.tsx screen routes
 */

import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from '../types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['sahada://', 'https://sahada.app', 'https://www.sahada.app'],
  config: {
    screens: {
      // Auth
      Welcome: 'welcome',
      Login: 'login',
      Register: 'register',
      TeamSetup: 'team-setup',
      PhoneAuth: 'phone-auth',
      JoinTeam: {
        path: 'join/:inviteCode?',
        parse: { inviteCode: (inviteCode: string) => inviteCode ?? '' },
      },

      // Main tabs
      MainTabs: {
        screens: {
          Dashboard: 'dashboard',
          Matches: 'matches',
          Team: 'team',
          Profile: 'profile',
        },
      },

      // Match
      MatchDetails: { path: 'match/:matchId', parse: { matchId: (id: string) => id } },
      MatchCreate: 'match/create',
      MatchAnalysis: { path: 'match/:matchId/analysis', parse: { matchId: (id: string) => id } },

      // Venue
      VenueDetails: { path: 'venue/:venueId', parse: { venueId: (id: string) => id } },
      VenueList: 'venues',
      VenueAdd: 'venue/add',
      VenueCalendar: 'venue/calendar',
      VenueLocationEditor: 'venue/location',
      VenueOwnerDashboard: 'venue/dashboard',
      VenueOwnerOnboarding: 'venue/onboarding',
      VenueSettings: 'venue/settings',
      VenueAnalytics: 'venue/analytics',
      VenueFinancialReports: 'venue/financial',

      // Profile
      ProfileDetails: { path: 'user/:userId', parse: { userId: (id: string) => id } },
      EditProfile: 'edit-profile',
      CreateProfile: 'create-profile',
      Settings: 'settings',
      Subscription: 'subscription',

      // Team
      TeamList: 'team/list',
      TeamManagement: 'team/manage',
      TeamChat: 'team/chat',
      MemberManagement: 'members',

      // Admin
      Admin: 'admin',
      Notifications: 'notifications',
      Polls: 'polls',
      Leaderboard: 'leaderboard',

      // Scout
      ScoutDashboard: 'scout',
      ScoutReports: 'scout/reports',
      TalentPool: 'scout/talent',

      // Captain
      CaptainDashboard: 'captain',
      CaptainBookingFlow: 'captain/booking',
      CaptainOutbox: 'captain/outbox',

      // Member
      MemberHome: 'member',
      MemberOnboarding: 'member/onboarding',
      MemberPayments: 'member/payments',
      MemberMatchDetails: { path: 'member/match/:matchId', parse: { matchId: (id: string) => id } },
      MemberMatchHub: { path: 'member/hub/:matchId', parse: { matchId: (id: string) => id } },

      // Financial
      FinancialReports: 'financial',
      DebtList: 'debts',
      PaymentLedger: 'ledger',
      ReservationPaymentHub: 'payment-hub',

      // Reservations
      Booking: 'booking',
      ReservationManagement: 'reservations',
      ReservationDetails: 'reservation/details',
      ReserveSystem: 'reserve',
      MyReservations: 'my-reservations',
      CustomerManagement: 'customers',

      // Business pack
      AuditLog: 'audit',
      RecurringManagement: 'recurring',
      CashRegister: 'cash',
      MaintenanceCenter: 'maintenance',
      BroadcastCenter: 'broadcast',

      // Communication
      WhatsAppIntegration: 'whatsapp',
      MessageLogs: 'messages',

      // Other
      Attendance: 'attendance',
      LineupManager: 'lineup',
      SquadShareWizard: 'squad-share',
      Tournament: 'tournament',
    },
  },
};

// Kullanım (giriş yapılmış olmalı):
// sahada://match/m123  → Maç detayı
// sahada://venue/v1    → Saha detayı
// sahada://user/7      → Profil detayı
// sahada://captain     → Kaptan paneli
// sahada://member      → Üye paneli
// sahada://join/ABC123 → Takıma katıl
