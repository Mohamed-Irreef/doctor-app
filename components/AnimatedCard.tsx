/**
 * AnimatedCard — Enhanced pressable wrapper with spring press + entry animation
 * Props:
 *  - withShadow: applies card shadow preset
 *  - withEntryAnimation: fade + translateY on mount
 *  - scaleValue: press scale (default 0.97)
 *  - entryDelay: ms delay for entry animation
 */
import React, { useEffect, useRef } from "react";
import {
    Pressable,
    PressableProps,
    Animated as RNAnimated,
    StyleProp,
    ViewStyle,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { Shadows } from "../constants/Shadows";

interface Props extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  withShadow?: boolean;
  withEntryAnimation?: boolean;
  entryDelay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnimatedCard({
  children,
  style,
  scaleValue = 0.97,
  onPress,
  disabled,
  withShadow = true,
  withEntryAnimation = false,
  entryDelay = 0,
  ...props
}: Props) {
  const scale = useSharedValue(1);

  // Entry animation
  const opacity = useRef(
    new RNAnimated.Value(withEntryAnimation ? 0 : 1),
  ).current;
  const translateY = useRef(
    new RNAnimated.Value(withEntryAnimation ? 10 : 0),
  ).current;

  useEffect(() => {
    if (!withEntryAnimation) return;
    RNAnimated.parallel([
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay: entryDelay,
        useNativeDriver: true,
      }),
      RNAnimated.spring(translateY, {
        toValue: 0,
        delay: entryDelay,
        damping: 18,
        stiffness: 220,
        useNativeDriver: true,
      } as any),
    ]).start();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(scaleValue, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const shadowStyle = withShadow ? Shadows.card : {};

  if (withEntryAnimation) {
    return (
      <RNAnimated.View
        style={[{ opacity, transform: [{ translateY }] }, shadowStyle]}
      >
        <AnimatedPressable
          style={[animatedStyle, style]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          disabled={disabled}
          {...props}
        >
          {children}
        </AnimatedPressable>
      </RNAnimated.View>
    );
  }

  return (
    <AnimatedPressable
      style={[animatedStyle, shadowStyle as any, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
