/**
 * Venue Details Screen - Saha bilgisi ve rezervasyon (API + fallback)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';
import { getVenue } from '../services/venues';
import type { Venue } from '../types';

type VenueDetailsRouteProp = RouteProp<RootStackParamList, 'VenueDetails'>;

export default function VenueDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<VenueDetailsRouteProp>();
  const venueId = params?.venueId;
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) return;
    let cancelled = false;
    setLoading(true);
    getVenue(venueId).then((v) => {
      if (!cancelled) setVenue(v ?? null);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [venueId]);

  if (!venueId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Saha ID bulunamadı</Text>
      </View>
    );
  }

  if (loading && !venue) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Saha bilgisi yükleniyor...</Text>
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Saha bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saha Detayı</Text>
        <View style={styles.placeholder} />
      </View>

      {venue.image ? (
        <Image source={{ uri: venue.image }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
          <Icon name="soccer-field" size={56} color={colors.text.disabled} />
        </View>
      )}
      <View style={styles.heroOverlay} />

      <View style={styles.content}>
        <Text style={styles.name}>{venue.name}</Text>
        <View style={styles.metaRow}>
          <Icon name="map-marker" size={18} color={colors.primary} />
          <Text style={styles.location}>{venue.location}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Icon name="star" size={18} color={colors.warning} />
            <Text style={styles.statText}>{venue.rating}</Text>
          </View>
          <View style={styles.stat}>
            <Icon name="cash" size={18} color={colors.primary} />
            <Text style={styles.statText}>₺{venue.pricePerHour}/saat</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('Booking', { venueId: venue.id, venueName: venue.name })}
          accessibilityLabel="Rezervasyon yap"
          accessibilityRole="button"
        >
          <Icon name="calendar-check" size={22} color={colors.secondary} />
          <Text style={styles.bookBtnText}>Rezervasyon Yap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  placeholder: { width: 40 },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surface,
  },
  heroImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  heroOverlay: {
    position: 'absolute',
    top: 200 - 60,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.lg,
    marginTop: -20,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  name: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  location: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  bookBtnText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary,
  },
});
