/**
 * Root Navigator
 * Main navigation structure
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { colors } from '../theme';

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
import MatchCreateScreen from '../screens/MatchCreateScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0B0F1A',
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
        cardStyle: { backgroundColor: '#0B0F1A' },
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
          <Stack.Screen name="ProfileDetails" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="MatchCreate" component={MatchCreateScreen} />
          <Stack.Screen name="Admin" component={AdminDashboardScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
