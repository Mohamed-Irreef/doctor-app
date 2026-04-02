/**
 * InputField — Enhanced text input with animated focus border
 * Features: animated focus ring (150ms), accessible label, error state
 */
import React, { useRef, useState } from 'react';
import {
  View, TextInput, Text, StyleSheet, TextInputProps,
  ViewStyle, Animated,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Radius, Spacing } from '../constants/Spacing';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export default function InputField({ label, error, containerStyle, icon, iconRight, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const borderColor = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    props.onFocus?.({} as any);
    Animated.timing(borderColor, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const onBlur = () => {
    setFocused(false);
    props.onBlur?.({} as any);
    Animated.timing(borderColor, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const animatedBorderColor = borderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? Colors.error : Colors.border, Colors.focusBorder],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <Animated.View style={[
        styles.inputContainer,
        { borderColor: animatedBorderColor },
        focused && styles.inputFocused,
        error ? styles.inputError : null,
      ]}>
        {icon && <View style={styles.iconLeft}>{icon}</View>}
        <TextInput
          style={[styles.input, Typography.body1]}
          placeholderTextColor={Colors.textTertiary}
          {...props}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
      </Animated.View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm - 2,
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputFocused: {
    backgroundColor: Colors.primaryUltraLight,
  },
  inputError: {
    borderColor: Colors.error,
  },
  iconLeft: {
    marginRight: Spacing.sm + 2,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Colors.text,
    fontSize: 15,
  },
  errorText: {
    color: Colors.error,
    ...Typography.caption,
    marginTop: 5,
    marginLeft: 2,
  },
});
