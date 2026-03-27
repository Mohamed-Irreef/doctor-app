import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { ArrowLeft, User, Phone, Mail, Lock, Calendar, ChevronDown, ChevronUp, MapPin, Droplet, Contact, Camera } from 'lucide-react-native';

const PrimaryColor = '#2563EB';
const SecondaryColor = '#14B8A6';
const BgColor = '#F9FAFB';

function InputField({ icon: Icon, placeholder, secureTextEntry, keyboardType }: any) {
  return (
    <View style={styles.inputContainer}>
      <Icon color="#6B7280" size={18} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function Dropdown({ icon: Icon, placeholder, value }: any) {
  return (
    <View style={styles.inputContainer}>
      <Icon color="#6B7280" size={18} style={styles.inputIcon} />
      <Text style={[styles.input, { color: value ? '#111827' : '#9CA3AF', paddingTop: 14 }]}>
        {value || placeholder}
      </Text>
      <ChevronDown color="#6B7280" size={18} style={{ marginRight: 16 }} />
    </View>
  );
}

export default function PatientSignupScreen() {
  const router = useRouter();
  const [showOptional, setShowOptional] = useState(false);

  const handleSignup = () => {
    // Dummy navigation to patient home
    router.replace('/(patient)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color="#111827" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Patient Registration</Text>
          <Text style={styles.subtitle}>Enter your details to quickly book an appointment and manage your health.</Text>

          <View style={styles.formSection}>
            <InputField icon={User} placeholder="Full Name" />
            <InputField icon={Phone} placeholder="Phone Number" keyboardType="phone-pad" />
            <InputField icon={Mail} placeholder="Email Address" keyboardType="email-address" />
            <InputField icon={Lock} placeholder="Password" secureTextEntry />
            <Dropdown icon={User} placeholder="Gender" value="" />
            <Dropdown icon={Calendar} placeholder="Date of Birth" value="" />
          </View>

          <TouchableOpacity 
            style={styles.optionalToggle} 
            onPress={() => setShowOptional(!showOptional)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionalText}>Optional Details</Text>
            {showOptional ? <ChevronUp color={PrimaryColor} size={18} /> : <ChevronDown color={PrimaryColor} size={18} />}
          </TouchableOpacity>

          {showOptional && (
            <View style={styles.formSection}>
              {/* Profile Image Upload Placeholder */}
              <TouchableOpacity style={styles.uploadArea} activeOpacity={0.8}>
                <View style={styles.uploadIconBg}>
                  <Camera color={PrimaryColor} size={24} />
                </View>
                <View>
                  <Text style={styles.uploadText}>Upload Profile Picture</Text>
                  <Text style={styles.uploadSub}>PNG, JPG up to 5MB</Text>
                </View>
              </TouchableOpacity>

              <InputField icon={MapPin} placeholder="City, State, Pincode" />
              <Dropdown icon={Droplet} placeholder="Blood Group (e.g. O+)" value="" />
              <InputField icon={Contact} placeholder="Emergency Contact Name & Number" />
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSignup} activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>Create Account</Text>
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Log In</Text>
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
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 32 },
  
  formSection: { gap: 16 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
    height: 52,
  },
  inputIcon: { marginLeft: 16, marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#111827' },

  optionalToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 12,
  },
  optionalText: { fontSize: 15, fontWeight: '600', color: PrimaryColor },

  uploadArea: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#EFF6FF', borderRadius: 14, borderWidth: 1, borderColor: '#BFDBFE', borderStyle: 'dashed',
    marginBottom: 6,
  },
  uploadIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  uploadText: { fontSize: 14, fontWeight: '600', color: PrimaryColor },
  uploadSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  submitBtn: {
    backgroundColor: PrimaryColor, borderRadius: 14, height: 56,
    alignItems: 'center', justifyContent: 'center', marginTop: 32,
    shadowColor: PrimaryColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: '#6B7280' },
  footerLink: { fontSize: 14, fontWeight: '700', color: PrimaryColor },
});
