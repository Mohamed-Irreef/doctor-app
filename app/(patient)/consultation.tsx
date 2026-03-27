import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, Video, Paperclip, Send } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useRouter } from 'expo-router';

// Dummy chat data for realistic UI
const INITIAL_MESSAGES = [
  { id: '1', text: 'Hello Doctor! I have a question about my recent blood test report.', sender: 'patient', time: '10:00 AM' },
  { id: '2', text: 'Hi! Sure, I have reviewed your report. What would you like to know?', sender: 'doctor', time: '10:05 AM' },
  { id: '3', text: 'Are the cholesterol levels within the normal range?', sender: 'patient', time: '10:07 AM' },
  { id: '4', text: 'Yes, they are perfectly fine. Just maintain your current diet and physical activity.', sender: 'doctor', time: '10:10 AM' },
];

export default function ConsultationChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, {
      id: Date.now().toString(),
      text: input,
      sender: 'patient',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Image source={{ uri: 'https://avatar.iran.liara.run/public/job/doctor/male' }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.docName} numberOfLines={1}>Dr. Ramesh Sharma</Text>
          <Text style={styles.statusText}>Online</Text>
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

      {/* Chat Area */}
      <KeyboardAvoidingView 
        style={styles.chatArea} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.dateHeader}>Today</Text>
          {messages.map((msg) => {
            const isMe = msg.sender === 'patient';
            return (
              <View key={msg.id} style={[styles.messageBubbleWrap, isMe ? styles.messageRight : styles.messageLeft]}>
                <View style={[styles.messageBubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                  <Text style={[styles.messageText, isMe ? styles.textRight : styles.textLeft]}>{msg.text}</Text>
                </View>
                <Text style={styles.timeText}>{msg.time}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
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
            disabled={input.trim().length === 0}
            activeOpacity={0.7}
          >
            <Send color={input.trim().length > 0 ? Colors.surface : Colors.textSecondary} size={18} />
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
  avatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 8, marginRight: 12, backgroundColor: Colors.lightGray },
  headerInfo: { flex: 1 },
  docName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  statusText: { fontSize: 12, color: '#16A34A', fontWeight: '500', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  
  chatArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  dateHeader: { textAlign: 'center', fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 24 },
  
  messageBubbleWrap: { marginBottom: 20, maxWidth: '80%' },
  messageLeft: { alignSelf: 'flex-start' },
  messageRight: { alignSelf: 'flex-end' },
  messageBubble: { padding: 14, borderRadius: 20 },
  bubbleLeft: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.black, shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  bubbleRight: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  textLeft: { color: Colors.text },
  textRight: { color: Colors.surface },
  timeText: { fontSize: 11, color: Colors.textSecondary, marginTop: 6, marginHorizontal: 4 },
  
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  attachBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  textInput: {
    flex: 1, backgroundColor: '#F1F5F9', minHeight: 44, maxHeight: 100, borderRadius: 22,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: Colors.text,
    marginHorizontal: 8,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnActive: { backgroundColor: Colors.primary },
});
