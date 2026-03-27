import React from 'react';
import { Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import AnimatedCard from './AnimatedCard';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  type?: 'primary' | 'secondary' | 'outline';
}

export default function ButtonPrimary({ title, onPress, loading, disabled, style, textStyle, type = 'primary' }: Props) {
  const isPrimary = type === 'primary';
  const isOutline = type === 'outline';

  return (
    <AnimatedCard
      onPress={onPress}
      disabled={disabled || loading}
      scaleValue={0.97}
      style={[
        styles.button,
        isPrimary && styles.primary,
        type === 'secondary' && styles.secondary,
        isOutline && styles.outline,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? Colors.primary : Colors.surface} />
      ) : (
        <Text
          style={[
            Typography.button,
            isOutline ? styles.textOutline : styles.textPrimary,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  textPrimary: {
    color: Colors.surface,
  },
  textOutline: {
    color: Colors.text,
  },
});
