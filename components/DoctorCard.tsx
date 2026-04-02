/**
 * DoctorCard — Enhanced horizontal scrolling doctor card
 * Features: online dot indicator, soft shadow, improved rating, entry animation option
 */
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Shadows } from '../constants/Shadows';
import { Radius, Spacing } from '../constants/Spacing';

interface DoctorCardProps {
  doctor: any;
  onPress: () => void;
  style?: ViewStyle;
  isOnline?: boolean;
}

export default function DoctorCard({ doctor, onPress, style, isOnline = true }: DoctorCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, style]}
    >
      {/* Doctor Image */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: doctor.image }} style={styles.image} />
        {/* Online Indicator */}
        <View style={[styles.onlineDot, { backgroundColor: isOnline ? Colors.doctorOnline : Colors.doctorOffline }]}>
          <View style={styles.onlineDotInner} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Name + Rating Row */}
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{doctor.name}</Text>
          <View style={styles.ratingBadge}>
            <Star color={Colors.ratingGold} fill={Colors.ratingGold} size={10} />
            <Text style={styles.ratingText}>{doctor.rating}</Text>
          </View>
        </View>

        {/* Specialization */}
        <Text style={styles.specialization} numberOfLines={1}>{doctor.specialization}</Text>

        {/* Footer – Experience + Fee */}
        <View style={styles.footerRow}>
          <Text style={styles.experience}>{doctor.experience}</Text>
          <Text style={styles.fee}>₹{doctor.fee}</Text>
        </View>

        {/* Available Tag */}
        <View style={styles.availRow}>
          <View style={styles.availDot} />
          <Text style={styles.availText}>Available Today</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 130,
    backgroundColor: Colors.lightGray,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: Spacing.sm + 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    ...Typography.label,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ratingBg,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    gap: 3,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warningPressed,
  },
  specialization: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  experience: {
    ...Typography.caption,
    color: Colors.textTertiary,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  fee: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  availText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.successPressed,
  },
});
