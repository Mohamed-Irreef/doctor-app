/**
 * BannerCarousel — Auto-scrolling hero carousel with animated pill indicators
 * Features: spring-animated active dot, pause on user scroll, auto-resume
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, FlatList, StyleSheet, ViewStyle,
  Dimensions, TouchableOpacity, Animated,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';

interface BannerCarouselProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  autoScrollInterval?: number;
  style?: ViewStyle;
  itemWidth?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BannerCarousel({
  data,
  renderItem,
  autoScrollInterval = 3500,
  style,
  itemWidth,
}: BannerCarouselProps) {
  const ITEM_WIDTH = itemWidth ?? SCREEN_WIDTH - 48;
  const SNAP_INTERVAL = ITEM_WIDTH + Spacing.md;

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated dot widths
  const dotAnimations = useRef(data.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  const animateDots = (nextIndex: number) => {
    data.forEach((_, i) => {
      Animated.spring(dotAnimations[i], {
        toValue: i === nextIndex ? 1 : 0,
        damping: 14,
        stiffness: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  const startAutoScroll = () => {
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % data.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        animateDots(next);
        return next;
      });
    }, autoScrollInterval);
  };

  useEffect(() => {
    startAutoScroll();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [data.length]);

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / SNAP_INTERVAL);
    if (index !== activeIndex && index >= 0 && index < data.length) {
      setActiveIndex(index);
      animateDots(index);
    }
  };

  return (
    <View style={style}>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollBegin={() => {
          if (timerRef.current) clearInterval(timerRef.current);
        }}
        onMomentumScrollEnd={() => startAutoScroll()}
        getItemLayout={(_, index) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <View style={{ width: ITEM_WIDTH, marginRight: Spacing.md }}>
            {renderItem(item, index)}
          </View>
        )}
        keyExtractor={(_, i) => String(i)}
      />

      {/* Animated Pill Indicators */}
      <View style={styles.pagination}>
        {data.map((_, i) => {
          const dotWidth = dotAnimations[i].interpolate({
            inputRange: [0, 1],
            outputRange: [6, 20],
          });
          const dotOpacity = dotAnimations[i].interpolate({
            inputRange: [0, 1],
            outputRange: [0.35, 1],
          });
          return (
            <TouchableOpacity
              key={i}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index: i, animated: true });
                setActiveIndex(i);
                animateDots(i);
              }}
            >
              <Animated.View
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm + 4,
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
