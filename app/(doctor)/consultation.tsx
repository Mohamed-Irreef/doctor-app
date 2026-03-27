import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, Video, Paperclip, Send } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';

const INITIAL_MESSAGES = [
  { id: '1', text: 'Good morning, Doctor. I have some pain in my chest area since yesterday.', sender: 'patient', time: '09:02 AM' },
  { id: '2', text: 'Good morning! When did the pain start? Is it continuous or intermittent?', sender: 'doctor', time: '09:05 AM' },
  { id: '3', text: 'It started yesterday evening. It comes and goes, mostly when I do any physical activity.', sender: 'patient', time: '09:07 AM' },
  { id: '4', text: 'I see. Please avoid strenuous activity for now. I will review your recent ECG report you shared and advise further.', sender: 'doctor', time: '09:09 AM' },
];

export default function DoctorConsultationScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'doctor',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80' }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.patientName}>Ravi Kumar</Text>
          <Text style={styles.onlineText}>Online</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Phone color={Colors.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Video color={Colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.dateLabel}>Today · Oct 27, 2026</Text>
          {messages.map(msg => {
            const isDoctor = msg.sender === 'doctor';
            return (
              <View key={msg.id} style={[styles.bubbleWrap, isDoctor ? styles.bubbleRight : styles.bubbleLeft]}>
                {!isDoctor && (
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80' }}
                    style={styles.bubbleAvatar}
                  />
                )}
                <View style={{ maxWidth: '75%' }}>
                  <View style={[styles.bubble, isDoctor ? styles.doctorBubble : styles.patientBubble]}>
                    <Text style={[styles.bubbleText, isDoctor && styles.bubbleTextDoctor]}>{msg.text}</Text>
                  </View>
                  <Text style={[styles.timeText, isDoctor && { textAlign: 'right' }]}>{msg.time}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <Paperclip color={Colors.textSecondary} size={20} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, input.trim().length > 0 && styles.sendBtnActive]}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Send color={input.trim() ? Colors.surface : Colors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconBtn: { padding: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10, backgroundColor: Colors.lightGray },
  headerInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  onlineText: { fontSize: 12, color: '#16A34A', fontWeight: '500', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 4 },
  scrollContent: { padding: 20, paddingBottom: 30 },
  dateLabel: { textAlign: 'center', fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 20 },
  bubbleWrap: { flexDirection: 'row', marginBottom: 18, alignItems: 'flex-end' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  bubbleAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: Colors.lightGray },
  bubble: { padding: 14, borderRadius: 18 },
  patientBubble: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  doctorBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  bubbleTextDoctor: { color: Colors.surface },
  timeText: { fontSize: 11, color: Colors.textSecondary, marginTop: 5, marginHorizontal: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  attachBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  textInput: {
    flex: 1, backgroundColor: '#F1F5F9', minHeight: 44, maxHeight: 100, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: Colors.text, marginHorizontal: 8,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnActive: { backgroundColor: Colors.primary },
});
