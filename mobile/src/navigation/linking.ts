/**
 * Deep Linking Configuration
 * Handles sahada:// and https://sahada.app URLs
 */

import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from '../types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['sahada://', 'https://sahada.app', 'https://www.sahada.app'],
  config: {
    screens: {
      Welcome: 'welcome',
      Login: 'login',
      TeamSetup: 'team-setup',
      MainTabs: {
        screens: {
          Dashboard: 'dashboard',
          Matches: 'matches',
          Team: 'team',
          Profile: 'profile',
        },
      },
      MatchDetails: {
        path: 'match/:matchId',
        parse: {
          matchId: (matchId: string) => matchId,
        },
      },
      VenueDetails: {
        path: 'venue/:venueId',
        parse: {
          venueId: (venueId: string) => venueId,
        },
      },
      Profile: {
        path: 'user/:userId?',
        parse: {
          userId: (userId: string) => userId || undefined,
        },
      },
      Settings: 'settings',
      MatchCreate: 'match/create',
      Admin: 'admin',
    },
  },
};

// Example usage:
// WhatsApp message: "Maça gel! sahada://match/m123"
// Opens app directly to match details
