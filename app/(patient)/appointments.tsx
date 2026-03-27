import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Video, Calendar, MessageSquare, XCircle, Clock, MapPin } from 'lucide-react-native';
import { UPCOMING_APPOINTMENTS } from '../../constants/MockData';
import { useRouter } from 'expo-router';

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState(UPCOMING_APPOINTMENTS);
  const router = useRouter();

  const renderCard = ({ item }: { item: typeof UPCOMING_APPOINTMENTS[0] }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: item.doctor.image }} style={styles.avatar} />
          <View style={styles.docInfo}>
            <Text style={styles.docName}>{item.doctor.name}</Text>
            <Text style={styles.docSpec}>{item.doctor.specialization}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.type}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Calendar size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.time}</Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} activeOpacity={0.8}>
            <Video size={16} color={Colors.surface} />
            <Text style={[styles.actionBtnText, { color: Colors.surface }]}>Start Video Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} activeOpacity={0.8}>
            <Calendar size={16} color={Colors.primary} />
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} activeOpacity={0.8} onPress={() => router.push('/(patient)/consultation')}>
            <MessageSquare size={16} color={Colors.primary} />
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} activeOpacity={0.8}>
            <XCircle size={16} color={Colors.error} />
            <Text style={[styles.actionBtnText, { color: Colors.error }]}>Cancel Meet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upcoming Consultations</Text>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No Upcoming Appointments</Text>
            <Text style={styles.emptySub}>You have no scheduled video consultations.</Text>
          </View>
        }
        renderItem={renderCard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    alignItems: 'center', justifyContent: 'center'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  listContent: { padding: 20 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14, backgroundColor: Colors.lightGray },
  docInfo: { flex: 1 },
  docName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  docSpec: { fontSize: 13, fontWeight: '500', color: Colors.primary },
  badge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 16 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  actionBtn: {
    width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, gap: 8,
  },
  primaryBtn: { backgroundColor: Colors.primary },
  secondaryBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  dangerBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
});
