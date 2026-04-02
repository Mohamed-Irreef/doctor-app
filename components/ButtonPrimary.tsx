/**
 * ButtonPrimary — Enhanced primary action button
 * Props:
 *  - type: primary | secondary | outline | ghost
 *  - size: sm | md | lg
 *  - iconLeft / iconRight: React.ReactNode
 *  - loading / disabled
 */
import React from 'react';
import { Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Radius, Spacing } from '../constants/Spacing';
import { Shadows } from '../constants/Shadows';
import AnimatedCard from './AnimatedCard';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  type?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export default function ButtonPrimary({
  title,
  onPress,
  loading,
  disabled,
  style,
  textStyle,
  type = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
}: Props) {
  const isPrimary = type === 'primary';
  const isSecondary = type === 'secondary';
  const isOutline = type === 'outline';
  const isGhost = type === 'ghost';

  const sizeStyle = size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;
  const textVariant = size === 'sm' ? Typography.buttonSm : Typography.button;

  const buttonStyle = [
    styles.button,
    sizeStyle,
    isPrimary && styles.primary,
    isSecondary && styles.secondary,
    isOutline && styles.outline,
    isGhost && styles.ghost,
    disabled && styles.disabled,
    isPrimary && !disabled && (Shadows.button as ViewStyle),
    isPrimary && { backgroundColor: 'transparent', overflow: 'hidden' as const },
    style,
  ];

  const textColor = isPrimary
    ? Colors.textInverse
    : (isOutline || isSecondary) ? Colors.primary
    : Colors.textSecondary;

  return (
    <AnimatedCard
      onPress={onPress}
      disabled={disabled || loading}
      scaleValue={0.97}
      style={buttonStyle}
    >
      {isPrimary && !disabled && (
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary || isSecondary ? Colors.textInverse : Colors.primary} />
      ) : (
        <View style={styles.content}>
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
          <Text style={[textVariant, { color: textColor }, textStyle]}>{title}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm },

  // Sizes
  sizeSm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  sizeMd: { paddingVertical: 14, paddingHorizontal: Spacing.lg },
  sizeLg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },

  // Variants
  primary: { backgroundColor: Colors.primary },
  secondary: { 
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  outline: {
    backgroundColor: Colors.primaryUltraLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  disabled: { 
    opacity: 0.7,
    backgroundColor: Colors.border,
    borderColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
});
