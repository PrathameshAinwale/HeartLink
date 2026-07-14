// src/screens/ChatDetailScreen.jsx
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Image, KeyboardAvoidingView,
  Platform, StatusBar, Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

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
  const route = useRoute();
  const [messages, setMessages] = useState(MOCK_MSGS);
  const [input, setInput]       = useState('');
  const listRef = useRef(null);

  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Adjust mock data name/image based on user route params if available
  const activeUser = useMemo(() => {
    return OTHER;
  }, [route.params]);

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
        {!isMe && <Image source={{ uri: activeUser.image }} style={styles.msgAvatar} />}
        {isMe ? (
          <LinearGradient colors={theme.gradientAccent} style={[styles.bubble, styles.bubbleMe]}>
            <Text style={styles.bubbleTextMe}>{item.text}</Text>
            <Text style={styles.bubbleTimeMe}>{item.time}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.bubbleOther]}>
            {/* Frosted glass blur background */}
            <BlurView
              intensity={isDark ? 30 : 50}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.bubbleTextOther}>{item.text}</Text>
            <Text style={styles.bubbleTimeOther}>{item.time}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Glowing background depth blobs */}
      <View style={styles.glowBlobCyan} pointerEvents="none" />
      <View style={styles.glowBlobFuchsia} pointerEvents="none" />

      {/* Frosted header banner */}
      <View style={styles.headerContainer}>
        <BlurView
          intensity={isDark ? 45 : 75}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
            </TouchableOpacity>
            
            <Image source={{ uri: activeUser.image }} style={styles.headerAvatar} />
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{activeUser.name}</Text>
              <View style={styles.onlineRow}>
                {activeUser.online && <View style={styles.onlineDot} />}
                <Text style={styles.onlineText}>{activeUser.online ? 'Online now' : 'Offline'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.menuBtn}>
              <Ionicons name="ellipsis-horizontal" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages log */}
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

        {/* Frosted bottom input deck */}
        <View style={styles.inputContainer}>
          <BlurView
            intensity={isDark ? 45 : 75}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.inputSideBtn}>
                <Ionicons name="image-outline" size={22} color={theme.textSec} />
              </TouchableOpacity>
              
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Type message…"
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
                  <Ionicons name="send" size={14} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, position: 'relative' },

  // Glowing background blobs for depth
  glowBlobCyan: {
    position: 'absolute',
    top: height * 0.15,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 191, 255, 0.16)',
    opacity: 0.7,
    zIndex: 0,
  },
  glowBlobFuchsia: {
    position: 'absolute',
    bottom: height * 0.3,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 0, 127, 0.18)',
    opacity: 0.8,
    zIndex: 0,
  },

  // Frosted header banner
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerSafeArea: {
    width: '100%',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.2 },
  onlineRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot:  { width: 6.5, height: 6.5, borderRadius: 3.25, backgroundColor: theme.accentGreen },
  onlineText: { fontSize: 11, color: theme.textSec, fontWeight: '600' },
  menuBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center',
  },

  // Message area scrolling view
  messagesArea: { flex: 1 },
  msgList:      { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24, gap: 10 },
  msgRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe:     { flexDirection: 'row-reverse' },
  msgAvatar:    { width: 28, height: 28, borderRadius: 14, marginBottom: 2 },
  
  bubble: {
    maxWidth: '74%', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    overflow: 'hidden',
  },
  bubbleOther: {
    backgroundColor: theme.glass,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: theme.border,
  },
  bubbleMe: { 
    borderBottomRightRadius: 4 
  },
  bubbleTextOther:  { fontSize: 14.5, color: theme.textPrimary, lineHeight: 21 },
  bubbleTextMe:     { fontSize: 14.5, color: '#fff', lineHeight: 21 },
  bubbleTimeOther:  { fontSize: 9.5, color: theme.textFaint, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMe:     { fontSize: 9.5, color: 'rgba(255,255,255,0.75)', marginTop: 4, alignSelf: 'flex-end' },

  // Frosted bottom input deck
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    overflow: 'hidden',
  },
  inputSafeArea: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
  },
  inputSideBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.glass, borderRadius: 22,
    borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, paddingVertical: 2, maxHeight: 100,
  },
  input:    { flex: 1, color: theme.textPrimary, fontSize: 14.5, padding: 0, paddingVertical: 8 },
  emojiBtn: { padding: 4 },
  sendBtn:  { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  sendGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
