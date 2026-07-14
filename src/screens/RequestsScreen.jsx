// src/screens/RequestsScreen.jsx — Swipeable Requests Deck with Top Boosted Inquiry
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, SafeAreaView, StatusBar, Alert, Dimensions, FlatList, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import ProfileDetail from '../components/discovery/ProfileDetail';

const { width, height } = Dimensions.get('window');

const BOOSTED_REQUEST = {
  id: 'boost_1',
  name: 'Elena Rostova',
  age: 24,
  job: 'F1 Aero Engineer 🏎️',
  image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
  likedAt: 'Just now',
  bio: 'Adrenaline junkie, wind tunnel designer, and amateur racing driver. Let\'s trade stories over a fast ride. ⚡',
  compatibility: 98,
  mutuals: 4
};

const INCOMING = [
  { 
    id:'1', name:'Ava Torres', age:22, job:'Interior Designer', 
    image:'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600', 
    likedAt:'2 min ago', bio: 'Making spaces beautiful 🏡 Always looking for new inspirations in color, form, and texture. Coffee is my second language.', 
    compatibility:88, mutuals:3 
  },
  { 
    id:'2', name:'Marcus Webb', age:26, job:'Software Engineer', 
    image:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600', 
    likedAt:'45 min ago', bio: 'Code by day, cook by night 🍳 Trying to live life outside of IDEs and terminal prompts. Love cycling and local bakeries.', 
    compatibility:75, mutuals:1 
  },
  { 
    id:'3', name:'Lily Chen', age:24, job:'Graphic Designer', 
    image:'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=600', 
    likedAt:'2h ago', bio: 'Typography nerd & matcha lover 🍵 Lover of minimalist design, vinyl records, and weekend city exploration.', 
    compatibility:91, mutuals:5 
  },
  { 
    id:'4', name:'Ethan Brooks', age:29, job:'Architect', 
    image:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', 
    likedAt:'5h ago', bio: 'Building dreams 🏗️ Focused on modern clean lines and sustainable architectures. Let\'s check out some nice view spots.', 
    compatibility:69, mutuals:0 
  },
  { 
    id:'5', name:'Zoe Martin', age:21, job:'Student', 
    image:'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600', 
    likedAt:'1 day ago', bio: 'Lost in books, found in music 🎧 English literature major, vinyl records collector, and coffee enthusiast.', 
    compatibility:82, mutuals:2 
  },
];

export default function RequestsScreen() {
  const [boosted, setBoosted] = useState(BOOSTED_REQUEST);
  const [requests, setRequests] = useState(INCOMING);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  useEffect(() => {
    // Prefetch all images on mount to prevent flashes
    if (boosted) {
      Image.prefetch(boosted.image).catch(() => {});
    }
    requests.forEach(r => {
      Image.prefetch(r.image).catch(() => {});
    });
  }, []);

  const accept = (id) => {
    if (boosted && boosted.id === id) {
      setBoosted(null);
    } else {
      setRequests(p => p.filter(r => r.id !== id));
    }
    Alert.alert("It's a Match! 🎉", "You can now message each other.");
  };

  const decline = (id) => {
    if (boosted && boosted.id === id) {
      setBoosted(null);
    } else {
      setRequests(p => p.filter(r => r.id !== id));
    }
  };

  const openProfile = (profile) => {
    const formatted = {
      ...profile,
      images: [profile.image],
      distance: profile.likedAt,
    };
    setSelectedProfile(formatted);
    setDetailVisible(true);
  };

  const renderBoostedInquiry = () => {
    if (!boosted) return null;
    return (
      <View style={styles.boostSection}>
        <View style={styles.boostHeader}>
          <LinearGradient colors={['#A78BFA', '#F472B6']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.boostHeaderIconGrad}>
            <Ionicons name="flash" size={11} color="#fff" />
          </LinearGradient>
          <Text style={styles.boostHeaderTitle}>COSMIC BOOST INQUIRY</Text>
        </View>

        <TouchableOpacity
          style={styles.boostCard}
          onPress={() => openProfile(boosted)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: boosted.image }} style={styles.boostCardImg} />
          <LinearGradient colors={['transparent', 'rgba(10, 5, 28, 0.25)', 'rgba(10, 5, 28, 0.92)']} style={styles.boostCardOverlay} />

          <View style={styles.boostCompatPill}>
            <Ionicons name="heart" size={10} color="#fff" />
            <Text style={styles.boostCompatText}>{boosted.compatibility}% Match</Text>
          </View>

          <View style={styles.boostDetails}>
            <Text style={styles.boostName}>{boosted.name}, {boosted.age}</Text>
            <Text style={styles.boostJob}>{boosted.job}</Text>
            <Text style={styles.boostTime}>⚡ boosted {boosted.likedAt}</Text>
          </View>

          <View style={styles.boostActions}>
            <TouchableOpacity style={styles.boostDecline} onPress={() => decline(boosted.id)}>
              <Ionicons name="close" size={18} color="#FF375F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.boostAccept} onPress={() => accept(boosted.id)}>
              <LinearGradient colors={['#8B5CF6', '#D946EF']} style={styles.boostAcceptGrad}>
                <Ionicons name="heart" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAdmirer = ({ item }) => (
    <TouchableOpacity
      style={styles.cardStrip}
      onPress={() => openProfile(item)}
      activeOpacity={0.85}
    >
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      {/* Asymmetric border-radius leaf avatar */}
      <Image source={{ uri: item.image }} style={styles.stripAvatar} />
      
      <View style={styles.stripInfo}>
        <Text style={styles.stripName}>{item.name}, {item.age}</Text>
        <Text style={styles.stripJob}>{item.job}</Text>
        
        {/* Compatibility tag */}
        <View style={styles.stripCompatBadge}>
          <Ionicons name="heart" size={8} color="#FF375F" />
          <Text style={styles.stripCompatText}>{item.compatibility}% match · {item.likedAt}</Text>
        </View>
      </View>

      <View style={styles.stripActions}>
        <TouchableOpacity style={styles.stripDecline} onPress={() => decline(item.id)}>
          <Ionicons name="close" size={16} color={theme.textSec} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.stripAccept} onPress={() => accept(item.id)}>
          <LinearGradient colors={theme.gradientAccent} style={styles.stripAcceptGrad}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Boost section card */}
      {renderBoostedInquiry()}

      {/* Title section for standard list */}
      {requests.length > 0 && (
        <Text style={styles.listSectionTitle}>All Requests</Text>
      )}
    </View>
  );

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Glowing background depth blobs */}
      <View style={styles.glowBlobCyan} pointerEvents="none" />
      <View style={styles.glowBlobPurple} pointerEvents="none" />

      <SafeAreaView style={styles.flex}>
        {/* Header navigation bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Requests</Text>
            <Text style={styles.sub}>{requests.length + (boosted ? 1 : 0)} cosmic admirers</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <Ionicons name="notifications" size={20} color={theme.textPrimary} />
            {(requests.length + (boosted ? 1 : 0)) > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{requests.length + (boosted ? 1 : 0)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {requests.length === 0 && !boosted ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <Ionicons name="heart-half-outline" size={60} color={theme.textFaint} />
              <Text style={styles.emptyTitle}>Empty space</Text>
              <Text style={styles.emptySub}>When someone sends you cosmic likes, they'll appear here</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderAdmirer}
            keyExtractor={i => i.id}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* Details slide-up sheet */}
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
  root: { flex: 1, position: 'relative' },

  // Glowing fader blobs
  glowBlobCyan: {
    position: 'absolute',
    top: height * 0.08,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 191, 255, 0.16)',
    opacity: 0.7,
    zIndex: 0,
  },
  glowBlobPurple: {
    position: 'absolute',
    bottom: height * 0.18,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(123, 47, 190, 0.20)',
    opacity: 0.8,
    zIndex: 0,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 14 : 14,
    paddingBottom: 16,
    zIndex: 10,
  },
  title: { fontSize: 28, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.6 },
  sub:   { fontSize: 13, color: theme.textSec, marginTop: 3 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.glass,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: '#FF375F', borderRadius: 9,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: theme.isDark ? '#08080C' : '#fff',
  },
  bellBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },

  // ── Boost Section at the Top ──────────────────────────────────────────
  boostSection: {
    marginBottom: 26,
  },
  boostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  boostHeaderIconGrad: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 1.2,
  },
  boostCard: {
    height: 230,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: theme.glass,
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.isDark ? 0.35 : 0.15,
    shadowRadius: 14,
  },
  boostCardImg: { position: 'absolute', width: '100%', height: '100%', resizeMode: 'cover' },
  boostCardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
  boostCompatPill: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.45)',
    borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    zIndex: 5,
  },
  boostCompatText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  boostDetails: { position: 'absolute', bottom: 20, left: 20 },
  boostName: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },
  boostJob: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  boostTime: { fontSize: 11, color: '#A78BFA', fontWeight: '700', marginTop: 5 },
  boostActions: {
    position: 'absolute', bottom: 16, right: 16,
    flexDirection: 'row', gap: 10, alignItems: 'center',
  },
  boostDecline: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostAccept: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
  boostAcceptGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Standard List Section ──────────────────────────────────────────────
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  cardStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.glass,
    borderRadius: 22,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  stripAvatar: {
    width: 66,
    height: 66,
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
  },
  stripInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  stripName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.2,
  },
  stripJob: {
    fontSize: 12,
    color: theme.textSec,
    marginTop: 2,
  },
  stripCompatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 55, 95, 0.10)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  stripCompatText: {
    color: '#FF375F',
    fontSize: 8.5,
    fontWeight: '800',
  },
  stripActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  stripDecline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stripAccept: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  stripAcceptGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyCard: {
    backgroundColor: theme.glass, borderRadius: 24, padding: 32,
    alignItems: 'center', gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  emptySub:   { fontSize: 14, color: theme.textSec, textAlign: 'center', lineHeight: 21 },
});
