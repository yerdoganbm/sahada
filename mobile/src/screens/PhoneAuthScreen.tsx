/**
 * Phone Auth Screen
 * Wrapper that redirects to Login screen with pending join params
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../theme';
import { RootStackParamList } from '../types';

type PhoneAuthRouteProp = RouteProp<RootStackParamList, 'PhoneAuth'>;

export default function PhoneAuthScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<PhoneAuthRouteProp>();
  const { user } = useAuth();

  const pendingJoinCode = route.params?.pendingJoinCode;
  const pendingRole = route.params?.pendingRole;

  useEffect(() => {
    // Redirect to Login with the pending params
    navigation.replace('Login', {
      pendingJoinCode,
      pendingRole,
    });
  }, [navigation, pendingJoinCode, pendingRole]);

  // Show a brief loading state while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Yönlendiriliyor...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
});
