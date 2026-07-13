// src/screens/RequestsScreen.jsx — Glass theme with profile detail integration
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import ProfileDetail from '../components/discovery/ProfileDetail';

const INCOMING = [
  { 
    id:'1', name:'Ava Torres', age:22, job:'Interior Designer', 
    image:'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600', 
    likedAt:'2 min ago', bio:'Making spaces beautiful 🏡 Always looking for new inspirations in color, form, and texture. Coffee is my second language.', 
    compatibility:88, mutuals:3 
  },
  { 
    id:'2', name:'Marcus Webb', age:26, job:'Software Engineer', 
    image:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600', 
    likedAt:'45 min ago', bio:'Code by day, cook by night 🍳 Trying to live life outside of IDEs and terminal prompts. Love cycling and local bakeries.', 
    compatibility:75, mutuals:1 
  },
  { 
    id:'3', name:'Lily Chen', age:24, job:'Graphic Designer', 
    image:'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=600', 
    likedAt:'2h ago', bio:'Typography nerd & matcha lover 🍵 Lover of minimalist design, vinyl records, and weekend city exploration.', 
    compatibility:91, mutuals:5 
  },
  { 
    id:'4', name:'Ethan Brooks', age:29, job:'Architect', 
    image:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', 
    likedAt:'5h ago', bio:'Building dreams 🏗️ Focused on modern clean lines and sustainable architectures. Let\'s check out some nice view spots.', 
    compatibility:69, mutuals:0 
  },
  { 
    id:'5', name:'Zoe Martin', age:21, job:'Student', 
    image:'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600', 
    likedAt:'1 day ago', bio:'Lost in books, found in music 🎧 English literature major, vinyl records collector, and coffee enthusiast.', 
    compatibility:82, mutuals:2 
  },
];

export default function RequestsScreen() {
  const [requests, setRequests] = useState(INCOMING);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const accept = (id) => {
    setRequests(p => p.filter(r => r.id !== id));
    Alert.alert("It's a Match! 🎉", "You can now message each other.");
  };

  const decline = (id) => {
    setRequests(p => p.filter(r => r.id !== id));
  };

  const openProfile = (profile) => {
    setSelectedProfile(profile);
    setDetailVisible(true);
  };

  const renderRequest = ({ item, index }) => {
    const isFeatured = index === 0;

    return (
      <TouchableOpacity
        style={[styles.card, isFeatured && styles.cardFeatured]}
        onPress={() => openProfile(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardTop}>
          <Image source={{ uri: item.image }} style={isFeatured ? styles.featuredAvatar : styles.avatar} />
          
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardTime}>{item.likedAt}</Text>
          </View>

          {/* Quick action buttons on request card */}
          <View style={styles.quickBtns}>
            <TouchableOpacity style={styles.quickDecline} onPress={() => decline(item.id)}>
              <Ionicons name="close" size={18} color={theme.textSec} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccept} onPress={() => accept(item.id)}>
              <LinearGradient colors={theme.gradientAccent} style={styles.quickAcceptGrad}>
                <Ionicons name="heart" size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.flex}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.flex}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Requests</Text>
            <Text style={styles.sub}>{requests.length} people liked you</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={22} color={theme.textPrimary} />
            {requests.length > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{requests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {requests.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <Ionicons name="heart-circle-outline" size={60} color={theme.textFaint} />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptySub}>When someone likes you, they'll appear here</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* Profile Detail Modal */}
      <ProfileDetail
        visible={detailVisible}
        profile={selectedProfile}
        onClose={() => {
          setDetailVisible(false);
          setSelectedProfile(null);
        }}
        onLike={accept}
        onPass={decline}
      />
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.6 },
  sub:   { fontSize: 13, color: theme.textSec, marginTop: 3 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#FF375F', borderRadius: 9,
    minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 1.5, borderColor: theme.isDark ? '#08080C' : '#fff',
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

  list:     { paddingHorizontal: 16, paddingBottom: 110 },
  listHint: { fontSize: 12, color: theme.textFaint, marginBottom: 14, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: theme.glass,
    borderRadius: 22, marginBottom: 10,
    borderWidth: 1, borderColor: theme.border,
    overflow: 'hidden',
  },
  cardFeatured: {
    borderColor: theme.borderAccent,
    backgroundColor: theme.glassMid,
  },
  cardTop: { flexDirection: 'row', padding: 14, gap: 14, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: theme.border },
  featuredAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: theme.borderAccent },
  cardInfo: { flex: 1 },
  cardInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  cardName: { fontSize: 15, fontWeight: '800', color: theme.textPrimary },
  compatBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: theme.accentSoft, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: theme.borderAccent,
  },
  compatBadgeGreen: { backgroundColor: 'rgba(48,209,88,0.15)', borderColor: 'rgba(48,209,88,0.35)' },
  compatText: { color: theme.accent, fontSize: 11, fontWeight: '800' },
  cardJob:  { fontSize: 13, color: theme.textSec, marginBottom: 2 },
  cardTime: { fontSize: 11, color: theme.textFaint },
  mutualPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 5, alignSelf: 'flex-start',
    backgroundColor: theme.glass, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: theme.border,
  },
  mutualText: { fontSize: 11, color: theme.textSec },

  quickBtns:      { flexDirection: 'row', gap: 8, alignItems: 'center' },
  quickDecline: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center',
  },
  quickAccept:     { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
  quickAcceptGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  promptRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopWidth: 1, borderTopColor: theme.border,
  },
  promptText: { fontSize: 11, color: theme.textFaint, fontWeight: '600' },

  emptyWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyCard: {
    backgroundColor: theme.glass, borderRadius: 24, padding: 32,
    alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.border,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  emptySub:   { fontSize: 14, color: theme.textSec, textAlign: 'center', lineHeight: 21 },
});

