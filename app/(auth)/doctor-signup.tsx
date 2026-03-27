import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { ArrowLeft, User, Phone, Mail, Lock, Eye, EyeOff, ChevronDown, Camera, FileText, CheckCircle, MapPin, DollarSign } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const PrimaryColor = '#2563EB';
const SecondaryColor = '#14B8A6';
const BgColor = '#F9FAFB';

function InputField({ icon: Icon, placeholder, secureTextEntry, keyboardType, showToggle, onToggle, multiline, style }: any) {
  return (
    <View style={[styles.inputContainer, style]}>
      {Icon && <Icon color="#6B7280" size={18} style={styles.inputIcon} />}
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
      />
      {showToggle !== undefined && (
        <TouchableOpacity onPress={onToggle} style={{ padding: 10 }}>
          {showToggle ? <EyeOff color="#6B7280" size={18} /> : <Eye color="#6B7280" size={18} />}
        </TouchableOpacity>
      )}
    </View>
  );
}

function Dropdown({ icon: Icon, placeholder, value }: any) {
  return (
    <View style={styles.inputContainer}>
      {Icon && <Icon color="#6B7280" size={18} style={styles.inputIcon} />}
      <Text style={[styles.input, { color: value ? '#111827' : '#9CA3AF', paddingTop: 14 }]}>
        {value || placeholder}
      </Text>
      <ChevronDown color="#6B7280" size={18} style={{ marginRight: 16 }} />
    </View>
  );
}

export default function DoctorSignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Dummy specs and availability
  const SPECIALTIES = ['Cardiologist', 'Dentist', 'Neurologist', 'Pediatrician', 'Dermatologist'];
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(['Cardiologist']);
  const [availType, setAvailType] = useState('both'); // online, offline, both

  const toggleSpec = (s: string) => {
    if (selectedSpecs.includes(s)) setSelectedSpecs(selectedSpecs.filter(x => x !== s));
    else setSelectedSpecs([...selectedSpecs, s]);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else setIsSuccess(true);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.successScreen}>
        <CheckCircle color={SecondaryColor} size={80} strokeWidth={1.5} />
        <Text style={styles.successTitle}>Profile Submitted</Text>
        <Text style={styles.successText}>Your profile is currently under review by our medical board. We will notify you once approved.</Text>
        <TouchableOpacity style={styles.successBtn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.successBtnText}>Back to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <ArrowLeft color="#111827" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Registration</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <Text style={styles.stepText}>Step {step} of 3</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {step === 1 && (
            <View style={styles.formSection}>
              <Text style={styles.title}>Basic Details</Text>
              
              <TouchableOpacity style={styles.uploadAvatar} activeOpacity={0.8}>
                <View style={styles.avatarPlaceholder}>
                  <Camera color="#9CA3AF" size={28} />
                </View>
                <Text style={styles.uploadAvatarText}>Upload Profile Photo</Text>
              </TouchableOpacity>

              <InputField icon={User} placeholder="Full Name (with Dr.)" />
              <InputField icon={Mail} placeholder="Email Address" keyboardType="email-address" />
              <InputField icon={Phone} placeholder="Phone Number" keyboardType="phone-pad" />
              <InputField 
                icon={Lock} 
                placeholder="Password" 
                secureTextEntry={!showPass} 
                showToggle={showPass} 
                onToggle={() => setShowPass(!showPass)} 
              />
              <Dropdown icon={User} placeholder="Gender" value="" />
            </View>
          )}

          {step === 2 && (
            <View style={styles.formSection}>
              <Text style={styles.title}>Professional Details</Text>
              
              <Text style={styles.label}>Specialization</Text>
              <View style={styles.chipsContainer}>
                {SPECIALTIES.map(s => {
                  const active = selectedSpecs.includes(s);
                  return (
                    <TouchableOpacity key={s} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleSpec(s)}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <InputField icon={FileText} placeholder="Qualifications (e.g. MBBS, MD)" />
              <InputField icon={User} placeholder="Years of Experience" keyboardType="numeric" />
              <InputField icon={FileText} placeholder="Medical Registration Number" />

              <TouchableOpacity style={styles.uploadDoc} activeOpacity={0.8}>
                <FileText color={PrimaryColor} size={24} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.uploadDocText}>Upload Medical Certificate</Text>
                  <Text style={styles.uploadDocSub}>PDF, JPG up to 10MB</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.formSection}>
              <Text style={styles.title}>Clinic & Availability</Text>
              
              <InputField placeholder="Clinic / Hospital Name" />
              <InputField placeholder="Clinic Address" multiline style={{ height: 80, alignItems: 'flex-start', paddingTop: 12 }} />
              <InputField placeholder="City, State, Pincode" />
              
              <View style={styles.mapPlaceholder}>
                <MapPin color={PrimaryColor} size={20} />
                <Text style={styles.mapText}>Pin Location on Map</Text>
              </View>

              <InputField icon={DollarSign} placeholder="Consultation Fee (₹)" keyboardType="numeric" />

              <Text style={[styles.label, { marginTop: 12 }]}>Availability Type</Text>
              <View style={styles.radioGroup}>
                {['online', 'offline', 'both'].map((type) => (
                  <TouchableOpacity key={type} style={styles.radioBtn} onPress={() => setAvailType(type)}>
                    <View style={[styles.radioOuter, availType === type && styles.radioOuterActive]}>
                      {availType === type && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.btnRow}>
            {step > 1 && (
              <TouchableOpacity style={[styles.actionBtn, styles.backActionBtn]} onPress={prevStep}>
                <Text style={styles.backActionText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionBtn, styles.nextActionBtn]} onPress={nextStep}>
              <Text style={styles.nextActionText}>{step === 3 ? 'Submit Profile' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BgColor },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: BgColor,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  progressContainer: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 24, marginTop: 8, borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: PrimaryColor, borderRadius: 2 },
  stepText: { fontSize: 12, fontWeight: '600', color: PrimaryColor, textAlign: 'center', marginTop: 12 },
  
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  
  formSection: { gap: 16 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', minHeight: 52,
  },
  inputIcon: { marginLeft: 16, marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#111827', paddingHorizontal: 16 },

  uploadAvatar: { alignItems: 'center', marginBottom: 16 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  uploadAvatarText: { fontSize: 14, fontWeight: '600', color: PrimaryColor },

  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: PrimaryColor },
  chipText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  chipTextActive: { color: PrimaryColor, fontWeight: '600' },

  uploadDoc: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#EFF6FF', borderRadius: 14, borderWidth: 1, borderColor: '#BFDBFE', borderStyle: 'dashed',
    marginTop: 8,
  },
  uploadDocText: { fontSize: 14, fontWeight: '600', color: PrimaryColor },
  uploadDocSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  mapPlaceholder: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16,
    backgroundColor: '#F3F4F6', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed',
  },
  mapText: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginLeft: 8 },

  radioGroup: { flexDirection: 'row', gap: 16 },
  radioBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: PrimaryColor },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: PrimaryColor },
  radioLabel: { fontSize: 15, color: '#4B5563' },

  btnRow: { flexDirection: 'row', gap: 16, marginTop: 40 },
  actionBtn: { flex: 1, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  backActionBtn: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  backActionText: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
  nextActionBtn: { backgroundColor: PrimaryColor, shadowColor: PrimaryColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  nextActionText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  successScreen: { flex: 1, backgroundColor: BgColor, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 24, marginBottom: 12 },
  successText: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  successBtn: { backgroundColor: PrimaryColor, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14 },
  successBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
