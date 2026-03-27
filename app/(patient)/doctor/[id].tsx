import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { getDoctorById } from '../../../services/api';
import { useFavoritesStore } from '../../../store/favoritesStore';
import ButtonPrimary from '../../../components/ButtonPrimary';
import { DoctorCardSkeleton } from '../../../components/SkeletonLoader';
import { ArrowLeft, Heart, Star, Clock, Users, MapPin, ChevronDown } from 'lucide-react-native';
import type { Doctor, Review } from '../../../types';

const { width } = Dimensions.get('window');

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', userName: 'Rahul T.', userImage: 'https://avatar.iran.liara.run/public/12', rating: 5, comment: 'Dr. Sharma is absolutely amazing. He listened patiently and gave a very thorough diagnosis.', date: 'Oct 10, 2026' },
  { id: 'r2', userName: 'Ananya S.', userImage: 'https://avatar.iran.liara.run/public/64', rating: 4, comment: 'Very professional and caring. I felt comfortable throughout the consultation.', date: 'Sep 22, 2026' },
];

const generateCalendarDays = () => {
  const dt = new Date();
  const year = dt.getFullYear();
  const month = dt.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  
  for (let i = 0; i < firstDay; i++) {
    days.push({ id: `empty-${i}`, date: null });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({ id: d.toISOString(), date: i });
  }
  return days;
};

const CALENDAR_DAYS = generateCalendarDays();
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const generateTimeSlots = () => {
  const slots = [];
  let time = 6 * 60; // 6:00 AM
  const end = 24 * 60; // 12:00 AM
  while (time < end) {
    const hours = Math.floor(time / 60);
    const mins = time % 60;
    const ampm = hours >= 12 && hours < 24 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    slots.push(`${displayHour.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${ampm}`);
    time += 30; // 30 mins interval
  }
  return slots;
};
const ALL_SLOTS = generateTimeSlots();

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about');
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [visibleSlots, setVisibleSlots] = useState(9); // 3 rows * 3 items

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getDoctorById(id ?? '');
      if (res.data) setDoctor(res.data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ padding: 20 }}>
          <DoctorCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorState}>
          <Text style={Typography.h3}>Doctor not found.</Text>
          <TouchableOpacity onPress={() => router.back()}><Text style={{ color: Colors.primary, marginTop: 12 }}>Go Back</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const loadMoreSlots = () => {
    setVisibleSlots(prev => Math.min(prev + 12, ALL_SLOTS.length)); // Load next 4 rows (12 slots)
  };

  const favored = isFavorite(doctor.id);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Image */}
        <View style={{ width: '100%', height: width * 0.75, position: 'relative' }}>
          <Image source={{ uri: doctor.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <SafeAreaView edges={['top']} style={styles.headerOverlayBtns}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <ArrowLeft color={Colors.text} size={22} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFavorite(doctor)} style={styles.iconBtn}>
              <Heart size={20} color={favored ? Colors.error : Colors.text} fill={favored ? Colors.error : 'none'} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Info Container */}
        <View style={styles.infoContainer}>
          <Text style={[Typography.h2, { marginBottom: 4 }]}>{doctor.name}</Text>
          <Text style={[Typography.body1, { color: Colors.primary, fontWeight: '500', marginBottom: 16 }]}>{doctor.specialization}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { icon: Star, color: '#D97706', bg: '#FEF3C7', value: String(doctor.rating), label: `${doctor.reviews} Reviews` },
              { icon: Clock, color: '#0EA5E9', bg: '#E0F2FE', value: doctor.experience, label: 'Experience' },
              { icon: Users, color: '#16A34A', bg: '#DCFCE7', value: '1000+', label: 'Patients' },
            ].map((stat, i) => (
              <View key={i} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                  <stat.icon color={stat.color} size={18} fill={i === 0 ? stat.color : 'none'} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <MapPin color={Colors.textSecondary} size={16} />
            <Text style={[Typography.body2, { marginLeft: 8 }]} numberOfLines={1}>{doctor.hospital ?? 'Apollo Hospital, Chennai'}</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['about', 'reviews'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'about' ? 'About' : `Reviews (${doctor.reviews})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'about' ? (
            <>
              <Text style={[Typography.body2, { lineHeight: 24, marginBottom: 28 }]}>{doctor.about}</Text>

              <Text style={[Typography.h3, { marginBottom: 12 }]}>1. Choose Date</Text>
              
              {/* Calendar Component */}
              <View style={styles.calendarCard}>
                <View style={styles.calHeader}>
                   <Text style={styles.calMonthLabel}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
                </View>
                <View style={styles.weekRow}>
                  {WEEKDAYS.map((w, i) => <Text key={i} style={styles.weekdayText}>{w}</Text>)}
                </View>
                <View style={styles.daysGrid}>
                  {CALENDAR_DAYS.map(d => {
                    if (!d.date) return <View key={d.id} style={styles.dayCellEmpty} />;
                    const isSelected = selectedDate === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        style={[styles.dayCell, isSelected && styles.dayCellActive]}
                        onPress={() => { setSelectedDate(d.id); setSelectedSlot(null); }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>{d.date}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Text style={[Typography.h3, { marginBottom: 12, marginTop: 16 }]}>2. Choose Time</Text>
              <View style={styles.slotGrid}>
                {ALL_SLOTS.slice(0, visibleSlots).map((slot, i) => {
                  const isBooked = (i % 4 === 0) || (i % 7 === 0);
                  return (
                    <TouchableOpacity
                      key={slot}
                      disabled={isBooked}
                      style={[
                        styles.slotBtn, 
                        selectedSlot === slot && styles.slotBtnActive,
                        isBooked && styles.slotBtnBooked
                      ]}
                      onPress={() => setSelectedSlot(slot)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.slotText, 
                        selectedSlot === slot && styles.slotTextActive,
                        isBooked && styles.slotTextBooked
                      ]}>{slot}</Text>
                      {isBooked && <Text style={styles.bookedText}>Booked</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {visibleSlots < ALL_SLOTS.length && (
                <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreSlots} activeOpacity={0.7}>
                  <Text style={styles.loadMoreText}>Load More</Text>
                  <ChevronDown color={Colors.primary} size={16} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              {MOCK_REVIEWS.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image source={{ uri: review.userImage }} style={styles.reviewAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.body1, { fontWeight: '600' }]}>{review.userName}</Text>
                      <Text style={Typography.caption}>{review.date}</Text>
                    </View>
                    <View style={styles.reviewRating}>
                      <Star size={12} color="#D97706" fill="#D97706" />
                      <Text style={{ fontSize: 12, fontWeight: '700', marginLeft: 4, color: '#D97706' }}>{review.rating}</Text>
                    </View>
                  </View>
                  <Text style={[Typography.body2, { lineHeight: 22, marginTop: 8 }]}>{review.comment}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.writeReviewBtn}
                onPress={() => router.push({ pathname: '/(patient)/review', params: { doctorId: doctor.id } })}
              >
                <Text style={{ color: Colors.primary, fontWeight: '700' }}>+ Write a Review</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={Typography.body2}>Consultation Fee</Text>
          <Text style={[Typography.h2, { color: Colors.primary }]}>₹{doctor.fee}</Text>
        </View>
        <ButtonPrimary
          title="Book Appointment"
          onPress={() => router.push({ pathname: '/(patient)/booking/[id]', params: { id: doctor.id } })}
          style={{ flex: 1, marginLeft: 24, paddingVertical: 18 }}
          disabled={!selectedSlot || !selectedDate}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 100 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerOverlayBtns: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  infoContainer: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    marginTop: -32, paddingHorizontal: 24, paddingTop: 32,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  statItem: { alignItems: 'center' },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  statLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, backgroundColor: Colors.lightGray, padding: 12, borderRadius: 12 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 24 },
  tabBtn: { flex: 1, paddingBottom: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabText: { fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  
  // Calendar Grid
  calendarCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  calHeader: { marginBottom: 12, alignItems: 'center' },
  calMonthLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weekdayText: { width: `${100/7}%`, textAlign: 'center', fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellEmpty: { width: `${100/7}%`, height: 40 },
  dayCell: { width: `${100/7}%`, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  dayCellActive: { backgroundColor: Colors.primary },
  dayText: { fontSize: 14, fontWeight: '500', color: Colors.text },
  dayTextActive: { color: Colors.surface, fontWeight: '700' },

  // Slot Grid
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  slotBtn: { 
    width: '31%', margin: '1.1%', paddingVertical: 12, borderRadius: 12, 
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, 
    alignItems: 'center', justifyContent: 'center',
  },
  slotBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotBtnBooked: { backgroundColor: Colors.lightGray, borderColor: Colors.border, opacity: 0.6 },
  slotText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  slotTextActive: { color: Colors.surface },
  slotTextBooked: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  bookedText: { fontSize: 9, color: Colors.error, marginTop: 4, fontWeight: '600' },
  
  loadMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: Colors.primary, marginRight: 4 },

  reviewCard: { backgroundColor: Colors.lightGray, borderRadius: 16, padding: 16, marginBottom: 16 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: Colors.border },
  reviewRating: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  writeReviewBtn: { alignItems: 'center', paddingVertical: 16, backgroundColor: '#EFF6FF', borderRadius: 16, marginBottom: 8 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface,
    flexDirection: 'row', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
  },
});
