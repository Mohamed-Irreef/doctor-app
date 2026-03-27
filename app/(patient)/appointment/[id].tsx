import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, MessageCircle, Phone, Star, Video } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionModal from '../../../components/ActionModal';
import ButtonPrimary from '../../../components/ButtonPrimary';
import { Colors } from '../../../constants/Colors';
import { COMPLETED_APPOINTMENTS, UPCOMING_APPOINTMENTS } from '../../../constants/MockData';

const ALL_APPTS = [...UPCOMING_APPOINTMENTS, ...COMPLETED_APPOINTMENTS];

export default function AppointmentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appt = ALL_APPTS.find(a => a.id === id) ?? ALL_APPTS[0];
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelledModal, setCancelledModal] = useState(false);

  const isUpcoming = appt.status === 'Upcoming';
  const isCompleted = appt.status === 'Completed';

  const typeColor = appt.type === 'Video' ? '#0EA5E9' : appt.type === 'Chat' ? '#7C3AED' : '#16A34A';
  const typeBg = appt.type === 'Video' ? '#E0F2FE' : appt.type === 'Chat' ? '#F3E8FF' : '#DCFCE7';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Cancel Confirmation */}
      <ActionModal
        visible={cancelModal}
        type="confirm"
        title="Cancel Appointment?"
        message="Are you sure you want to cancel this appointment? Cancellations within 2 hours may not be refunded."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep It"
        onConfirm={() => { setCancelModal(false); setCancelledModal(true); }}
        onCancel={() => setCancelModal(false)}
      />
      {/* Cancelled Success */}
      <ActionModal
        visible={cancelledModal}
        type="error"
        title="Appointment Cancelled"
        message="Your appointment has been cancelled. Refund will be processed in 5–7 business days."
        confirmLabel="Back to Appointments"
        onConfirm={() => { setCancelledModal(false); router.back(); }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, {
          backgroundColor: isUpcoming ? '#EFF6FF' : isCompleted ? '#F0FDF4' : '#FFFBEB',
          borderColor: isUpcoming ? '#BFDBFE' : isCompleted ? '#BBF7D0' : '#FDE68A',
        }]}>
          <View style={[styles.statusDot, {
            backgroundColor: isUpcoming ? Colors.primary : isCompleted ? '#16A34A' : '#D97706'
          }]} />
          <Text style={[styles.statusText, {
            color: isUpcoming ? Colors.primary : isCompleted ? '#16A34A' : '#D97706'
          }]}>{appt.status}</Text>
        </View>

        {/* Doctor Card */}
        <View style={styles.docCard}>
          <Image source={{ uri: appt.doctor.image }} style={styles.docAvatar} />
          <View style={styles.docInfo}>
            <Text style={styles.docName}>{appt.doctor.name}</Text>
            <Text style={styles.docSpec}>{appt.doctor.specialization}</Text>
            <View style={styles.ratingRow}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{appt.doctor.rating} · {appt.doctor.reviews} reviews</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push({ pathname: '/(patient)/doctor/[id]', params: { id: appt.doctor.id } })}>
            <Text style={styles.profileBtnText}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Appointment Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Appointment Details</Text>
          {[
            { icon: Calendar, label: 'Date', value: appt.date },
            { icon: Clock,    label: 'Time', value: appt.time },
          ].map((row, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={styles.infoIcon}><row.icon color={Colors.primary} size={18} /></View>
              <View>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: typeBg }]}>
              {appt.type === 'Video' ? <Video color={typeColor} size={18} /> : <MapPin color={typeColor} size={18} />}
            </View>
            <View>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={[styles.infoValue, { color: typeColor }]}>{appt.type ?? 'In-person'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons for Upcoming */}
        {isUpcoming && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryAction}>
              <Phone size={18} color={Colors.primary} />
              <Text style={styles.secondaryActionText}>Call Clinic</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction}>
              <MessageCircle size={18} color={Colors.primary} />
              <Text style={styles.secondaryActionText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction}>
              <MapPin size={18} color={Colors.primary} />
              <Text style={styles.secondaryActionText}>Directions</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Review prompt for Completed */}
        {isCompleted && (
          <TouchableOpacity
            style={styles.reviewPrompt}
            onPress={() => router.push({ pathname: '/(patient)/review', params: { doctorId: appt.doctor.id } })}
            activeOpacity={0.85}
          >
            <Star size={20} color="#F59E0B" fill="#F59E0B" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.reviewPromptTitle}>How was your experience?</Text>
              <Text style={styles.reviewPromptSub}>Rate & review Dr. {appt.doctor.name.split(' ')[1]}</Text>
            </View>
            <ArrowLeft color={Colors.primary} size={18} style={{ transform: [{ rotateY: '180deg' }] }} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        {isUpcoming ? (
          <>
            <ButtonPrimary
              title="Join Consultation"
              onPress={() => router.push('/(patient)/consultation')}
              style={{ flex: 1, marginRight: 10, paddingVertical: 18 }}
            />
            <ButtonPrimary
              title="Cancel"
              type="outline"
              onPress={() => setCancelModal(true)}
              style={{ paddingHorizontal: 20, paddingVertical: 18 }}
              textStyle={{ color: Colors.error }}
            />
          </>
        ) : isCompleted ? (
          <ButtonPrimary
            title="Book Again"
            onPress={() => router.push({ pathname: '/(patient)/booking/[id]', params: { id: appt.doctor.id } })}
            style={{ flex: 1, paddingVertical: 18 }}
          />
        ) : null}
      </View>
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
  scroll: { padding: 20, paddingBottom: 120 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    borderWidth: 1, marginBottom: 20,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusText: { fontSize: 14, fontWeight: '700' },
  docCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  docAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12, backgroundColor: Colors.border },
  docInfo: { flex: 1 },
  docName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  docSpec: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, color: Colors.textSecondary },
  profileBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  profileBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 14 },
  infoIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: Colors.text },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  secondaryAction: {
    flex: 1, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14,
    paddingVertical: 14, marginHorizontal: 4, borderWidth: 1, borderColor: Colors.border,
  },
  secondaryActionText: { fontSize: 11, fontWeight: '600', color: Colors.primary, marginTop: 6 },
  reviewPrompt: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7',
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A',
  },
  reviewPromptTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  reviewPromptSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface,
    flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.border, elevation: 10,
  },
});
