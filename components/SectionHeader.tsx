/**
 * SectionHeader — Section title with "See All" link + ChevronRight icon
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';

interface Props {
  title: string;
  onPressSeeAll?: () => void;
  style?: ViewStyle;
}

export default function SectionHeader({ title, onPressSeeAll, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {onPressSeeAll && (
        <TouchableOpacity
          onPress={onPressSeeAll}
          activeOpacity={0.7}
          style={styles.seeAllRow}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.seeAll}>See All</Text>
          <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    fontSize: 18,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAll: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '600',
  },
});
