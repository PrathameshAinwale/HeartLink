// src/screens/DiscoverScreen.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, PanResponder, Dimensions, Image,
  SafeAreaView, ScrollView, FlatList, StatusBar, Platform, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

const PROFILES = [
  {
    id: 1,
    name: 'Samirokta Rachin', age: 25, job: 'Fashion Model',
    bio: 'Living colorfully, one outfit at a time. I believe style is a way to say who you are without having to speak. Always chasing the next adventure ✈️🎨',
    location: 'New York', distance: '10 km away', compatibility: 95,
    images: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=900',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900',
    ],
    interests: ['Fashion', 'Travel', 'Photography', 'Coffee', 'Yoga'],
    mutuals: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
    ],
    tag: 'Active today',
  },
  {
    id: 2,
    name: 'Albert Flores', age: 24, job: 'Surfer & Designer',
    bio: "Golden hour junkie. Street food enthusiast. Let's get lost somewhere beautiful.",
    location: 'Los Angeles', distance: '4 km away', compatibility: 88,
    images: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=900',
    ],
    interests: ['Surfing', 'Design', 'Art', 'Music'],
    mutuals: [],
    tag: 'Active today',
  },
  {
    id: 3,
    name: 'Johnson markey', age: 26, job: 'Fitness Coach',
    bio: 'Always focus on the grind. Hard work pays off.',
    location: 'Miami', distance: '12 km away', compatibility: 91,
    images: [
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=900',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900',
    ],
    interests: ['Fitness', 'Cooking', 'Travel'],
    mutuals: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
    ],
    tag: 'Popular',
  },
  {
    id: 4,
    name: 'Camer', age: 23, job: 'Photographer',
    bio: 'Capturing moments that last forever.',
    location: 'San Francisco', distance: '8 km away', compatibility: 85,
    images: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=900',
    ],
    interests: ['Photography', 'Music', 'Hiking'],
    mutuals: [],
    tag: 'New here',
  },
  {
    id: 5,
    name: 'Sophia Carter', age: 23, job: 'Creative Director',
    bio: 'Chasing sunsets and new adventures.',
    location: 'Chicago', distance: '15 km away', compatibility: 92,
    images: [
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=900',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900',
    ],
    interests: ['Art', 'Coffee', 'Yoga'],
    mutuals: [],
    tag: 'Active today',
  }
];

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [idx, setIdx] = useState(0);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [sheetPhotoIdx, setSheetPhotoIdx] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  const cardHeightRef = useRef(height * 0.5);
  const pan = useRef(new Animated.ValueXY()).current;
  const likeAnim = useRef(new Animated.Value(0)).current;
  const nopeAnim = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(height)).current;

  // Pulse animations for overlays
  const shimAnim = useRef(new Animated.Value(0.3)).current;

  const matchBgOpacity = pan.x.interpolate({ inputRange: [0, width * 0.4], outputRange: [0, 1], extrapolate: 'clamp' });
  const passBgOpacity = pan.x.interpolate({ inputRange: [-width * 0.4, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const rotate = pan.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-10deg', '0deg', '10deg'] });

  const filteredProfiles = PROFILES;
  const cur = filteredProfiles[idx];

  const detailsOpacity = useRef(new Animated.Value(1)).current;

  // Reset photo progress & fade in details on index change
  useEffect(() => {
    setPhotoIdx(0);
    detailsOpacity.setValue(0);
    Animated.timing(detailsOpacity, {
      toValue: 1,
      duration: 380,
      easing: Easing.bezier(0.25, 1, 0.4, 1),
      useNativeDriver: false,
    }).start();
  }, [idx]);

  const showDetailRef = useRef(false);
  useEffect(() => {
    showDetailRef.current = showDetail;
  }, [showDetail]);

  // Navigation focus listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setPhotoIdx(0);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // Prefetch all profile images to prevent image load flashes
    PROFILES.forEach(p => {
      if (p.images) {
        p.images.forEach(img => {
          Image.prefetch(img).catch(() => { });
        });
      }
    });

    // Shimmer loops
    Animated.loop(Animated.sequence([
      Animated.timing(shimAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
      Animated.timing(shimAnim, { toValue: 0.3, duration: 1000, useNativeDriver: false }),
    ])).start();
  }, []);

  const openDetail = () => {
    setShowDetail(true);
    Animated.spring(sheetY, { toValue: 0, tension: 35, friction: 8, useNativeDriver: false }).start();
  };

  const closeDetail = () => {
    Animated.timing(sheetY, { toValue: height, duration: 250, useNativeDriver: false }).start(() => setShowDetail(false));
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: (e) => {
      // Ignore gestures if bottom detail sheet is open
      if (showDetailRef.current) {
        return false;
      }
      // Ignore responder if touch is in the bottom card text overlay
      const touchY = e.nativeEvent.locationY;
      if (touchY > cardHeightRef.current - 90) {
        return false;
      }
      return true;
    },
    onMoveShouldSetPanResponder: (e, gesture) => {
      if (showDetailRef.current) {
        return false;
      }
      const touchY = e.nativeEvent.locationY;
      if (touchY > cardHeightRef.current - 90) {
        return false;
      }
      return Math.abs(gesture.dx) > 10;
    },
    onPanResponderMove: (_, gesture) => {
      pan.setValue({ x: gesture.dx, y: gesture.dy });
      if (gesture.dx > 40) {
        likeAnim.setValue((gesture.dx - 40) / 100);
        nopeAnim.setValue(0);
      } else if (gesture.dx < -40) {
        nopeAnim.setValue((-gesture.dx - 40) / 100);
        likeAnim.setValue(0);
      } else {
        likeAnim.setValue(0);
        nopeAnim.setValue(0);
      }
    },
    onPanResponderRelease: (e, gesture) => {
      likeAnim.setValue(0);
      nopeAnim.setValue(0);
      if (gesture.dx > 120) {
        swipe('right');
      } else if (gesture.dx < -120) {
        swipe('left');
      } else if (Math.abs(gesture.dx) < 8 && Math.abs(gesture.dy) < 8) {
        // Click coordinate calculations for photo cycling
        const tapX = e.nativeEvent.locationX;
        const cardW = width - 48;
        if (tapX < cardW * 0.35) {
          setPhotoIdx(p => Math.max(0, p - 1));
        } else if (tapX > cardW * 0.65) {
          setPhotoIdx(p => Math.min(cur.images.length - 1, p + 1));
        } else {
          openDetail();
        }
      } else {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 5 }).start();
      }
    },
  })).current;

  const swipe = (dir) => {
    Animated.timing(pan, {
      toValue: { x: dir === 'right' ? width * 1.6 : -width * 1.6, y: 0 },
      duration: 450,
      easing: Easing.bezier(0.25, 1, 0.4, 1),
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      setIdx(p => (p + 1) % PROFILES.length);
      setPhotoIdx(0);
    });
  };

  // Real-time background cards transitions matching swipe drag distance
  const nextCardScale = pan.x.interpolate({
    inputRange: [-width * 0.6, 0, width * 0.6],
    outputRange: [1, 0.97, 1],
    extrapolate: 'clamp'
  });
  const nextCardTranslateY = pan.x.interpolate({
    inputRange: [-width * 0.6, 0, width * 0.6],
    outputRange: [0, -8, 0],
    extrapolate: 'clamp'
  });
  const nextCardOpacity = pan.x.interpolate({
    inputRange: [-width * 0.6, 0, width * 0.6],
    outputRange: [1, 0.8, 1],
    extrapolate: 'clamp'
  });

  const backCardScale = pan.x.interpolate({
    inputRange: [-width * 0.6, 0, width * 0.6],
    outputRange: [0.97, 0.93, 0.97],
    extrapolate: 'clamp'
  });
  const backCardTranslateY = pan.x.interpolate({
    inputRange: [-width * 0.6, 0, width * 0.6],
    outputRange: [-8, -16, -8],
    extrapolate: 'clamp'
  });
  const backCardOpacity = pan.x.interpolate({
    inputRange: [-width * 0.6, 0, width * 0.6],
    outputRange: [0.8, 0.5, 0.8],
    extrapolate: 'clamp'
  });

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.headerWrap} edges={['top']}>
        <View style={styles.headerPill}>
          <TouchableOpacity style={styles.headerLeftBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
            <Ionicons name="person" size={17} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <Text style={styles.headerCenterTitle}>Heart Link</Text>
          
          <TouchableOpacity style={styles.headerRightBtn} onPress={() => navigation.navigate('Requests')} activeOpacity={0.7}>
            <Ionicons name="notifications" size={19} color={theme.textPrimary} />
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>5</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.mainContent}>
        {/* Glowing background blobs for glassmorphic depth */}
        <View style={styles.glowBlobFuchsia} pointerEvents="none" />
        <View style={styles.glowBlobCyan} pointerEvents="none" />
        <View style={styles.glowBlobPurple} pointerEvents="none" />

        {/* Swipe Feedback Background Animations */}
        <Animated.View style={[styles.swipeBgBase, { backgroundColor: theme.isDark ? 'rgba(48,209,88,0.06)' : 'rgba(48,209,88,0.12)', opacity: matchBgOpacity }]} pointerEvents="none">
          <LinearGradient colors={theme.isDark ? ['rgba(48,209,88,0.22)', 'transparent'] : ['rgba(48,209,88,0.3)', 'transparent']} style={styles.radialGlow} />
          <View style={styles.swipeBgContent}>
            <Ionicons name="heart" size={100} color="#30D158" />
            <Text style={[styles.swipeBgLabel, { color: '#30D158' }]}>LIKE</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.swipeBgBase, { backgroundColor: theme.isDark ? 'rgba(255,55,95,0.06)' : 'rgba(255,55,95,0.12)', opacity: passBgOpacity }]} pointerEvents="none">
          <LinearGradient colors={theme.isDark ? ['rgba(255,55,95,0.22)', 'transparent'] : ['rgba(255,55,95,0.3)', 'transparent']} style={styles.radialGlow} />
          <View style={styles.swipeBgContent}>
            <Ionicons name="close-outline" size={110} color="#FF375F" />
            <Text style={[styles.swipeBgLabel, { color: '#FF375F' }]}>PASS</Text>
          </View>
        </Animated.View>

        {/* ══════════════════════════════════════════════════════════════════
             CARD DECK AREA (Privacy stack, other profiles fully hidden)
        ══════════════════════════════════════════════════════════════════ */}
        <View
          style={styles.cardStackContainer}
          onLayout={(e) => {
            cardHeightRef.current = e.nativeEvent.layout.height;
          }}
        >
          {/* Card 2 (back-most, renders profile after next) */}
          {PROFILES.length > 2 && (
            <Animated.View style={[
              styles.card,
              styles.cardBack2,
              {
                opacity: backCardOpacity,
                transform: [
                  { translateY: backCardTranslateY },
                  { scale: backCardScale }
                ]
              }
            ]}>
              <Image source={{ uri: PROFILES[(idx + 2) % PROFILES.length].images[0] }} style={styles.cardPhoto} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']} style={styles.bottomGrad} />
            </Animated.View>
          )}

          {/* Card 1 (middle, renders next profile) */}
          {PROFILES.length > 1 && (
            <Animated.View style={[
              styles.card,
              styles.cardBack1,
              {
                opacity: nextCardOpacity,
                transform: [
                  { translateY: nextCardTranslateY },
                  { scale: nextCardScale }
                ]
              }
            ]}>
              <Image source={{ uri: PROFILES[(idx + 1) % PROFILES.length].images[0] }} style={styles.cardPhoto} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']} style={styles.bottomGrad} />
            </Animated.View>
          )}

          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.card, styles.cardActive, { transform: [{ translateX: pan.x }, { rotate }] }]}
          >
            {/* Active Photo - Always 100% solid opacity with idx key to prevent old photo flash */}
            <Image key={idx} source={{ uri: cur.images[photoIdx] }} style={styles.cardPhoto} />

            {/* Gradient shadows */}
            <LinearGradient colors={['rgba(0,0,0,0.15)', 'transparent']} style={styles.topGrad} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']} style={styles.bottomGrad} />

            {/* Overlapping progress indicators and details overlay (faded in dynamically) */}
            <Animated.View style={{ opacity: detailsOpacity, flex: 1, width: '100%', height: '100%', position: 'absolute' }}>

              {/* Profile details directly floating on bottom-left of card (no capsule) */}
              <TouchableOpacity activeOpacity={0.9} onPress={openDetail} style={styles.cardTextOverlayBottomLeft}>
                <Text style={styles.cardProfileName}>{cur.name}, {cur.age}</Text>
                <Text style={styles.cardProfileJob}>{cur.job}</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
             TACTILE ACTIONS ROW (Pass X, Center Boost, Like Heart)
        ══════════════════════════════════════════════════════════════════ */}
        <View style={styles.actionsRowContainer}>
          {/* Pass Button */}
          <TouchableOpacity
            onPress={() => swipe('left')}
            activeOpacity={0.8}
            style={styles.actionBtnSmallX}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Boost Button (Lightning) */}
          <TouchableOpacity
            onPress={openDetail}
            activeOpacity={0.8}
            style={styles.actionBtnLargeLightning}
          >
            <LinearGradient
              colors={['#FF007F', '#B5179E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="flash" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity
            onPress={() => swipe('right')}
            activeOpacity={0.8}
            style={styles.actionBtnSmallHeart}
          >
            <Ionicons name="heart" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Profile Detail Bottom Sheet ────────────────────────────────── */}
      {showDetail && (
        <Animated.View style={[styles.detailSheet, { transform: [{ translateY: sheetY }] }]}>
          <LinearGradient
            colors={isDark ? ['#140E2D', '#0A051C'] : ['#F2EBFF', '#FFFFFF']}
            style={StyleSheet.absoluteFill}
          />

          {/* Drag handle */}
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
            decelerationRate="normal"
          >
            {/* Photo carousel */}
            <View style={styles.sheetPhotoWrap}>
              <FlatList
                data={cur.images}
                keyExtractor={(_, i) => i.toString()}
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                onMomentumScrollEnd={(e) => {
                  const contentOffset = e.nativeEvent.contentOffset.x;
                  const activeIndex = Math.round(contentOffset / width);
                  setSheetPhotoIdx(activeIndex);
                }}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={styles.sheetPhoto} />
                )}
              />
              <LinearGradient
                colors={['transparent', theme.bgDark]}
                style={styles.sheetPhotoGrad}
              />
              {/* Photo count dots */}
              <View style={styles.sheetPhotoDots}>
                {cur.images.map((_, i) => (
                  <View key={i} style={[styles.sheetDot, i === sheetPhotoIdx && styles.sheetDotActive]} />
                ))}
              </View>
            </View>

            <View style={styles.sheetBody}>
              {/* Name row + compat */}
              <View style={styles.sheetNameRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName}>{cur.name}, {cur.age}</Text>
                  <Text style={styles.sheetJob}>{cur.job} · {cur.distance}</Text>
                </View>
                <View style={styles.sheetCompatBadge}>
                  <Text style={styles.sheetCompatNum}>{cur.compatibility}%</Text>
                  <Text style={styles.sheetCompatLbl}>match</Text>
                </View>
              </View>

              {/* Bio */}
              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>ABOUT</Text>
                <Text style={styles.sheetBio}>{cur.bio}</Text>
              </View>

              {/* Interests */}
              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>INTERESTS</Text>
                <View style={styles.tagsRow}>
                  {cur.interests.map((t, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Mutuals */}
              {cur.mutuals.length > 0 && (
                <View style={styles.sheetCard}>
                  <Text style={styles.sheetCardLabel}>MUTUAL FRIENDS</Text>
                  <View style={styles.mutualDetailRow}>
                    {cur.mutuals.map((av, i) => (
                      <Image key={i} source={{ uri: av }} style={styles.mutualDetailAv} />
                    ))}
                    <Text style={styles.mutualDetailTxt}>
                      {cur.mutuals.length} mutual friend{cur.mutuals.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* Photo Gallery Grid */}
              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>GALLERY</Text>
                <View style={styles.sheetGalleryGrid}>
                  {cur.images.map((img, i) => (
                    <View key={i} style={styles.sheetGalleryItem}>
                      <Image source={{ uri: img }} style={styles.sheetGalleryImg} />
                    </View>
                  ))}
                </View>
              </View>

              {/* Sheet actions */}
              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={styles.sheetBtnPass}
                  onPress={() => { closeDetail(); }}
                >
                  <Ionicons name="close" size={22} color={theme.accent} />
                  <Text style={styles.sheetBtnPassTxt}>Pass</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetBtnLike}
                  onPress={() => { closeDetail(); }}
                >
                  <LinearGradient colors={theme.gradientAccent} style={styles.sheetBtnLikeGrad}>
                    <Ionicons name="heart" size={20} color="#fff" />
                    <Text style={styles.sheetBtnLikeTxt}>Like</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={{ height: 110 }} />
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.sheetCloseBtn} onPress={closeDetail}>
            <View style={styles.sheetCloseBtnInner}>
              <Ionicons name="chevron-down" size={20} color={theme.textPrimary} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  root: { flex: 1 },
  mainContent: {
    flex: 1,
    paddingBottom: 95, // leaves space for bottom tab navigator bar
  },

  // ── Separated Header Bar (Profile User, Center Name, Right bell) ──────────
  headerWrap: {
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  headerLeftBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1.2,
    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1.2,
    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FF375F',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: theme.isDark ? '#0D0214' : '#fff',
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: '900',
  },
  headerCenterTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-medium',
    fontSize: 22,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: -0.6,
    textShadowColor: theme.isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Glowing background blobs for glassmorphic depth
  glowBlobFuchsia: {
    position: 'absolute',
    top: height * 0.15,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 0, 127, 0.26)',
    opacity: 0.85,
    zIndex: 0,
  },
  glowBlobCyan: {
    position: 'absolute',
    bottom: height * 0.1,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 191, 255, 0.20)',
    opacity: 0.75,
    zIndex: 0,
  },
  glowBlobPurple: {
    position: 'absolute',
    top: height * 0.48,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(123, 47, 190, 0.24)',
    opacity: 0.75,
    zIndex: 0,
  },

  // ── Card Stack Container (Layered Privacy deck) ──────────────────────────
  cardStackContainer: {
    flex: 1,
    marginTop: 12,
    marginBottom: height * 0.015,
    width: width - 48,
    alignSelf: 'center',
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardBack2: {
    transform: [{ translateY: -16 }, { scale: 0.93 }],
    opacity: 0.5,
    zIndex: 1,
  },
  cardBack1: {
    transform: [{ translateY: -8 }, { scale: 0.97 }],
    opacity: 0.8,
    zIndex: 2,
  },
  cardActive: {
    zIndex: 3,
  },
  cardPhoto: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%', resizeMode: 'cover',
  },
  topGrad: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 90,
  },
  bottomGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '40%',
  },

  // Centered circular dots photo indicators
  indicatorContainer: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 20,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
  },
  indicatorDotActive: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },

  // Match score overlay badge (Top Right)
  topRightCompatBadge: {
    position: 'absolute',
    top: 22,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  compatNum: {
    fontSize: 12,
    fontWeight: '950',
    color: '#fff',
  },
  compatText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
  },

  // Floating user details inside card bottom-left (no capsule overlay)
  cardTextOverlayBottomLeft: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 10,
  },
  cardProfileName: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-medium',
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.6,
    marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  cardProfileJob: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif-light',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ── Tactile Actions Row (Pass, Center Boost, Like) below Card stack ──────
  actionsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginVertical: height * 0.015,
  },
  actionBtnSmallX: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4A89FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A89FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnLargeLightning: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  actionBtnSmallHeart: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8A66FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8A66FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },

  // Stamps
  stamp: {
    position: 'absolute', top: 40,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12, borderWidth: 3, zIndex: 30,
  },
  stampLike: {
    left: 20, borderColor: '#30D158',
    backgroundColor: 'rgba(48,209,88,0.18)',
    transform: [{ rotate: '-18deg' }],
  },
  stampNope: {
    right: 20, borderColor: '#FF375F',
    backgroundColor: 'rgba(255,55,95,0.18)',
    transform: [{ rotate: '18deg' }],
  },
  stampText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1.5 },

  // Swipe Background Overlays
  swipeBgBase: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 5,
  },
  radialGlow: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    alignSelf: 'center',
    top: height * 0.5 - width * 0.6,
  },
  swipeBgContent: {
    alignItems: 'center',
    gap: 14,
    zIndex: 10,
  },
  swipeBgLabel: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // ── Profile Detail Bottom Sheet ─────────────────────────────────────────
  detailSheet: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    overflow: 'hidden', zIndex: 100,
  },
  sheetHandleWrap: {
    position: 'absolute',
    top: 24, left: 0, right: 0,
    alignItems: 'center', zIndex: 20,
  },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.40)' },

  sheetPhotoWrap: { height: height * 0.56, overflow: 'hidden', position: 'relative' },
  sheetPhoto: { width, height: height * 0.56, resizeMode: 'cover' },
  sheetPhotoGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 },
  sheetPhotoDots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 10,
  },
  sheetDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  sheetDotActive: {
    width: 18, height: 6, borderRadius: 3,
    backgroundColor: '#1F2026',
  },

  sheetBody: { paddingHorizontal: 20, paddingTop: 20 },
  sheetNameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  sheetName: { fontSize: 28, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.6 },
  sheetJob: { fontSize: 14, color: theme.textSec, marginTop: 4 },
  sheetCompatBadge: {
    backgroundColor: 'rgba(255,55,95,0.12)',
    borderRadius: 18, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,55,95,0.25)',
  },
  sheetCompatNum: { fontSize: 22, fontWeight: '900', color: '#FF375F' },
  sheetCompatLbl: { fontSize: 11, color: theme.textSec, fontWeight: '600' },

  sheetCard: {
    backgroundColor: theme.isDark ? '#1C1236' : '#FFFFFF',
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: theme.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sheetCardLabel: {
    fontSize: 10, fontWeight: '800', color: theme.textFaint,
    letterSpacing: 1.5, marginBottom: 10,
  },
  sheetBio: { fontSize: 15, color: theme.textSec, lineHeight: 23 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: theme.isDark ? '#2B1E4D' : '#F2EBFF',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: theme.border,
  },
  tagText: { color: theme.textPrimary, fontSize: 13, fontWeight: '600' },
  mutualDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mutualDetailAv: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'rgba(0,0,0,0.06)' },
  mutualDetailTxt: { fontSize: 13, color: theme.textSec, flex: 1 },

  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  sheetBtnPass: {
    flex: 1, height: 52, borderRadius: 26,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.80)' : 'rgba(0,0,0,0.04)',
    borderWidth: 1.5, borderColor: 'rgba(255,55,95,0.35)',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  sheetBtnPassTxt: { color: '#FF375F', fontWeight: '800', fontSize: 15 },
  sheetBtnLike: { flex: 2, height: 52, borderRadius: 26, overflow: 'hidden' },
  sheetBtnLikeGrad: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  sheetBtnLikeTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },

  sheetCloseBtn: { position: 'absolute', top: 24, right: 18, zIndex: 20 },
  sheetCloseBtnInner: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.05)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },

  // Empty state
  glassEmptyCard: {
    backgroundColor: theme.glass, borderRadius: 28, padding: 32,
    alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: theme.border,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
  emptySub: { fontSize: 14, color: theme.textSec, textAlign: 'center', lineHeight: 21 },
  resetGrad: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 26 },
  resetText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});