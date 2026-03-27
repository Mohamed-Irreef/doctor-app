import { useRouter } from 'expo-router';
import { Calendar, Check, Clock, MessageSquare, Video, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const APPOINTMENTS = {
  Upcoming: [
    { id: 'u1', name: 'Ravi Kumar', age: 34, time: '09:00 AM', date: 'Today', type: 'Video Consult', status: 'Upcoming', image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80' },
    { id: 'u2', name: 'Priya Sharma', age: 28, time: '10:30 AM', date: 'Tomorrow', type: 'In-person', status: 'Upcoming', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' },
    { id: 'u3', name: 'Arjun Mehta', age: 45, time: '02:00 PM', date: '29 Oct 2026', type: 'Chat Consult', status: 'Upcoming', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
  ],
  Pending: [
    { id: 'p1', name: 'Sunita Verma', age: 52, time: '11:00 AM', date: 'Tomorrow', type: 'Video Consult', status: 'Pending', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=100&q=80' },
    { id: 'p2', name: 'Kiran Nair', age: 30, time: '03:30 PM', date: 'Tomorrow', type: 'In-person', status: 'Pending', image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80' },
  ],
  Completed: [
    { id: 'c1', name: 'Vikram Pillai', age: 61, time: '09:30 AM', date: '20 Oct 2026', type: 'Video Consult', status: 'Completed', image: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=100&q=80' },
    { id: 'c2', name: 'Meena Joshi', age: 39, time: '12:00 PM', date: '18 Oct 2026', type: 'Chat Consult', status: 'Completed', image: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=100&q=80' },
  ],
};

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Upcoming:  { bg: '#DBEAFE', text: Colors.primary },
  Pending:   { bg: '#FEF3C7', text: '#D97706' },
  Completed: { bg: '#DCFCE7', text: '#16A34A' },
};

const TABS = ['Upcoming', 'Pending', 'Completed'] as const;
type Tab = typeof TABS[number];

export default function DoctorAppointmentsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Upcoming');
  const router = useRouter();
  const data = APPOINTMENTS[activeTab];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={Typography.h2}>Appointments</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>No appointments found.</Text>}
        renderItem={({ item }) => {
          const badge = BADGE_COLORS[item.status];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/(doctor)/appointment/[id]', params: { id: item.id } })}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Image source={{ uri: item.image }} style={styles.avatar} />
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={[Typography.caption, { color: Colors.primary, marginBottom: 4 }]}>{item.type}</Text>
                  <View style={styles.metaRow}>
                    <Calendar size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{item.date}</Text>
                    <Clock size={13} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{item.time}</Text>
                  </View>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>{item.status}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.cardFooter}>
                {activeTab === 'Pending' && (
                  <>
                    <TouchableOpacity style={styles.rejectBtn}>
                      <X color={Colors.error} size={16} />
                      <Text style={[styles.actionText, { color: Colors.error }]}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptBtn}>
                      <Check color={Colors.surface} size={16} />
                      <Text style={[styles.actionText, { color: Colors.surface }]}>Accept</Text>
                    </TouchableOpacity>
                  </>
                )}
                {activeTab === 'Upcoming' && (
                  <>
                    <TouchableOpacity style={styles.outlineBtn}>
                      <Text style={[styles.actionText, { color: Colors.primary }]}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => router.push('/(doctor)/consultation')}
                    >
                      <Video color={Colors.surface} size={16} />
                      <Text style={[styles.actionText, { color: Colors.surface }]}>Start Consult</Text>
                    </TouchableOpacity>
                  </>
                )}
                {activeTab === 'Completed' && (
                  <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]}>
                    <MessageSquare color={Colors.primary} size={16} />
                    <Text style={[styles.actionText, { color: Colors.primary }]}>View Summary</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabText: { fontWeight: '600', fontSize: 13, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  empty: { textAlign: 'center', marginTop: 40, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14, backgroundColor: Colors.lightGray },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primary },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  actionText: { fontSize: 13, fontWeight: '700' },
});
