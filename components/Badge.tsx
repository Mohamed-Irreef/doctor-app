/**
 * Badge — Reusable status indicator component
 * Variants: success | warning | error | info | neutral | primary | secondary
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Radius, Spacing } from '../constants/Spacing';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'secondary';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  dot?: boolean;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success:   { bg: Colors.successLight,       text: Colors.successPressed,   dot: Colors.success },
  warning:   { bg: Colors.warningLight,       text: Colors.warningPressed,   dot: Colors.warning },
  error:     { bg: Colors.errorLight,         text: Colors.errorPressed,     dot: Colors.error },
  info:      { bg: Colors.infoLight,          text: Colors.info,             dot: Colors.info },
  neutral:   { bg: Colors.surfaceAlt,         text: Colors.textSecondary,    dot: Colors.textDisabled },
  primary:   { bg: Colors.primaryLight,       text: Colors.primaryPressed,   dot: Colors.primary },
  secondary: { bg: Colors.secondaryLight,     text: Colors.secondaryPressed, dot: Colors.secondary },
};

// Map appointment status strings to badge variants
export function getStatusVariant(status?: string): BadgeVariant {
  const s = String(status || '').toLowerCase();
  if (s === 'upcoming' || s === 'confirmed') return 'primary';
  if (s === 'pending') return 'warning';
  if (s === 'completed') return 'success';
  if (s === 'cancelled' || s === 'rejected') return 'error';
  if (s === 'online' || s === 'available') return 'success';
  if (s === 'offline') return 'neutral';
  return 'neutral';
}

export default function Badge({ label, variant = 'neutral', size = 'md', style, dot = false }: BadgeProps) {
  const v = VARIANT_STYLES[variant];
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.container,
      isSmall ? styles.containerSm : styles.containerMd,
      { backgroundColor: v.bg },
      style,
    ]}>
      {dot && (
        <View style={[styles.dot, { backgroundColor: v.dot }]} />
      )}
      <Text style={[
        isSmall ? styles.textSm : styles.textMd,
        { color: v.text },
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
  },
  containerMd: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
  },
  containerSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  textMd: {
    ...Typography.buttonSm,
    fontSize: 12,
    lineHeight: 16,
  },
  textSm: {
    ...Typography.buttonSm,
    fontSize: 10,
    lineHeight: 14,
  },
});
