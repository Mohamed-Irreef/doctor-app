import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, Role } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import InputField from '../../components/InputField';
import ButtonPrimary from '../../components/ButtonPrimary';
import { Mail, Lock, UserRound, Stethoscope, User } from 'lucide-react-native';

export default function SignupScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('patient');

  const handleSignup = () => {
    // Mock signup
    if (name && email && password) {
      login(selectedRole);
    } else {
      alert('Please fill out all fields');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=800' }} 
          style={styles.headerImage} 
        />
        
        <View style={styles.formContainer}>
          <Text style={[Typography.h1, styles.title]}>Create Account</Text>
          <Text style={[Typography.body1, styles.subtitle]}>Sign up to get started</Text>

          <View style={styles.roleContainer}>
            <TouchableOpacity 
              style={[styles.roleCard, selectedRole === 'patient' && styles.roleCardActive]}
              onPress={() => setSelectedRole('patient')}
            >
              <UserRound color={selectedRole === 'patient' ? Colors.primary : Colors.textSecondary} size={24} />
              <Text style={[Typography.body2, styles.roleText, selectedRole === 'patient' && styles.roleTextActive]}>Patient</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleCard, selectedRole === 'doctor' && styles.roleCardActive]}
              onPress={() => setSelectedRole('doctor')}
            >
              <Stethoscope color={selectedRole === 'doctor' ? Colors.primary : Colors.textSecondary} size={24} />
              <Text style={[Typography.body2, styles.roleText, selectedRole === 'doctor' && styles.roleTextActive]}>Doctor</Text>
            </TouchableOpacity>
          </View>

          <InputField 
            placeholder="Full Name" 
            value={name} 
            onChangeText={setName}
            icon={<User color={Colors.textSecondary} size={20} />}
          />

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

          <ButtonPrimary 
            title="Sign Up" 
            onPress={handleSignup} 
            style={styles.signupBtn}
          />

          <View style={styles.footer}>
            <Text style={Typography.body2}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[Typography.body2, { color: Colors.primary, fontWeight: '600' }]}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  formContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginHorizontal: 4,
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightGray,
  },
  roleText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  roleTextActive: {
    color: Colors.primary,
  },
  signupBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
});
