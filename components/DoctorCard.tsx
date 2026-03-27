import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Star } from 'lucide-react-native';

interface DoctorCardProps {
  doctor: any;
  onPress: () => void;
  style?: ViewStyle;
}

export default function DoctorCard({ doctor, onPress, style }: DoctorCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.container, style]}>
      <Image source={{ uri: doctor.image }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[Typography.body1, styles.name]} numberOfLines={1}>{doctor.name}</Text>
          <View style={styles.ratingContainer}>
            <Star color="#F59E0B" fill="#F59E0B" size={12} />
            <Text style={styles.ratingText}>{doctor.rating}</Text>
          </View>
        </View>
        
        <Text style={[Typography.body2, styles.specialization]}>{doctor.specialization}</Text>
        
        <View style={styles.footerRow}>
          <Text style={styles.experience}>{doctor.experience}</Text>
          <Text style={styles.fee}>${doctor.fee}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.lightGray,
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 4,
  },
  specialization: {
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  experience: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fee: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
