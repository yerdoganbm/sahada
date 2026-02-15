/**
 * Welcome Screen
 * First screen users see - converted from web version
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' }}
      style={styles.container}
      blurRadius={3}
    >
      <View style={styles.overlay} />
      
      {/* Top Badge */}
      <Animated.View style={[styles.topBadge, { opacity: fadeAnim }]}>
        <View style={styles.badgeIndicator} />
        <Text style={styles.badgeText}>10.000+ OYUNCU SAHADA</Text>
      </Animated.View>

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Icon name="soccer" size={64} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>SAHADA</Text>
        <Text style={styles.subtitle}>
          Maç Senin. <Text style={styles.subtitleBold}>Kontrol Sende.</Text>
        </Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {[
            'Kadro kurmak artık işkence değil',
            'Borç takibi için birebir',
            'İstatistiklerimi görmek motive ediyor',
          ].map((feature, index) => (
            <Animated.View
              key={index}
              style={[
                styles.featureItem,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 20],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Icon name="check-circle" size={16} color={colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
            accessibilityLabel="Hemen başla, giriş yap"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Hemen Başla</Text>
            <Icon name="arrow-right" size={20} color={colors.secondary} />
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('TeamSetup')}
              activeOpacity={0.8}
              accessibilityLabel="Takımını sıfırdan kur"
              accessibilityRole="button"
            >
              <Icon name="plus-circle-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.secondaryButtonText}>Takım Kur</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Icon name="qrcode-scan" size={18} color={colors.text.secondary} />
              <Text style={styles.secondaryButtonText}>Koda Katıl</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Devam ederek Hizmet Şartları ve Gizlilik Politikasını kabul etmiş sayılırsınız.
        </Text>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  topBadge: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  badgeText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xxl,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: `${colors.primary}40`,
    transform: [{ rotate: '-3deg' }],
  },
  title: {
    fontSize: 48,
    fontWeight: typography.fontWeight.extraBold,
    color: colors.text.primary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  subtitleBold: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  featuresContainer: {
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    marginLeft: spacing.sm,
  },
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.secondary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.sm,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    marginLeft: spacing.sm,
  },
  footer: {
    color: colors.text.disabled,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal * typography.fontSize.xs,
  },
});
