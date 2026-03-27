import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, FileText, MessageSquare, Pill, Video } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ButtonPrimary from '../../../components/ButtonPrimary';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';

const MOCK_PATIENTS: Record<string, any> = {
  sc1: { name: 'Ravi Kumar',    age: 34, phone: '+91 98765 43210', type: 'Video Consult', date: 'Today',       time: '09:00 AM', status: 'Upcoming',  image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80' },
  sc2: { name: 'Priya Sharma',  age: 28, phone: '+91 94321 00987', type: 'In-person',     date: 'Today',       time: '10:30 AM', status: 'Upcoming',  image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80' },
  sc3: { name: 'Arjun Mehta',   age: 45, phone: '+91 77777 88888', type: 'Chat Consult',  date: 'Today',       time: '02:00 PM', status: 'Upcoming',  image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
  u1:  { name: 'Ravi Kumar',    age: 34, phone: '+91 98765 43210', type: 'Video Consult', date: 'Today',       time: '09:00 AM', status: 'Upcoming',  image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80' },
  u2:  { name: 'Priya Sharma',  age: 28, phone: '+91 94321 00987', type: 'In-person',     date: 'Tomorrow',    time: '10:30 AM', status: 'Upcoming',  image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80' },
  p1:  { name: 'Sunita Verma',  age: 52, phone: '+91 80000 11111', type: 'Video Consult', date: 'Tomorrow',    time: '11:00 AM', status: 'Pending',   image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80' },
  c1:  { name: 'Vikram Pillai', age: 61, phone: '+91 91234 56789', type: 'Video Consult', date: '20 Oct 2026', time: '09:30 AM', status: 'Completed', image: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=200&q=80' },
};

const REPORTS = [
  { id: 'r1', name: 'Blood Test Report.pdf', size: '1.2 MB', date: 'Oct 18, 2026' },
  { id: 'r2', name: 'ECG Scan Results.pdf',  size: '0.8 MB', date: 'Oct 15, 2026' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Upcoming:  { bg: '#DBEAFE', text: Colors.primary },
  Pending:   { bg: '#FEF3C7', text: '#D97706' },
  Completed: { bg: '#DCFCE7', text: '#16A34A' },
};

export default function DoctorAppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [notes, setNotes] = useState('');

  const patient = MOCK_PATIENTS[id ?? 'u1'] ?? MOCK_PATIENTS['u1'];
  const badge = STATUS_COLORS[patient.status] ?? STATUS_COLORS['Upcoming'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Patient Info Card */}
        <View style={styles.patientCard}>
          <Image source={{ uri: patient.image }} style={styles.avatar} />
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientMeta}>Age: {patient.age}</Text>
            <Text style={styles.patientMeta}>{patient.phone}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusText, { color: badge.text }]}>{patient.status}</Text>
          </View>
        </View>

        {/* Appointment Meta */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Appointment Info</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <View style={[styles.metaIcon, { backgroundColor: '#EFF6FF' }]}>
                <Calendar size={18} color={Colors.primary} />
              </View>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{patient.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <View style={[styles.metaIcon, { backgroundColor: '#F0FDF4' }]}>
                <Clock size={18} color='#16A34A' />
              </View>
              <Text style={styles.metaLabel}>Time</Text>
              <Text style={styles.metaValue}>{patient.time}</Text>
            </View>
            <View style={styles.metaItem}>
              <View style={[styles.metaIcon, { backgroundColor: '#FDF4FF' }]}>
                <Video size={18} color='#9333EA' />
              </View>
              <Text style={styles.metaLabel}>Type</Text>
              <Text style={styles.metaValue}>{patient.type}</Text>
            </View>
          </View>
        </View>

        {/* Uploaded Reports */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Uploaded Reports</Text>
          {REPORTS.map(report => (
            <View key={report.id} style={styles.reportRow}>
              <View style={styles.reportIcon}>
                <FileText size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportName}>{report.name}</Text>
                <Text style={styles.reportMeta}>{report.size} · {report.date}</Text>
              </View>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Doctor's Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add consultation notes..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionBtnOutline} onPress={() => router.push('/(doctor)/consultation')}>
            <MessageSquare color={Colors.primary} size={18} />
            <Text style={[styles.actionText, { color: Colors.primary }]}>Start Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnOutline}>
            <Video color='#9333EA' size={18} />
            <Text style={[styles.actionText, { color: '#9333EA' }]}>Video Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnOutline}>
            <Pill color='#16A34A' size={18} />
            <Text style={[styles.actionText, { color: '#16A34A' }]}>Prescribe</Text>
          </TouchableOpacity>
        </View>

        <ButtonPrimary title="Save Notes" onPress={() => {}} style={{ marginHorizontal: 20, marginBottom: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  scrollContent: { padding: 20, paddingBottom: 40 },
  patientCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, marginRight: 16, backgroundColor: Colors.lightGray },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  patientMeta: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem: { alignItems: 'center', gap: 6 },
  metaIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  metaLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  metaValue: { fontSize: 13, fontWeight: '700', color: Colors.text },
  reportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12 },
  reportIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  reportName: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  reportMeta: { fontSize: 11, color: Colors.textSecondary },
  viewBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  notesInput: {
    backgroundColor: Colors.background, borderRadius: 12, padding: 14,
    fontSize: 14, color: Colors.text, minHeight: 100, textAlignVertical: 'top',
    borderWidth: 1, borderColor: Colors.border,
  },
  actionsSection: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  actionText: { fontSize: 12, fontWeight: '700' },
});
