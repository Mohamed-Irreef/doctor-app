/**
 * ChipFilter — Animated filter chip for horizontal scroll rows
 * Press: scale 0.95 spring animation
 */
import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import AnimatedCard from './AnimatedCard';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Radius, Spacing } from '../constants/Spacing';

interface ChipFilterProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function ChipFilter({ label, active = false, onPress, style, textStyle }: ChipFilterProps) {
  return (
    <AnimatedCard
      onPress={onPress}
      scaleValue={0.94}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
        style,
      ]}
    >
      <Text style={[
        styles.chipText,
        active ? styles.chipTextActive : styles.chipTextInactive,
        textStyle,
      ]}>
        {label}
      </Text>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  chipInactive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    ...Typography.label,
    fontSize: 13,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  chipTextInactive: {
    color: Colors.textSecondary,
  },
});
