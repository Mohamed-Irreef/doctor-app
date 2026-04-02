/**
 * StatCard — Dashboard stat display component
 * Shows an icon bubble, large value, and a label below
 * Used in Doctor Dashboard
 */
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/Colors";
import { Shadows } from "../constants/Shadows";
import { Radius, Spacing } from "../constants/Spacing";
import { Typography } from "../constants/Typography";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  iconBg?: string;
  iconColor?: string;
  delay?: number;
}

export default function StatCard({
  icon,
  value,
  label,
  iconBg = Colors.primaryLight,
  delay = 0,
}: StatCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        damping: 16,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[styles.card, { opacity, transform: [{ translateY }] }]}
    >
      <View style={[styles.iconBubble, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    minHeight: 118,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(30,58,138,0.08)",
    ...Shadows.card,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },
  value: {
    ...Typography.h3,
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 3,
  },
  label: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    color: Colors.textSecondary,
  },
});
