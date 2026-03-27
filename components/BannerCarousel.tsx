import React, { useEffect, useRef, useState } from 'react';
import {
  View, FlatList, StyleSheet, ViewStyle,
  Dimensions, TouchableOpacity, Animated,
} from 'react-native';

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
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoScroll = () => {
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % data.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, autoScrollInterval);
  };

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data.length]);

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / (ITEM_WIDTH + 16));
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <View style={style}>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH + 16}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollBegin={() => {
          if (timerRef.current) clearInterval(timerRef.current);
        }}
        onMomentumScrollEnd={() => startAutoScroll()}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + 16,
          offset: (ITEM_WIDTH + 16) * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <View style={{ width: ITEM_WIDTH, marginRight: 16 }}>
            {renderItem(item, index)}
          </View>
        )}
        keyExtractor={(_, i) => String(i)}
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {data.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: i, animated: true });
              setActiveIndex(i);
            }}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 3,
  },
  dotActive: {
    width: 20,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
});
