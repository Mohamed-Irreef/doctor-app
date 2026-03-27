import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export function SkeletonBox({ width = '100%', height = 20, style, borderRadius = 8 }: SkeletonBoxProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

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
      <SkeletonBox height={120} borderRadius={0} />
      <View style={{ padding: 12 }}>
        <SkeletonBox height={16} width="80%" style={{ marginBottom: 8 }} />
        <SkeletonBox height={12} width="60%" style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SkeletonBox height={24} width={60} borderRadius={8} />
          <SkeletonBox height={24} width={40} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

export function ArticleCardSkeleton() {
  return (
    <View style={styles.articleSkeleton}>
      <SkeletonBox width={100} height={100} borderRadius={0} />
      <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
        <SkeletonBox height={14} width="90%" style={{ marginBottom: 6 }} />
        <SkeletonBox height={12} width="70%" style={{ marginBottom: 8 }} />
        <SkeletonBox height={10} width={60} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 3, type = 'article' }: { count?: number; type?: 'article' | 'doctor' }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) =>
        type === 'doctor'
          ? <DoctorCardSkeleton key={i} />
          : <ArticleCardSkeleton key={i} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.border,
  },
  cardSkeleton: {
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 16,
    marginBottom: 16,
  },
  articleSkeleton: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
});
