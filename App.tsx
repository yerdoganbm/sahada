
import React, { useState, useEffect } from 'react';
import { ScreenName, Venue, Player, Payment, Transaction, SubscriptionTier, RsvpStatus, Match, TransferRequest, Poll, TeamProfile, JoinRequest } from './types';
import { Dashboard } from './screens/Dashboard';
import { TeamList } from './screens/TeamList';
import { MatchDetails } from './screens/MatchDetails';
import { MatchCard } from './components/MatchCard'; 
import { Header } from './components/Header';
import { Icon } from './components/Icon';
import { MOCK_MATCHES, MOCK_VENUES, MOCK_PLAYERS, MOCK_PAYMENTS, MOCK_TRANSACTIONS, MOCK_POLLS } from './constants';
import { PaymentLedger } from './screens/PaymentLedger';
import { AdminDashboard } from './screens/AdminDashboard';
import { MemberManagement } from './screens/MemberManagement';
import { ProfileScreen } from './screens/ProfileScreen';
import { VenueList } from './screens/VenueList';
import { VenueDetails } from './screens/VenueDetails';
import { LineupManager } from './screens/LineupManager';
import { SquadShareWizard } from './screens/SquadShareWizard';
import { Settings } from './screens/Settings';
import { LoginScreen } from './screens/LoginScreen';
import { JoinTeamScreen } from './screens/JoinTeamScreen'; 
import { VenueAdd } from './screens/VenueAdd';
import { CreateProfile } from './screens/CreateProfile';
import { Leaderboard } from './screens/Leaderboard';
import { FinancialReports } from './screens/FinancialReports';
import { MatchCreate } from './screens/MatchCreate';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import {