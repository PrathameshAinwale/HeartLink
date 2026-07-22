// src/screens/VibesScreen.jsx — Orbital Vibe Sector Radar
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
  Image, SafeAreaView, StatusBar, ScrollView, Dimensions, Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import CustomAlertModal from '../components/CustomAlertModal';
import { apiGetDiscoveryFeed } from '../services/api';
import { ensureArray, formatImageUrl } from '../utils/helpers';

const { width, height } = Dimensions.get('window');

// 12 curated lifestyle vibes split into 2 sector pages
const ALL_VIBE_NODES = [
  // Page 1 (Sector A)
  { id: 'v1', name: 'Late Night Beats', icon: 'musical-notes', color: ['#A855F7', '#6366F1'], tagline: 'Vinyl & Lo-fi', onlineCount: 14 },
  { id: 'v2', name: 'Cafe Hop', icon: 'cafe', color: ['#F59E0B', '#EAB308'], tagline: 'Brews & Books', onlineCount: 9 },
  { id: 'v3', name: 'Nature Peak', icon: 'leaf', color: ['#10B981', '#14B8A6'], tagline: 'Trails & Camp', onlineCount: 11 },
  { id: 'v4', name: 'Gamer Zone', icon: 'game-controller', color: ['#EC4899', '#F43F5E'], tagline: 'Retro & Consoles', onlineCount: 18 },
  { id: 'v5', name: 'Art & Gallery', icon: 'brush', color: ['#06B6D4', '#3B82F6'], tagline: 'Galleries & Canvas', onlineCount: 7 },
  { id: 'v6', name: 'Foodie Club', icon: 'restaurant', color: ['#F97316', '#F59E0B'], tagline: 'Spices & Taste', onlineCount: 12 },

  // Page 2 (Sector B)
  { id: 'v7', name: 'Fitness Fit', icon: 'barbell', color: ['#FF2D55', '#FF9500'], tagline: 'Gym & Runs', onlineCount: 15 },
  { id: 'v8', name: 'Cinephile', icon: 'film', color: ['#007AFF', '#5856D6'], tagline: 'Indie & Classics', onlineCount: 8 },
  { id: 'v9', name: 'Tech & Dev', icon: 'code-working', color: ['#34C759', '#007AFF'], tagline: 'AI & Startups', onlineCount: 19 },
  { id: 'v10', name: 'Wanderlust', icon: 'airplane', color: ['#FF9500', '#4CD964'], tagline: 'Flights & Roadtrips', onlineCount: 10 },
  { id: 'v11', name: 'Pet Lover', icon: 'paw', color: ['#FF2D55', '#FFCC00'], tagline: 'Pups & Parks', onlineCount: 13 },
  { id: 'v12', name: 'Star Gazer', icon: 'telescope', color: ['#5856D6', '#007AFF'], tagline: 'Space & Stars', onlineCount: 16 },
];

// Keyword map: each vibe id → interest keywords that match users to it
const VIBE_KEYWORDS = {
  v1:  ['music', 'vinyl', 'lo-fi', 'concert', 'jazz', 'beats'],
  v2:  ['coffee', 'cafe', 'book', 'reading', 'tea', 'brew'],
  v3:  ['hiking', 'nature', 'camping', 'trail', 'outdoor', 'climbing'],
  v4:  ['gaming', 'game', 'esport', 'anime', 'console', 'retro'],
  v5:  ['art', 'gallery', 'painting', 'sculpture', 'design', 'canvas'],
  v6:  ['food', 'cooking', 'foodie', 'chef', 'restaurant', 'baking'],
  v7:  ['fitness', 'gym', 'yoga', 'running', 'workout', 'sport', 'exercise'],
  v8:  ['movie', 'cinema', 'film', 'series', 'netflix', 'watch'],
  v9:  ['tech', 'coding', 'programming', 'ai', 'startup', 'developer'],
  v10: ['travel', 'wanderlust', 'backpacking', 'adventure', 'flight', 'road'],
  v11: ['pet', 'dog', 'cat', 'animal', 'pup', 'foster'],
  v12: ['star', 'astronomy', 'space', 'galaxy', 'telescope', 'cosmos'],
};

export default function VibesScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Vibe Sector Page State (0 = Sector A, 1 = Sector B)
  const [vibePage, setVibePage] = useState(0);
  const [selectedVibe, setSelectedVibe] = useState('v1');

  // Real API-sourced people from the discovery feed
  const [realPeople, setRealPeople] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(true);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const res = await apiGetDiscoveryFeed();
        if (res?.profiles && Array.isArray(res.profiles)) {
          const formatted = res.profiles.map(u => {
            let img = u.avatar || '';
            const photos = ensureArray(u.photos);
            if (photos.length > 0) {
              img = (typeof photos[0] === 'string' ? photos[0] : photos[0]?.photo_url) || img;
            }
            return {
              id: u.id,
              name: u.name || 'Member',
              age: u.age || 24,
              match: u.compatibility_score || 85,
              bio: u.bio || '',
              image: formatImageUrl(img),
              interests: ensureArray(u.interests),
            };
          });
          setRealPeople(formatted);
        }
      } catch (e) {
        console.warn('Vibes feed fetch error:', e?.message);
      } finally {
        setLoadingPeople(false);
      }
    };
    fetchPeople();
  }, []);

  // Slow float loops
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;

  // Pulse animation for the central shuffler core
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loopFloat = (animValue, duration, delay = 0) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    };

    loopFloat(floatAnim1, 2400, 0);
    loopFloat(floatAnim2, 2700, 150);
    loopFloat(floatAnim3, 3100, 300);
  }, []);

  const translateY1 = floatAnim1.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });
  const translateY2 = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [-3, 5] });
  const translateY3 = floatAnim3.interpolate({ inputRange: [0, 1], outputRange: [-5, 3] });

  // Helper: count real users per vibe node
  const countForVibe = useCallback((vibeId) => {
    const keywords = VIBE_KEYWORDS[vibeId] || [];
    return realPeople.filter(p =>
      p.interests.some(i => keywords.some(kw => i.toLowerCase().includes(kw)))
    ).length;
  }, [realPeople]);

  // Compute exact node coordinates on a single outer ring dynamically (Radius: 120)
  const activeNodesList = useMemo(() => {
    const startIndex = vibePage * 6;
    const pageNodes = ALL_VIBE_NODES.slice(startIndex, startIndex + 6);
    
    const radius = 120;
    const centerX = 155;
    const centerY = 155;
    const nodeSize = 48;

    return pageNodes.map((node, idx) => {
      // Symmetrical 60-degree divisions: 90°, 30°, 330° (or -30°), 270° (or -90°), 210°, 150°
      const angle = (idx * Math.PI) / 3; 

      // Polar trigonometry calculations
      const left = centerX - nodeSize / 2 + radius * Math.cos(angle);
      const top = centerY - nodeSize / 2 - radius * Math.sin(angle);

      // Distribute float animations
      const animGroup = (idx % 3) + 1;

      // Real online count from API
      const realCount = countForVibe(node.id);

      return {
        ...node,
        onlineCount: realCount > 0 ? realCount : node.onlineCount,
        left,
        top,
        animGroup,
      };
    });
  }, [vibePage, countForVibe]);

  const activeVibe = useMemo(() => {
    return ALL_VIBE_NODES.find(v => v.id === selectedVibe);
  }, [selectedVibe]);

  // Map real users to selected vibe by interest keyword overlap
  const matches = useMemo(() => {
    const keywords = VIBE_KEYWORDS[selectedVibe] || [];
    return realPeople.filter(person =>
      person.interests.some(interest =>
        keywords.some(kw => interest.toLowerCase().includes(kw))
      )
    );
  }, [selectedVibe, realPeople]);

  const glowColors = useMemo(() => {
    return activeVibe ? activeVibe.color : ['#A855F7', '#6366F1'];
  }, [activeVibe]);

  // Center core toggle pages handler
  const handleCenterPress = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.spring(pulseAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    const nextPage = vibePage === 0 ? 1 : 0;
    setVibePage(nextPage);

    // Auto-select first node of the new page
    const newSelectedVibeId = nextPage === 0 ? 'v1' : 'v7';
    setSelectedVibe(newSelectedVibeId);
  };

  const [vibeAlertMsg, setVibeAlertMsg] = useState('');
  const [vibeAlertVisible, setVibeAlertVisible] = useState(false);

  const onVibeConnect = (personName) => {
    setVibeAlertMsg(`We've sent a spark connection to ${personName} sharing your '${activeVibe.name}' vibe.`);
    setVibeAlertVisible(true);
  };

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Morphing background glows */}
      <View style={[styles.glowBlobPurple, { backgroundColor: glowColors[0] + '20' }]} pointerEvents="none" />
      <View style={[styles.glowBlobCyan, { backgroundColor: glowColors[1] + '15' }]} pointerEvents="none" />

      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vibes</Text>
          <Text style={styles.sub}>Tune into orbital channels and connect with shared matches</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Orbital Radar System */}
          <View style={styles.radarContainer}>
            {/* Concentric Circle Orbit Tracks */}
            <View style={styles.orbitOuter} />
            <View style={styles.orbitInner} />

            {/* Central Core Branding Hub (Toggles Sectors) */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }], zIndex: 30 }}>
              <TouchableOpacity onPress={handleCenterPress} style={styles.centerCore} activeOpacity={0.85}>
                <BlurView intensity={isDark ? 65 : 95} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={glowColors}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.centerLogoGrad}
                >
                  <Ionicons name="refresh" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Sector indicator badge */}
            <View style={styles.sectorBadge}>
              <Text style={styles.sectorBadgeText}>Sector {vibePage === 0 ? 'A' : 'B'}</Text>
            </View>

            {/* Orbiting Vibe Node Spheres */}
            {activeNodesList.map(node => {
              const active = node.id === selectedVibe;
              
              // Select float group
              let translateY = translateY1;
              if (node.animGroup === 2) translateY = translateY2;
              if (node.animGroup === 3) translateY = translateY3;

              return (
                <Animated.View
                  key={node.id}
                  style={[
                    styles.nodeWrapper,
                    { left: node.left, top: node.top, transform: [{ translateY }] }
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedVibe(node.id)}
                    activeOpacity={0.9}
                    style={styles.nodeTouchable}
                  >
                    <View style={[styles.nodeOrb, active && styles.nodeOrbActive]}>
                      <BlurView
                        intensity={active ? 80 : (isDark ? 55 : 85)}
                        tint={active ? (isDark ? "dark" : "light") : (isDark ? "dark" : "light")}
                        style={StyleSheet.absoluteFill}
                      />
                      
                      {active ? (
                        <LinearGradient
                          colors={node.color}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                          style={styles.nodeOrbInner}
                        >
                          <Ionicons name={node.icon} size={18} color="#fff" />
                        </LinearGradient>
                      ) : (
                        <Ionicons name={node.icon} size={18} color={isDark ? '#fff' : '#0D0F1A'} />
                      )}
                    </View>

                    {/* Pop-up label when node is active */}
                    {active && (
                      <BlurView intensity={65} tint={isDark ? "dark" : "light"} style={styles.activeLabelBox}>
                        <Text style={styles.activeLabelText}>{node.name}</Text>
                        <View style={styles.statusRow}>
                          <View style={[styles.statusPulseDot, { backgroundColor: node.color[0] }]} />
                          <Text style={styles.statusCountText}>{node.onlineCount} active</Text>
                        </View>
                      </BlurView>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Active Vibe Room Details Banner */}
          {activeVibe && (
            <View style={styles.detailsOuter}>
              <View style={styles.detailsBox}>
                <BlurView intensity={isDark ? 45 : 70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={[glowColors[0] + '20', 'transparent']}
                  style={styles.detailsAccGrad}
                />
                <Text style={[styles.detailsTagline, { color: glowColors[0] }]}>{activeVibe.tagline}</Text>
                <Text style={styles.detailsTitle}>{activeVibe.name}</Text>
              </View>
            </View>
          )}

          {/* Matches Spark Deck */}
          <Text style={styles.sectionLabel}>Match Spark Deck</Text>
            {loadingPeople ? (
              <View style={{ paddingHorizontal: 20, paddingVertical: 30, alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color="#A855F7" />
                <Text style={{ color: theme.textSec, fontSize: 13 }}>Finding people in this vibe…</Text>
              </View>
            ) : matches.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={width * 0.72 + 16}
                decelerationRate="fast"
                contentContainerStyle={styles.matchesDeck}
              >
                {matches.map(person => (
                  <View key={person.id} style={styles.sparkCard}>
                    <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                    
                    <Image source={{ uri: person.image }} style={styles.sparkImg} resizeMode="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']} style={styles.sparkOverlay} />

                    {/* Compat Rate Badge */}
                    <BlurView intensity={50} tint="dark" style={styles.compatBadge}>
                      <Ionicons name="heart" size={10} color="#FF375F" />
                      <Text style={styles.compatText}>{person.match}% Compatibility</Text>
                    </BlurView>

                    {/* Info Text */}
                    <View style={styles.sparkDetails}>
                      <Text style={styles.sparkName}>{person.name}, {person.age}</Text>
                      <Text style={styles.sparkBio} numberOfLines={2}>{person.bio}</Text>
                      
                      <TouchableOpacity
                        style={styles.connectBtn}
                        onPress={() => onVibeConnect(person.name)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={glowColors}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={styles.connectBtnGrad}
                        >
                          <Ionicons name="sparkles" size={12} color="#fff" />
                          <Text style={styles.connectText}>Send Spark</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={{ paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center', gap: 8 }}>
                <Ionicons name="planet-outline" size={36} color={theme.textFaint} />
                <Text style={{ color: theme.textSec, fontSize: 14, fontWeight: '700' }}>No one in this vibe yet</Text>
                <Text style={{ color: theme.textFaint, fontSize: 12, textAlign: 'center' }}>More people will appear here as they join HeartLink and set their interests.</Text>
              </View>
            )}
        </ScrollView>
      </SafeAreaView>

      <CustomAlertModal
        visible={vibeAlertVisible}
        title="Cosmic Wave Sent!"
        message={vibeAlertMsg}
        icon="planet-outline"
        iconColor="#FF007F"
        confirmText="Awesome"
        onConfirm={() => setVibeAlertVisible(false)}
      />
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, position: 'relative' },

  // Background glows
  glowBlobPurple: {
    position: 'absolute',
    top: height * 0.18,
    right: -85,
    width: 270,
    height: 270,
    borderRadius: 135,
    opacity: 0.8,
    zIndex: 0,
  },
  glowBlobCyan: {
    position: 'absolute',
    bottom: height * 0.2,
    left: -85,
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.7,
    zIndex: 0,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 14 : 14,
    paddingBottom: 4,
  },
  title: { fontSize: 28, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.6 },
  sub: { fontSize: 13, color: theme.textSec, marginTop: 4 },

  scroll: {
    paddingBottom: 110,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textFaint,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 14,
    marginTop: 18,
    paddingHorizontal: 20,
  },

  // Orbital Radar System
  radarContainer: {
    width: 310,
    height: 310,
    marginHorizontal: (width - 310) / 2,
    marginTop: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  orbitInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Center core hub
  centerCore: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  centerLogoGrad: {
    width: '100%',
    height: '100%',
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sector Badge
  sectorBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.12)',
    zIndex: 25,
  },
  sectorBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  // Node wrapper
  nodeWrapper: {
    position: 'absolute',
    width: 48,
    height: 48,
    zIndex: 20,
  },
  nodeTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  nodeOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  nodeOrbActive: {
    borderColor: '#fff',
    borderWidth: 1.8,
  },
  nodeOrbInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Active label popover style
  activeLabelBox: {
    position: 'absolute',
    bottom: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 110,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  statusPulseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusCountText: {
    fontSize: 8,
    color: theme.textFaint,
    fontWeight: '700',
  },

  // Active Vibe Details
  detailsOuter: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  detailsBox: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.glass,
    overflow: 'hidden',
    position: 'relative',
  },
  detailsAccGrad: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
  },
  detailsTagline: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: -0.2,
  },

  // Spark Matches Deck
  matchesDeck: {
    paddingHorizontal: 20,
    gap: 16,
  },
  sparkCard: {
    width: width * 0.72,
    height: 290,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.glass,
    overflow: 'hidden',
    position: 'relative',
  },
  sparkImg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkOverlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
  },
  compatBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  compatText: {
    color: '#fff',
    fontSize: 9.5,
    fontWeight: '800',
  },
  sparkDetails: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
  },
  sparkName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sparkBio: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  connectBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  connectBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  connectText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});
