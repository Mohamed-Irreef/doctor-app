import { useRouter } from 'expo-router';
import { Activity, ArrowRight, Bell, Briefcase, DollarSign, Switch, Users, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SectionHeader from '../../components/SectionHeader';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useAuthStore } from '../../store/authStore';

const SCHEDULE = [
  { id: 'sc1', name: 'Ravi Kumar', time: '09:00 AM', date: 'Today', type: 'Video Consult', image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80' },
  { id: 'sc2', name: 'Priya Sharma', time: '10:30 AM', date: 'Today', type: 'In-person', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' },
  { id: 'sc3', name: 'Arjun Mehta', time: '02:00 PM', date: 'Today', type: 'Chat Consult', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
];

const STATS = [
  { label: "Today's Appts", value: '12', icon: Users,       color: Colors.primary, bg: '#DBEAFE' },
  { label: 'Earnings',       value: '₹8,400', icon: DollarSign, color: '#16A34A',    bg: '#DCFCE7' },
  { label: 'Pending',        value: '4',    icon: Activity,   color: '#9333EA',    bg: '#F3E8FF' },
];

const QUICK_ACTIONS = [
  { label: 'Manage Slots',  icon: Zap,       route: '/(doctor)/availability' as const, bg: '#EFF6FF', fg: Colors.primary },
  { label: 'Appointments',  icon: Briefcase, route: '/(doctor)/appointments' as const, bg: '#F0FDF4', fg: '#16A34A' },
  { label: 'Start Consult', icon: ArrowRight, route: '/(doctor)/consultation' as const, bg: '#FDF4FF', fg: '#9333EA' },
];

export default function DoctorDashboardScreen() {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/images/profile.png')}
              style={styles.avatar}
            />
            <View>
              <Text style={[Typography.body2, { color: Colors.textSecondary }]}>{greeting()},</Text>
              <Text style={Typography.h3}>{user?.name ?? 'Doctor'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* Availability Toggle */}
            <TouchableOpacity
              style={[styles.onlineBadge, !isOnline && styles.offlineBadge]}
              onPress={() => setIsOnline(v => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.onlineDot, !isOnline && styles.offlineDot]} />
              <Text style={[styles.onlineText, !isOnline && styles.offlineText]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifBtn}>
              <Bell color={Colors.text} size={22} />
              <View style={styles.badge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <s.icon color={s.color} size={20} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={[Typography.caption, { textAlign: 'center' }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quickCard, { backgroundColor: a.bg }]}
              onPress={() => router.push(a.route)}
              activeOpacity={0.8}
            >
              <a.icon color={a.fg} size={20} />
              <Text style={[styles.quickLabel, { color: a.fg }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <SectionHeader title="Today's Schedule" onPressSeeAll={() => router.push('/(doctor)/appointments')} />
          {SCHEDULE.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.scheduleCard}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/(doctor)/appointment/[id]', params: { id: item.id } })}
            >
              <View style={styles.timePillWrap}>
                <Text style={styles.timePill}>{item.time}</Text>
              </View>
              <View style={styles.divider} />
              <Image source={{ uri: item.image }} style={styles.patientAvatar} />
              <View style={styles.patientInfo}>
                <Text style={[Typography.body1, { fontWeight: '700' }]}>{item.name}</Text>
                <Text style={[Typography.caption, { color: Colors.primary }]}>{item.type}</Text>
              </View>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => router.push('/(doctor)/consultation')}
              >
                <Text style={styles.startBtnText}>Start</Text>
                <ArrowRight size={14} color={Colors.surface} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 24,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.border },
  onlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#86EFAC',
  },
  offlineBadge: { backgroundColor: '#F1F5F9', borderColor: Colors.border },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  offlineDot: { backgroundColor: Colors.textSecondary },
  onlineText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  offlineText: { color: Colors.textSecondary },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  badge: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 24, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  quickRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 28 },
  quickCard: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  section: { paddingHorizontal: 20 },
  scheduleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  timePillWrap: { alignItems: 'center' },
  timePill: { fontSize: 11, fontWeight: '700', color: Colors.primary, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  divider: { width: 1, height: 36, backgroundColor: Colors.border, marginHorizontal: 12 },
  patientAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: Colors.border },
  patientInfo: { flex: 1 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4,
  },
  startBtnText: { color: Colors.surface, fontSize: 12, fontWeight: '700' },
});
