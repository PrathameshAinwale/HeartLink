// src/screens/ChatDetailScreen.jsx
import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Image, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const MOCK_MSGS = [
  { id:'1', text:"Hey! How's your day going? 🌸",              sender:'other', time:'2:30 PM' },
  { id:'2', text:"Pretty good! Just wrapped a project. You?",   sender:'me',    time:'2:31 PM' },
  { id:'3', text:"Amazing! I'd love to hear more about it 🎨",  sender:'other', time:'2:32 PM' },
  { id:'4', text:"Let's grab coffee sometime and catch up!",     sender:'other', time:'2:33 PM' },
  { id:'5', text:"I'd love that! This weekend work for you?",    sender:'me',    time:'2:35 PM' },
  { id:'6', text:"Perfect! Can't wait 💕",                      sender:'other', time:'2:36 PM' },
];

const OTHER = {
  name: 'Sophia Carter',
  image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300',
  online: true,
};

export default function ChatDetailScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState(MOCK_MSGS);
  const [input, setInput]       = useState('');
  const listRef = useRef(null);

  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const send = () => {
    if (!input.trim()) return;
    setMessages(p => [...p, { id: Date.now().toString(), text: input.trim(), sender: 'me', time: 'Now' }]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const renderMsg = ({ item }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && <Image source={{ uri: OTHER.image }} style={styles.msgAvatar} />}
        {isMe ? (
          <LinearGradient colors={theme.gradientAccent} style={[styles.bubble, styles.bubbleMe]}>
            <Text style={styles.bubbleTextMe}>{item.text}</Text>
            <Text style={styles.bubbleTimeMe}>{item.time}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.bubbleOther]}>
            <Text style={styles.bubbleTextOther}>{item.text}</Text>
            <Text style={styles.bubbleTimeOther}>{item.time}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.flex}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Image source={{ uri: OTHER.image }} style={styles.headerAvatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{OTHER.name}</Text>
            <View style={styles.onlineRow}>
              {OTHER.online && <View style={styles.onlineDot} />}
              <Text style={styles.onlineText}>{OTHER.online ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.menuBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          {/* Messages area — glass card */}
          <View style={styles.messagesArea}>
            <FlatList
              ref={listRef}
              data={messages}
              renderItem={renderMsg}
              keyExtractor={i => i.id}
              contentContainerStyle={styles.msgList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            />
          </View>

          {/* Input row */}
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.inputSideBtn}>
              <Ionicons name="image-outline" size={22} color={theme.textSec} />
            </TouchableOpacity>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Message…"
                placeholderTextColor={theme.textFaint}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <TouchableOpacity style={styles.emojiBtn}>
                <Ionicons name="happy-outline" size={20} color={theme.textSec} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={send} style={styles.sendBtn}>
              <LinearGradient colors={theme.gradientAccent} style={styles.sendGrad}>
                <Ionicons name="send" size={17} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 10,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1.5, borderColor: theme.border,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: theme.textPrimary },
  onlineRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.accentGreen },
  onlineText: { fontSize: 12, color: theme.textSec },
  menuBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center',
  },

  messagesArea: { flex: 1 },
  msgList:      { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  msgRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe:     { flexDirection: 'row-reverse' },
  msgAvatar:    { width: 28, height: 28, borderRadius: 14, marginBottom: 2 },
  bubble: {
    maxWidth: '74%', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleOther: {
    backgroundColor: theme.glass,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: theme.border,
  },
  bubbleMe:         { borderBottomRightRadius: 4 },
  bubbleTextOther:  { fontSize: 15, color: theme.textPrimary, lineHeight: 21 },
  bubbleTextMe:     { fontSize: 15, color: '#fff', lineHeight: 21 },
  bubbleTimeOther:  { fontSize: 10, color: theme.textFaint, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMe:     { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 4, alignSelf: 'flex-end' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: theme.border,
  },
  inputSideBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.glass, borderRadius: 22,
    borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 2, maxHeight: 100,
  },
  input:    { flex: 1, color: theme.textPrimary, fontSize: 15, padding: 0, paddingVertical: 8 },
  emojiBtn: { padding: 4 },
  sendBtn:  { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

