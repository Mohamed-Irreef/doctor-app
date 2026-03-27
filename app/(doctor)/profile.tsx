import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { ChevronDown, ChevronUp, Edit2, Star, LogOut, Camera } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

const SECTIONS = [
  {
    key: 'personal',
    title: 'Personal Information',
    fields: [
      { label: 'Full Name', value: 'Dr. Mohamed Irreef S', key: 'name' },
      { label: 'Phone Number', value: '+91 9361757753', key: 'phone' },
      { label: 'Location', value: 'Chennai, Tamil Nadu', key: 'location' },
    ],
  },
  {
    key: 'clinic',
    title: 'Clinic Details',
    fields: [
      { label: 'Clinic Name', value: 'NiviCare Clinic', key: 'clinic' },
      { label: 'Address', value: '42, Anna Salai, Chennai - 600002', key: 'address' },
      { label: 'Hospital Affiliation', value: 'Apollo Hospital, Chennai', key: 'hospital' },
    ],
  },
  {
    key: 'fee',
    title: 'Consultation Fee',
    fields: [
      { label: 'Video Consult Fee', value: '₹1,500', key: 'videoFee' },
      { label: 'In-person Fee', value: '₹1,500', key: 'clinicFee' },
      { label: 'Chat Consult Fee', value: '₹800', key: 'chatFee' },
    ],
  },
  {
    key: 'availability',
    title: 'Availability Type',
    fields: [
      { label: 'Consultation Modes', value: 'Video, In-person, Chat', key: 'modes' },
      { label: 'Daily Slot Limit', value: '16 patients', key: 'limit' },
      { label: 'Notice Period', value: '30 minutes', key: 'notice' },
    ],
  },
];

export default function DoctorProfileScreen() {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>('personal');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    SECTIONS.forEach(s => s.fields.forEach(f => { init[f.key] = f.value; }));
    return init;
  });

  const toggle = (key: string) => {
    setExpanded(e => e === key ? null : key);
    setEditingSection(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={Typography.h2}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image source={require('../../assets/images/profile.png')} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraBtn}>
              <Camera color={Colors.surface} size={14} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.docName}>{user?.name ?? 'Dr. Mohamed Irreef S'}</Text>
            <Text style={styles.docSpec}>Cardiologist · NiviCare Clinic</Text>
            <View style={styles.ratingRow}>
              <Star color='#FBBF24' fill='#FBBF24' size={14} />
              <Text style={styles.ratingText}>4.9</Text>
              <Text style={styles.ratingCount}>(318 reviews)</Text>
            </View>
          </View>
        </View>

        {/* Editable Sections */}
        {SECTIONS.map(section => (
          <View key={section.key} style={styles.sectionCard}>
            <TouchableOpacity style={styles.sectionRow} onPress={() => toggle(section.key)} activeOpacity={0.8}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionActions}>
                {expanded === section.key && (
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => setEditingSection(editingSection === section.key ? null : section.key)}
                  >
                    <Edit2 color={Colors.primary} size={14} />
                    <Text style={styles.editBtnText}>{editingSection === section.key ? 'Done' : 'Edit'}</Text>
                  </TouchableOpacity>
                )}
                {expanded === section.key
                  ? <ChevronUp color={Colors.textSecondary} size={20} />
                  : <ChevronDown color={Colors.textSecondary} size={20} />
                }
              </View>
            </TouchableOpacity>

            {expanded === section.key && (
              <View style={styles.fieldsContainer}>
                {section.fields.map(field => (
                  <View key={field.key} style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    {editingSection === section.key ? (
                      <TextInput
                        style={styles.fieldInput}
                        value={fieldValues[field.key]}
                        onChangeText={v => setFieldValues(m => ({ ...m, [field.key]: v }))}
                        placeholderTextColor={Colors.textSecondary}
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{fieldValues[field.key]}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/(auth)/login')} activeOpacity={0.8}>
          <LogOut color={Colors.error} size={18} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  scrollContent: { padding: 20, paddingBottom: 50 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  avatarWrap: { position: 'relative', marginRight: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.lightGray },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.surface,
  },
  profileInfo: { flex: 1, gap: 4 },
  docName: { fontSize: 18, fontWeight: '800', color: Colors.text },
  docSpec: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  ratingCount: { fontSize: 12, color: Colors.textSecondary },
  sectionCard: {
    backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  editBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  fieldsContainer: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  fieldRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  fieldValue: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  fieldInput: {
    fontSize: 14, color: Colors.text, fontWeight: '600', backgroundColor: Colors.background,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: Colors.primary,
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
