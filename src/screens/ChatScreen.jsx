// src/screens/ChatScreen.jsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, SafeAreaView, StatusBar, TextInput, ScrollView, Dimensions, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

const CHATS = [
  { id:'1', name:'Sophia Carter',   time:'2m',  unread:3, online:true,  lastMsg:"Hey! Free this weekend? 🌸",    image:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400' },
  { id:'2', name:'Mia Rodriguez',   time:'18m', unread:0, online:true,  lastMsg:'That sounds amazing! 🎨',        image:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400' },
  { id:'3', name:'James Whitfield', time:'1h',  unread:0, online:false, lastMsg:'Coffee tomorrow? ☕',            image:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
  { id:'4', name:'Zoe Martin',      time:'3h',  unread:1, online:false, lastMsg:'Can we reschedule? 🙏',          image:'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400' },
  { id:'5', name:'Lily Chen',       time:'5h',  unread:0, online:false, lastMsg:'Loved your gallery btw! 😍',    image:'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=400' },
  { id:'6', name:'Marcus Webb',     time:'1d',  unread:0, online:false, lastMsg:'So when are we meeting? 😊',    image:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400' },
];

export default function ChatScreen() {
  const navigation = useNavigation();
  const [search, setSearch]         = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const filtered = CHATS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const activeSparks = CHATS.filter(c => c.online);

  const renderChat = ({ item }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => navigation.navigate('ChatDetail', { userId: item.id })}
      activeOpacity={0.80}
    >
      {/* Frosted Glass Background */}
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Image source={{ uri: item.image }} style={styles.avatar} />
        {item.online && <View style={styles.onlineDot} />}
      </View>

      {/* Info */}
      <View style={styles.chatInfo}>
        <View style={styles.chatRow}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={[styles.chatTime, item.unread > 0 && { color: theme.accent }]}>{item.time}</Text>
        </View>
        <View style={styles.chatRow}>
          <Text style={[styles.chatMsg, item.unread > 0 && { color: theme.textSec, fontWeight: '750' }]} numberOfLines={1}>
            {item.lastMsg}
          </Text>
          {item.unread > 0 && (
            <LinearGradient colors={theme.gradientAccent} style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </LinearGradient>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={{ zIndex: 10 }}>
      <Text style={styles.sectionLabel}>{filtered.length} conversation{filtered.length !== 1 ? 's' : ''}</Text>
    </View>
  );

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Glowing background depth blobs */}
      <View style={styles.glowBlobFuchsia} pointerEvents="none" />
      <View style={styles.glowBlobCyan} pointerEvents="none" />

      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setSearchOpen(p => !p)}>
              <Ionicons name={searchOpen ? 'close' : 'search'} size={19} color={theme.textPrimary} />
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="create-outline" size={19} color={theme.textPrimary} />
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Search bar */}
        {searchOpen && (
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={15} color={theme.textFaint} />
              <TextInput
                autoFocus style={styles.searchInput}
                placeholder="Search conversations…"
                placeholderTextColor={theme.textFaint}
                value={search} onChangeText={setSearch}
              />
            </View>
          </View>
        )}

        <FlatList
          data={filtered}
          renderItem={renderChat}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.textFaint} />
              <Text style={styles.emptyText}>No conversations yet</Text>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, position: 'relative' },

  // Glowing background blobs for glassmorphic depth
  glowBlobFuchsia: {
    position: 'absolute',
    top: height * 0.1,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 0, 127, 0.20)',
    opacity: 0.8,
    zIndex: 0,
  },
  glowBlobCyan: {
    position: 'absolute',
    bottom: height * 0.2,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 191, 255, 0.16)',
    opacity: 0.7,
    zIndex: 0,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 14 : 14,
    paddingBottom: 12,
    zIndex: 10,
  },
  title:  { fontSize: 28, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.6 },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center',
  },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12, zIndex: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.glass, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: theme.border,
  },
  searchInput: { flex: 1, color: theme.textPrimary, fontSize: 14, padding: 0 },
  list:        { paddingHorizontal: 16, paddingBottom: 110 },
  sectionLabel:{ fontSize: 11, fontWeight: '800', color: theme.textFaint, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 },

  // Active Connection carousel
  sparksSection: {
    marginBottom: 22,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  sparksList: {
    gap: 14,
    paddingRight: 20,
  },
  sparkItem: {
    alignItems: 'center',
    width: 66,
  },
  sparkAvatarWrap: {
    position: 'relative',
    width: 58,
    height: 58,
  },
  sparkAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  sparkOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#30D158',
    borderWidth: 2.2,
    borderColor: '#150A2E',
  },
  sparkName: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSec,
    marginTop: 6,
    textAlign: 'center',
  },

  // Chat conversation rows (Frosted cardStrips)
  chatCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.glass,
    borderRadius: 22, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: theme.border,
    overflow: 'hidden',
  },
  avatarWrap: { position: 'relative', marginRight: 14 },
  avatar:     { width: 54, height: 54, borderRadius: 27 },
  onlineDot:  {
    position: 'absolute', bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 6.5,
    backgroundColor: theme.accentGreen, borderWidth: 2, borderColor: '#150A2E',
  },
  chatInfo:   { flex: 1 },
  chatRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName:   { fontSize: 15, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.2 },
  chatTime:   { fontSize: 11, color: theme.textFaint },
  chatMsg:    { fontSize: 13, color: theme.textSec, flex: 1, paddingRight: 10 },
  unreadBadge:{ minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  empty:      { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:  { color: theme.textSec, fontSize: 15 },
});