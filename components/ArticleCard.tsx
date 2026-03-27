import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';

interface ArticleCardProps {
  article: any;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function ArticleCard({ article, onPress, style }: ArticleCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.container, style]}>
      <Image source={{ uri: article.image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={[Typography.body1, styles.title]} numberOfLines={2}>{article.title}</Text>
        <Text style={[Typography.caption, styles.description]} numberOfLines={2}>{article.description}</Text>
        <Text style={styles.readTime}>{article.readTime}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: 100,
    height: 100,
    backgroundColor: Colors.lightGray,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  readTime: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.primary,
  },
});
