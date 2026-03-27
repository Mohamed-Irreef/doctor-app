import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import InputField from '../../components/InputField';
import ButtonPrimary from '../../components/ButtonPrimary';
import ActionModal from '../../components/ActionModal';
import { Mail, Lock, UserRound, Stethoscope } from 'lucide-react-native';
import type { Role } from '../../types';
import * as api from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('patient');
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorModal(true);
      return;
    }
    setLoading(true);
    const result = await api.loginUser(email, password, selectedRole ?? 'patient');
    setLoading(false);
    if (result.status === 'success') {
      login(selectedRole, result.data?.user as any);
      router.replace('/');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ActionModal
        visible={errorModal}
        type="error"
        title="Missing Information"
        message="Please enter your email and password to continue."
        confirmLabel="OK"
        onConfirm={() => setErrorModal(false)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?auto=format&fit=crop&q=80&w=800' }}
          style={styles.headerImage}
        />

        <View style={styles.formContainer}>
          <Text style={[Typography.h1, styles.title]}>Welcome Back</Text>
          <Text style={[Typography.body1, styles.subtitle]}>Login to continue to MediBook</Text>

          <View style={styles.roleContainer}>
            {(['patient', 'doctor'] as Role[]).map(role => (
              <TouchableOpacity
                key={role}
                style={[styles.roleCard, selectedRole === role && styles.roleCardActive]}
                onPress={() => setSelectedRole(role)}
                activeOpacity={0.75}
              >
                {role === 'patient'
                  ? <UserRound color={selectedRole === role ? Colors.primary : Colors.textSecondary} size={24} />
                  : <Stethoscope color={selectedRole === role ? Colors.primary : Colors.textSecondary} size={24} />
                }
                <Text style={[styles.roleText, selectedRole === role && styles.roleTextActive]}>
                  {role === 'patient' ? 'Patient' : 'Doctor'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail color={Colors.textSecondary} size={20} />}
          />
          <InputField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Lock color={Colors.textSecondary} size={20} />}
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={[Typography.body2, { color: Colors.primary, fontWeight: '600' }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <ButtonPrimary title="Login" onPress={handleLogin} loading={loading} style={styles.loginBtn} />

          <View style={styles.footer}>
            <Text style={Typography.body2}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push(selectedRole === 'doctor' ? '/(auth)/doctor-signup' : '/(auth)/patient-signup')}>
              <Text style={[Typography.body2, { color: Colors.primary, fontWeight: '600' }]}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1 },
  headerImage: { width: '100%', height: 300 },
  formContainer: {
    flex: 1, backgroundColor: Colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    marginTop: -32, padding: 24,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5,
  },
  title: { marginBottom: 6 },
  subtitle: { color: Colors.textSecondary, marginBottom: 24 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  roleCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface, marginHorizontal: 4,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  roleText: { marginLeft: 8, fontWeight: '600', color: Colors.textSecondary },
  roleTextActive: { color: Colors.primary },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  loginBtn: { marginBottom: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
});
