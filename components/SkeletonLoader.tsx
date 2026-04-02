/**
 * SkeletonLoader — Shimmer-animated skeleton loading placeholders
 * Components: SkeletonBox | DoctorCardSkeleton | ArticleCardSkeleton | AppointmentSkeleton | ListSkeleton
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Radius, Spacing } from '../constants/Spacing';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export function SkeletonBox({
  width = '100%',
  height = 20,
  style,
  borderRadius = Radius.sm,
}: SkeletonBoxProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function DoctorCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <SkeletonBox height={130} borderRadius={0} />
      <View style={{ padding: Spacing.sm + 4 }}>
        <SkeletonBox height={14} width="80%" style={{ marginBottom: 6 }} />
        <SkeletonBox height={11} width="55%" style={{ marginBottom: Spacing.sm }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SkeletonBox height={22} width={60} borderRadius={Radius.sm} />
          <SkeletonBox height={22} width={44} borderRadius={Radius.sm} />
        </View>
      </View>
    </View>
  );
}

export function ArticleCardSkeleton() {
  return (
    <View style={styles.articleSkeleton}>
      <SkeletonBox width={100} height={100} borderRadius={0} />
      <View style={{ flex: 1, padding: Spacing.sm + 4, justifyContent: 'space-between' }}>
        <SkeletonBox height={14} width="90%" style={{ marginBottom: 6 }} />
        <SkeletonBox height={12} width="70%" style={{ marginBottom: Spacing.sm }} />
        <SkeletonBox height={10} width={60} />
      </View>
    </View>
  );
}

export function AppointmentSkeleton() {
  return (
    <View style={styles.appointmentSkeleton}>
      <SkeletonBox width={52} height={52} borderRadius={Radius.full} style={{ marginRight: Spacing.md }} />
      <View style={{ flex: 1 }}>
        <SkeletonBox height={15} width="65%" style={{ marginBottom: 6 }} />
        <SkeletonBox height={12} width="45%" style={{ marginBottom: 10 }} />
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <SkeletonBox height={28} width={90} borderRadius={Radius.sm} />
          <SkeletonBox height={28} width={90} borderRadius={Radius.sm} />
        </View>
      </View>
    </View>
  );
}

export function ListSkeleton({
  count = 3,
  type = 'article',
}: {
  count?: number;
  type?: 'article' | 'doctor' | 'appointment';
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) =>
        type === 'doctor' ? (
          <DoctorCardSkeleton key={i} />
        ) : type === 'appointment' ? (
          <AppointmentSkeleton key={i} />
        ) : (
          <ArticleCardSkeleton key={i} />
        )
      )}
    </>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.skeleton,
  },
  cardSkeleton: {
    width: 200,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
  },
  articleSkeleton: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm + 4,
  },
  appointmentSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
});
