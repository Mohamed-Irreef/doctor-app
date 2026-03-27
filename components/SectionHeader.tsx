import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

interface Props {
  title: string;
  onPressSeeAll?: () => void;
  style?: ViewStyle;
}

export default function SectionHeader({ title, onPressSeeAll, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={Typography.h3}>{title}</Text>
      {onPressSeeAll && (
        <TouchableOpacity onPress={onPressSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>See All</Text>
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
    marginBottom: 16,
  },
  seeAll: {
    ...Typography.body2,
    color: Colors.primary,
    fontWeight: '600',
  },
});
