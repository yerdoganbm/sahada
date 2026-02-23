/**
 * Root Navigator
 * Main navigation structure
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types';

// Auth Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';

// Main App
import MainTabNavigator from './MainTabNavigator';

// Detail Screens
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TeamSetupScreen from '../screens/TeamSetupScreen';
import MatchDetailsScreen from '../screens/MatchDetailsScreen';
import VenueDetailsScreen from '../screens/VenueDetailsScreen';
import VenueListScreen from '../screens/VenueListScreen';
import MatchCreateScreen from '../screens/MatchCreateScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PollsScreen from '../screens/PollsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import JoinTeamScreen from '../screens/JoinTeamScreen';
import MemberManagementScreen from '../screens/MemberManagementScreen';
import ScoutReportsScreen from '../screens/ScoutReportsScreen';
import TalentPoolScreen from '../screens/TalentPoolScreen';
import ScoutDashboardScreen from '../screens/ScoutDashboardScreen';
import LineupManagerScreen from '../screens/LineupManagerScreen';
import DebtListScreen from '../screens/DebtListScreen';
import CreateProfileScreen from '../screens/CreateProfileScreen';
import CustomerManagementScreen from '../screens/CustomerManagementScreen';
import ReservationDetailsScreen from '../screens/ReservationDetailsScreen';
import VenueCalendarScreen from '../screens/VenueCalendarScreen';
import VenueOwnerDashboardScreen from '../screens/VenueOwnerDashboardScreen';
import FinancialReportsScreen from '../screens/FinancialReportsScreen';
import VenueFinancialReportsScreen from '../screens/VenueFinancialReportsScreen';
import ReservationManagementScreen from '../screens/ReservationManagementScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import BookingScreen from '../screens/BookingScreen';
import PaymentLedgerScreen from '../screens/PaymentLedgerScreen';
import WhatsAppIntegrationScreen from '../screens/WhatsAppIntegrationScreen';
import VenueAddScreen from '../screens/VenueAddScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import TournamentScreen from '../screens/TournamentScreen';
import ReserveSystemScreen from '../screens/ReserveSystemScreen';
import SquadShareWizardScreen from '../screens/SquadShareWizardScreen';
import MessageLogsScreen from '../screens/MessageLogsScreen';
import TeamChatScreen from '../screens/TeamChatScreen';
import MatchAnalysisScreen from '../screens/MatchAnalysisScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background.primary,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background.primary },
        presentation: 'card',
        animationEnabled: true,
      }}
    >
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="TeamSetup" component={TeamSetupScreen} />
          <Stack.Screen name="JoinTeam" component={JoinTeamScreen} />
        </>
      ) : (
        // App Stack
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen 
            name="MatchDetails" 
            component={MatchDetailsScreen}
            options={{
              presentation: 'modal',
              animationEnabled: true,
            }}
          />
          <Stack.Screen name="VenueDetails" component={VenueDetailsScreen} />
          <Stack.Screen name="VenueList" component={VenueListScreen} />
          <Stack.Screen name="ProfileDetails" component={ProfileScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Polls" component={PollsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="MatchCreate" component={MatchCreateScreen} />
          <Stack.Screen name="Admin" component={AdminDashboardScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="JoinTeam" component={JoinTeamScreen} />
          <Stack.Screen name="MemberManagement" component={MemberManagementScreen} />
          <Stack.Screen name="ScoutReports" component={ScoutReportsScreen} />
          <Stack.Screen name="TalentPool" component={TalentPoolScreen} />
          <Stack.Screen name="ScoutDashboard" component={ScoutDashboardScreen} />
          <Stack.Screen name="LineupManager" component={LineupManagerScreen} />
          <Stack.Screen name="DebtList" component={DebtListScreen} />
          <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
          <Stack.Screen name="CustomerManagement" component={CustomerManagementScreen} />
          <Stack.Screen name="ReservationDetails" component={ReservationDetailsScreen} />
          <Stack.Screen name="VenueCalendar" component={VenueCalendarScreen} />
          <Stack.Screen name="VenueOwnerDashboard" component={VenueOwnerDashboardScreen} />
          <Stack.Screen name="FinancialReports" component={FinancialReportsScreen} />
          <Stack.Screen name="VenueFinancialReports" component={VenueFinancialReportsScreen} />
          <Stack.Screen name="ReservationManagement" component={ReservationManagementScreen} />
          <Stack.Screen name="Attendance" component={AttendanceScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="PaymentLedger" component={PaymentLedgerScreen} />
          <Stack.Screen name="WhatsAppIntegration" component={WhatsAppIntegrationScreen} />
          <Stack.Screen name="VenueAdd" component={VenueAddScreen} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          <Stack.Screen name="Tournament" component={TournamentScreen} />
          <Stack.Screen name="ReserveSystem" component={ReserveSystemScreen} />
          <Stack.Screen name="SquadShareWizard" component={SquadShareWizardScreen} />
          <Stack.Screen name="MessageLogs" component={MessageLogsScreen} />
          <Stack.Screen name="TeamChat" component={TeamChatScreen} />
          <Stack.Screen name="MatchAnalysis" component={MatchAnalysisScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
