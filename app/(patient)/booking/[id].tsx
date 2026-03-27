import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionModal from '../../../components/ActionModal';
import ButtonPrimary from '../../../components/ButtonPrimary';
import { Colors } from '../../../constants/Colors';
import { DOCTORS } from '../../../constants/MockData';
import { Typography } from '../../../constants/Typography';
import { bookAppointment } from '../../../services/api';

const DATES = [
  { id: '1', day: 'Mon', date: '21', month: 'Oct', available: true },
  { id: '2', day: 'Tue', date: '22', month: 'Oct', available: true },
  { id: '3', day: 'Wed', date: '23', month: 'Oct', available: false },
  { id: '4', day: 'Thu', date: '24', month: 'Oct', available: true },
  { id: '5', day: 'Fri', date: '25', month: 'Oct', available: true },
  { id: '6', day: 'Sat', date: '26', month: 'Oct', available: true },
];

export default function BookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const doctor = DOCTORS.find(d => d.id === id) ?? DOCTORS[0];

  const [selectedDate, setSelectedDate] = useState('24');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  const handleBooking = async () => {
    if (!selectedSlot) return;
    setConfirmModal(false);
    setLoading(true);
    const res = await bookAppointment(doctor.id, `Oct ${selectedDate}`, selectedSlot);
    setLoading(false);
    if (res.status === 'success') setSuccessModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Confirmation Modal */}
      <ActionModal
        visible={confirmModal}
        type="confirm"
        title="Confirm Booking"
        message={`Book ${doctor.name} on Oct ${selectedDate} at ${selectedSlot}?`}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleBooking}
        onCancel={() => setConfirmModal(false)}
      />

      {/* Success Modal */}
      <ActionModal
        visible={successModal}
        type="success"
        title="Appointment Booked!"
        message={`Your appointment with ${doctor.name} has been confirmed. We'll send you a reminder.`}
        confirmLabel="View Appointments"
        onConfirm={() => {
          setSuccessModal(false);
          router.replace('/(patient)/appointments');
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[Typography.h3, { flex: 1, textAlign: 'center' }]}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Doctor Summary */}
        <View style={styles.doctorCard}>
          <View>
            <Text style={Typography.h3}>{doctor.name}</Text>
            <Text style={[Typography.body2, { color: Colors.primary, marginBottom: 8, fontWeight: '500' }]}>{doctor.specialization}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin color={Colors.textSecondary} size={14} />
              <Text style={{ marginLeft: 6, color: Colors.textSecondary, fontSize: 13 }}>New York Medical Center</Text>
            </View>
          </View>
        </View>

        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={[Typography.h3, { marginBottom: 16 }]}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DATES.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.dateCard, selectedDate === item.date && styles.dateCardActive, !item.available && styles.dateCardDisabled]}
                onPress={() => item.available && setSelectedDate(item.date)}
                disabled={!item.available}
                activeOpacity={0.75}
              >
                <Text style={[styles.dayText, selectedDate === item.date && styles.textActive, !item.available && styles.textDisabled]}>{item.day}</Text>
                <Text style={[styles.dateText, selectedDate === item.date && styles.textActive, !item.available && styles.textDisabled]}>{item.date}</Text>
                {!item.available && <Text style={styles.bookedLabel}>Full</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={[Typography.h3, { marginBottom: 16 }]}>Select Time</Text>
          <View style={styles.slotGrid}>
            {doctor.availableSlots.map(slot => (
              <TouchableOpacity
                key={slot}
                style={[styles.slotBtn, selectedSlot === slot && styles.slotBtnActive]}
                onPress={() => setSelectedSlot(slot)}
                activeOpacity={0.75}
              >
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Card */}
        {selectedSlot && (
          <View style={styles.summaryCard}>
            <Text style={[Typography.h3, { marginBottom: 16 }]}>Booking Summary</Text>
            {[
              { icon: Calendar, label: 'Date', value: `Thursday, Oct ${selectedDate}, 2026` },
              { icon: Clock, label: 'Time', value: selectedSlot },
            ].map((row, i) => (
              <View key={i} style={[styles.summaryRow, i === 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.summaryIcon}><row.icon color={Colors.primary} size={18} /></View>
                <View>
                  <Text style={Typography.caption}>{row.label}</Text>
                  <Text style={[Typography.body1, { fontWeight: '600' }]}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={Typography.body2}>Total</Text>
          <Text style={[Typography.h2, { color: Colors.primary }]}>${doctor.fee}</Text>
        </View>
        <ButtonPrimary
          title="Confirm Booking"
          onPress={() => setConfirmModal(true)}
          loading={loading}
          style={{ flex: 1, marginLeft: 24, paddingVertical: 18 }}
          disabled={!selectedSlot}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  scrollContent: { padding: 20, paddingBottom: 120 },
  doctorCard: { backgroundColor: Colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 28 },
  section: { marginBottom: 28 },
  dateCard: {
    width: 64, height: 84, alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface, marginRight: 12,
  },
  dateCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateCardDisabled: { backgroundColor: Colors.lightGray },
  dayText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  dateText: { fontSize: 22, fontWeight: '700', color: Colors.text },
  bookedLabel: { fontSize: 9, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' },
  textActive: { color: Colors.surface },
  textDisabled: { color: '#CBD5E1' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  slotBtn: {
    width: '30%', margin: '1.5%', paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center',
  },
  slotBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotText: { fontWeight: '600', color: Colors.text },
  slotTextActive: { color: Colors.surface },
  summaryCard: { backgroundColor: Colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  summaryIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface,
    flexDirection: 'row', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10,
  },
});
