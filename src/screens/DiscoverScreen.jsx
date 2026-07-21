// src/screens/DiscoverScreen.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Animated, Dimensions, Image,
  SafeAreaView, ScrollView, FlatList, StatusBar, Platform, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { apiSwipeUser, apiGetDiscoveryFeed, apiGetRequests } from '../services/api';
import { ensureArray } from '../utils/helpers';

const { width, height } = Dimensions.get('window');

const PROFILES = [
  {
    id: 1,
    name: 'Samirokta Rachin', age: 25, gender: 'Female', job: 'Fashion Model',
    bio: 'Living colorfully, one outfit at a time. I believe style is a way to say who you are without having to speak. Always chasing the next adventure.',
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
    name: 'Albert Flores', age: 24, gender: 'Male', job: 'Surfer & Designer',
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
    name: 'Johnson markey', age: 26, gender: 'Male', job: 'Fitness Coach',
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
    name: 'Camer', age: 23, gender: 'Female', job: 'Photographer',
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
    name: 'Sophia Carter', age: 23, gender: 'Female', job: 'Creative Director',
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

// Pre-cache all images
PROFILES.forEach(p => {
  if (p.images) {
    p.images.forEach(img => {
      Image.prefetch(img).catch(() => { });
    });
  }
});

// Varied reaction copy — a fresh one is picked each time a button is pressed
const LIKE_MESSAGES = [
  { title: 'Liked', subtitle: 'Sending your interest their way' },
  { title: "That's a yes", subtitle: 'Fingers crossed for a match' },
  { title: 'Good taste', subtitle: 'Your like is on its way' },
  { title: 'Sent with confidence', subtitle: 'Now we wait and see' },
  { title: 'Nice pick', subtitle: 'They might just like you back' },
];

const PASS_MESSAGES = [
  { title: 'Passed', subtitle: 'Finding your next match' },
  { title: 'Not this one', subtitle: 'Onto someone better suited' },
  { title: 'Moving on', subtitle: 'The right one is still out there' },
  { title: 'Next up', subtitle: 'Bringing a new profile your way' },
  { title: 'Swiped past', subtitle: "That's okay, keep exploring" },
];

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [sheetPhotoIdx, setSheetPhotoIdx] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBackgroundCards, setShowBackgroundCards] = useState(true);
  const [likeMsgIdx, setLikeMsgIdx] = useState(0);
  const [passMsgIdx, setPassMsgIdx] = useState(0);

  const cardHeightRef = useRef(height * 0.5);

  // Create animated values for each card
  const card1Pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const card2Pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const card3Pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const card1Scale = useRef(new Animated.Value(1)).current;
  const card2Scale = useRef(new Animated.Value(0.97)).current;
  const card3Scale = useRef(new Animated.Value(0.93)).current;

  const card1Opacity = useRef(new Animated.Value(1)).current;
  const card2Opacity = useRef(new Animated.Value(0.8)).current;
  const card3Opacity = useRef(new Animated.Value(0.5)).current;

  // Reaction stamp + background flash — now triggered only by the action buttons
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const nopeOpacity = useRef(new Animated.Value(0)).current;
  const likeFlashOpacity = useRef(new Animated.Value(0)).current;
  const passFlashOpacity = useRef(new Animated.Value(0)).current;

  const sheetY = useRef(new Animated.Value(height)).current;

  // Active card position (only ever driven programmatically now, never by touch/drag)
  const pan = card1Pos;
  const rotate = pan.x.interpolate({
    inputRange: [-width * 0.8, 0, width * 0.8],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp'
  });

  const { user } = useAuth();
  const [dbProfiles, setDbProfiles] = useState([]);
  const [requestCount, setRequestCount] = useState(0);

  const formatApiProfile = (u) => {
    let userPhotos = [];
    const photosArr = ensureArray(u.photos);
    if (photosArr.length > 0) {
      userPhotos = photosArr.map(p => (typeof p === 'string' ? p : p.photo_url || p.uri)).filter(Boolean);
    }
    if (u.avatar && !userPhotos.includes(u.avatar)) {
      userPhotos.unshift(u.avatar);
    }
    if (userPhotos.length === 0) {
      userPhotos = ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900'];
    }

    const cityState = u.city ? `${u.city}${u.state ? ', ' + u.state : ''}` : (u.location || 'Nearby');

    return {
      id: u.id,
      name: u.name || 'Member',
      age: u.age || 25,
      gender: u.gender || 'Female',
      job: u.job || 'Member',
      bio: u.bio || 'Living life and finding meaningful connections on HeartLink.',
      location: cityState,
      distance: 'Nearby',
      compatibility: u.compatibility_score || 92,
      images: userPhotos,
      interests: ensureArray(u.interests, ['Travel', 'Coffee', 'Music']),
      mutuals: ensureArray(u.mutuals, []),
      tag: 'Active today',
    };
  };

  const fetchFeed = async () => {
    try {
      const [fRes, rRes] = await Promise.all([
        apiGetDiscoveryFeed().catch(() => null),
        apiGetRequests().catch(() => null),
      ]);

      if (fRes?.profiles && Array.isArray(fRes.profiles) && fRes.profiles.length > 0) {
        const formatted = fRes.profiles.map(formatApiProfile);
        setDbProfiles(formatted);
      }

      if (rRes?.requests && Array.isArray(rRes.requests)) {
        setRequestCount(rRes.requests.length);
      } else {
        setRequestCount(0);
      }
    } catch (err) {
      console.warn('Discovery Feed fetch error:', err?.message);
    }
  };

  useEffect(() => {
    fetchFeed();
    const unsubscribe = navigation.addListener('focus', () => {
      setPhotoIdx(0);
      fetchFeed();
    });
    return unsubscribe;
  }, [navigation]);

  const activeProfiles = useMemo(() => {
    const userGender = (user?.gender || 'Man').toLowerCase();
    const isMaleUser = userGender === 'man' || userGender === 'male';
    const targetGenders = isMaleUser ? ['female', 'woman'] : ['male', 'man'];

    if (dbProfiles.length > 0) {
      const filtered = dbProfiles.filter(p => !p.gender || targetGenders.includes(p.gender.toLowerCase()));
      return filtered.length > 0 ? filtered : dbProfiles;
    }

    return PROFILES.filter(p => p.gender && targetGenders.includes(p.gender.toLowerCase()));
  }, [dbProfiles, user]);

  // Get profiles for the 3 cards safely without infinite looping
  const getProfileAt = (offset) => {
    if (!activeProfiles || activeProfiles.length === 0) return null;
    const idx = currentIndex + offset;
    if (idx >= activeProfiles.length) return null;
    return activeProfiles[idx];
  };

  const currentProfile = getProfileAt(0);
  const nextProfile = getProfileAt(1);
  const nextNextProfile = getProfileAt(2);

  const detailsOpacity = useRef(new Animated.Value(1)).current;

  const showDetailRef = useRef(false);
  useEffect(() => {
    showDetailRef.current = showDetail;
  }, [showDetail]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setPhotoIdx(0);
    });
    return unsubscribe;
  }, [navigation]);

  const openDetail = () => {
    setShowDetail(true);
    Animated.spring(sheetY, { toValue: 0, tension: 35, friction: 8, useNativeDriver: false }).start();
  };

  const closeDetail = () => {
    Animated.timing(sheetY, { toValue: height, duration: 250, useNativeDriver: false }).start(() => setShowDetail(false));
  };

  const resetCardPositions = () => {
    // Reset all cards to default positions instantly
    card1Pos.setValue({ x: 0, y: 0 });
    card2Pos.setValue({ x: 0, y: 0 });
    card3Pos.setValue({ x: 0, y: 0 });
    card1Scale.setValue(1);
    card2Scale.setValue(0.97);
    card3Scale.setValue(0.93);
    card1Opacity.setValue(1);
    card2Opacity.setValue(0.8);
    card3Opacity.setValue(0.5);
    likeOpacity.setValue(0);
    nopeOpacity.setValue(0);
    likeFlashOpacity.setValue(0);
    passFlashOpacity.setValue(0);
  };

  // "Like" action — 3-step sequence:
  // 1. Present profile swipes off (background cards hidden so next profile does NOT peek)
  // 2. Message appears and disappears on clean screen
  // 3. Next profile comes smoothly onto user screen
  const moveToNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPhotoIdx(0);

    const currentP = currentProfile;
    if (currentP && currentP.id) {
      apiSwipeUser(currentP.id, 'like').catch(() => {});
    }

    setLikeMsgIdx(Math.floor(Math.random() * LIKE_MESSAGES.length));
    likeOpacity.setValue(0);
    likeFlashOpacity.setValue(0);

    // Step 1: Hide background cards & swipe present profile off screen
    card2Opacity.setValue(0);
    card3Opacity.setValue(0);

    Animated.parallel([
      Animated.timing(pan.x, {
        toValue: width * 1.4,
        duration: 280,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(card1Scale, {
        toValue: 0.85,
        duration: 280,
        useNativeDriver: false,
      }),
      Animated.timing(card1Opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Step 2: Present profile is completely gone. Show reaction message on clean screen.
      Animated.parallel([
        Animated.sequence([
          Animated.timing(likeOpacity, { toValue: 1, duration: 180, useNativeDriver: false, easing: Easing.out(Easing.cubic) }),
          Animated.delay(350),
          Animated.timing(likeOpacity, { toValue: 0, duration: 180, useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.timing(likeFlashOpacity, { toValue: 0.6, duration: 180, useNativeDriver: false }),
          Animated.delay(350),
          Animated.timing(likeFlashOpacity, { toValue: 0, duration: 180, useNativeDriver: false }),
        ])
      ]).start(() => {
        // Step 3: Remove swiped user from state & auto-reload stack
        setDbProfiles(prev => prev.filter(p => p.id !== currentP?.id));
        card1Pos.setValue({ x: 0, y: 0 });
        card1Scale.setValue(0.92);
        card1Opacity.setValue(0);
        card2Scale.setValue(0.97);
        card2Opacity.setValue(0);
        card3Scale.setValue(0.93);
        card3Opacity.setValue(0);

        Animated.parallel([
          Animated.timing(card1Opacity, {
            toValue: 1,
            duration: 320,
            useNativeDriver: false,
            easing: Easing.out(Easing.quad),
          }),
          Animated.spring(card1Scale, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }),
          Animated.timing(card2Opacity, {
            toValue: 0.8,
            duration: 320,
            useNativeDriver: false,
          }),
          Animated.timing(card3Opacity, {
            toValue: 0.5,
            duration: 320,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setIsAnimating(false);
        });
      });
    });
  };

  const moveToPrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPhotoIdx(0);

    const currentP = currentProfile;
    if (currentP && currentP.id) {
      apiSwipeUser(currentP.id, 'pass').catch(() => {});
    }

    setPassMsgIdx(Math.floor(Math.random() * PASS_MESSAGES.length));
    nopeOpacity.setValue(0);
    passFlashOpacity.setValue(0);

    // Step 1: Hide background cards & swipe present profile off screen to left
    card2Opacity.setValue(0);
    card3Opacity.setValue(0);

    Animated.parallel([
      Animated.timing(pan.x, {
        toValue: -width * 1.4,
        duration: 280,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(card1Scale, {
        toValue: 0.85,
        duration: 280,
        useNativeDriver: false,
      }),
      Animated.timing(card1Opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(nopeOpacity, { toValue: 1, duration: 180, useNativeDriver: false, easing: Easing.out(Easing.cubic) }),
          Animated.delay(350),
          Animated.timing(nopeOpacity, { toValue: 0, duration: 180, useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.timing(passFlashOpacity, { toValue: 0.6, duration: 180, useNativeDriver: false }),
          Animated.delay(350),
          Animated.timing(passFlashOpacity, { toValue: 0, duration: 180, useNativeDriver: false }),
        ])
      ]).start(() => {
        setDbProfiles(prev => prev.filter(p => p.id !== currentP?.id));
        card1Pos.setValue({ x: 0, y: 0 });
        card1Scale.setValue(0.92);
        card1Opacity.setValue(0);
        card2Scale.setValue(0.97);
        card2Opacity.setValue(0);
        card3Scale.setValue(0.93);
        card3Opacity.setValue(0);

        Animated.parallel([
          Animated.timing(card1Opacity, {
            toValue: 1,
            duration: 320,
            useNativeDriver: false,
            easing: Easing.out(Easing.quad),
          }),
          Animated.spring(card1Scale, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }),
          Animated.timing(card2Opacity, {
            toValue: 0.8,
            duration: 320,
            useNativeDriver: false,
          }),
          Animated.timing(card3Opacity, {
            toValue: 0.5,
            duration: 320,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setIsAnimating(false);
        });
      });
    });
  };

  // Tap zones on the active card: left third = previous photo, right third = next photo,
  // center = open detail sheet. No drag/swipe gesture handling — the card never
  // follows the finger, only the action buttons below trigger like/pass.
  const handlePhotoTapLeft = () => {
    if (isAnimating) return;
    setPhotoIdx(p => Math.max(0, p - 1));
  };
  const handlePhotoTapRight = () => {
    if (isAnimating) return;
    setPhotoIdx(p => Math.min(currentProfile.images.length - 1, p + 1));
  };

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
            {requestCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{requestCount > 99 ? '99+' : requestCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.mainContent}>
        <View style={styles.glowBlobFuchsia} pointerEvents="none" />
        <View style={styles.glowBlobCyan} pointerEvents="none" />
        <View style={styles.glowBlobPurple} pointerEvents="none" />

        {/* Reaction color flash, triggered by the buttons */}
        <Animated.View style={[styles.swipeBgBase, { opacity: likeFlashOpacity }]} pointerEvents="none">
          {/* <View style={styles.swipeBgContent}>
            <Ionicons name="heart" size={100} color="#30D158" />
          </View> */}
        </Animated.View>

        <Animated.View style={[styles.swipeBgBase, { opacity: passFlashOpacity }]} pointerEvents="none">
          {/* <View style={styles.swipeBgContent}>
            <Ionicons name="close-outline" size={110} color="#FF375F" />
          </View> */}
        </Animated.View>

        {/* Card Stack */}
        <View
          style={styles.cardStackContainer}
          onLayout={(e) => {
            cardHeightRef.current = e.nativeEvent.layout.height;
          }}
        >
          {!currentProfile || activeProfiles.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyCard}>
                <Ionicons name="sparkles-outline" size={60} color="#FF007F" />
                <Text style={styles.emptyTitle}>You're all caught up!</Text>
                <Text style={styles.emptySub}>
                  You've seen all available profiles for today. Come back tomorrow for new people in your area! 🌟
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => {
                    setCurrentIndex(0);
                    fetchFeed();
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={theme.gradientAccent} style={styles.emptyBtnGrad}>
                    <Ionicons name="refresh-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyBtnTxt}>Check Again</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
          <>
          {/* Card 3 (Back-most) - Hidden during transition */}
          {showBackgroundCards && nextNextProfile && (
            <Animated.View style={[
              styles.card,
              styles.cardBack2,
              {
                opacity: card3Opacity,
                transform: [
                  { translateY: card3Pos.y },
                  { scale: card3Scale }
                ]
              }
            ]}>
              <Image source={{ uri: nextNextProfile.images?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900' }} style={styles.cardPhoto} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']} style={styles.bottomGrad} />
              <View style={styles.cardTextOverlayBottomLeft}>
                <Text style={styles.cardProfileName}>{nextNextProfile.name}, {nextNextProfile.age}</Text>
                <Text style={styles.cardProfileJob}>{nextNextProfile.job}</Text>
              </View>
            </Animated.View>
          )}

          {/* Card 2 (Middle) - Hidden during transition */}
          {showBackgroundCards && nextProfile && (
            <Animated.View style={[
              styles.card,
              styles.cardBack1,
              {
                opacity: card2Opacity,
                transform: [
                  { translateY: card2Pos.y },
                  { scale: card2Scale }
                ]
              }
            ]}>
              <Image source={{ uri: nextProfile.images?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900' }} style={styles.cardPhoto} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']} style={styles.bottomGrad} />
              <View style={styles.cardTextOverlayBottomLeft}>
                <Text style={styles.cardProfileName}>{nextProfile.name}, {nextProfile.age}</Text>
                <Text style={styles.cardProfileJob}>{nextProfile.job}</Text>
              </View>
            </Animated.View>
          )}

          {/* Card 1 (Active) - No drag/swipe handlers, only taps + buttons */}
          <Animated.View
            style={[
              styles.card,
              styles.cardActive,
              {
                opacity: card1Opacity,
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { rotate: rotate }
                ]
              }
            ]}
          >
            <Image
              key={`${currentIndex}-${photoIdx}`}
              source={{ uri: currentProfile.images[photoIdx] }}
              style={styles.cardPhoto}
            />

            <LinearGradient colors={['rgba(0,0,0,0.15)', 'transparent']} style={styles.topGrad} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']} style={styles.bottomGrad} />

            {/* Photo progress dots */}
            {currentProfile.images.length > 1 && (
              <View style={styles.photoDotsRow} pointerEvents="none">
                {currentProfile.images.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.photoDot, i === photoIdx && styles.photoDotActive]}
                  />
                ))}
              </View>
            )}

            {/* Tap zones: left = prev photo, right = next photo. No drag. */}
            <View style={styles.tapZoneRow} pointerEvents="box-none">
              <TouchableWithoutFeedback onPress={handlePhotoTapLeft}>
                <View style={styles.tapZoneSide} />
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={openDetail}>
                <View style={styles.tapZoneCenter} />
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={handlePhotoTapRight}>
                <View style={styles.tapZoneSide} />
              </TouchableWithoutFeedback>
            </View>

            <Animated.View style={{ opacity: detailsOpacity, width: '100%', position: 'absolute', bottom: 0 }} pointerEvents="box-none">
              <TouchableOpacity activeOpacity={0.9} onPress={openDetail} style={styles.cardTextOverlayBottomLeft}>
                <Text style={styles.cardProfileName}>{currentProfile.name}, {currentProfile.age}</Text>
                <Text style={styles.cardProfileJob}>{currentProfile.job}</Text>
              </TouchableOpacity>
            </Animated.View>

          </Animated.View>

          {/* Reaction message — shown only when a button is pressed, icon-led, no emoji */}
          <Animated.View
            style={[
              styles.reactionToast,
              {
                opacity: likeOpacity,
                transform: [{
                  scale: likeOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] })
                }],
              },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.reactionIconCircle, styles.reactionIconCircleLike]}>
              <Ionicons name="heart" size={30} color="#fff" />
            </View>
            <Text style={styles.reactionTitle}>{LIKE_MESSAGES[likeMsgIdx].title}</Text>
            <Text style={styles.reactionSubtitle}>{LIKE_MESSAGES[likeMsgIdx].subtitle}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.reactionToast,
              {
                opacity: nopeOpacity,
                transform: [{
                  scale: nopeOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] })
                }],
              },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.reactionIconCircle, styles.reactionIconCirclePass]}>
              <Ionicons name="close" size={30} color="#fff" />
            </View>
            <Text style={styles.reactionTitle}>{PASS_MESSAGES[passMsgIdx].title}</Text>
            <Text style={styles.reactionSubtitle}>{PASS_MESSAGES[passMsgIdx].subtitle}</Text>
          </Animated.View>
          </>
          )}
        </View>

        {/* Actions Row — the only way to like/pass now */}
        <View style={styles.actionsRowContainer}>
          <TouchableOpacity
            onPress={moveToPrevious}
            activeOpacity={0.8}
            style={styles.actionBtnSmallX}
            disabled={isAnimating}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Plans')}
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

          <TouchableOpacity
            onPress={moveToNext}
            activeOpacity={0.8}
            style={styles.actionBtnSmallHeart}
            disabled={isAnimating}
          >
            <Ionicons name="heart" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Detail Bottom Sheet */}
      {showDetail && (
        <Animated.View style={[styles.detailSheet, { transform: [{ translateY: sheetY }] }]}>
          <LinearGradient
            colors={isDark ? ['#140E2D', '#0A051C'] : ['#F2EBFF', '#FFFFFF']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            nestedScrollEnabled={true}
          >
            <View style={styles.sheetPhotoWrap}>
              <FlatList
                data={currentProfile.images}
                keyExtractor={(_, i) => i.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
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
              <View style={styles.sheetPhotoDots}>
                {currentProfile.images.map((_, i) => (
                  <View key={i} style={[styles.sheetDot, i === sheetPhotoIdx && styles.sheetDotActive]} />
                ))}
              </View>
            </View>

            <View style={styles.sheetBody}>
              <View style={styles.sheetNameRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName}>{currentProfile.name}, {currentProfile.age}</Text>
                  <Text style={styles.sheetJob}>{currentProfile.job} · {currentProfile.distance}</Text>
                </View>
                <View style={styles.sheetCompatBadge}>
                  <Text style={styles.sheetCompatNum}>{currentProfile.compatibility}%</Text>
                  <Text style={styles.sheetCompatLbl}>match</Text>
                </View>
              </View>

              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>ABOUT</Text>
                <Text style={styles.sheetBio}>{currentProfile.bio}</Text>
              </View>

              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>INTERESTS</Text>
                <View style={styles.tagsRow}>
                  {ensureArray(currentProfile.interests).map((t, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {ensureArray(currentProfile.mutuals).length > 0 && (
                <View style={styles.sheetCard}>
                  <Text style={styles.sheetCardLabel}>MUTUAL FRIENDS</Text>
                  <View style={styles.mutualDetailRow}>
                    {ensureArray(currentProfile.mutuals).map((av, i) => (
                      <Image key={i} source={{ uri: av }} style={styles.mutualDetailAv} />
                    ))}
                    <Text style={styles.mutualDetailTxt}>
                      {ensureArray(currentProfile.mutuals).length} mutual friend{ensureArray(currentProfile.mutuals).length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>GALLERY</Text>
                <View style={styles.sheetGalleryGrid}>
                  {ensureArray(currentProfile.images).map((img, i) => (
                    <View key={i} style={styles.sheetGalleryItem}>
                      <Image source={{ uri: img }} style={styles.sheetGalleryImg} />
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={styles.sheetBtnPass}
                  onPress={closeDetail}
                >
                  <Ionicons name="close" size={22} color="#FF375F" />
                  <Text style={styles.sheetBtnPassTxt}>Pass</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetBtnLike}
                  onPress={closeDetail}
                >
                  <LinearGradient colors={['#FF007F', '#B5179E']} style={styles.sheetBtnLikeGrad}>
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
    paddingBottom: 95,
  },

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
    zIndex: 1,
  },
  cardBack1: {
    zIndex: 2,
  },
  cardActive: {
    zIndex: 3,
  },
  cardPhoto: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topGrad: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  bottomGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },

  // Left/center/right tap regions on the active card (no drag, taps only)
  tapZoneRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 90,
    flexDirection: 'row',
    zIndex: 5,
  },
  tapZoneSide: {
    flex: 0.32,
    height: '100%',
  },
  tapZoneCenter: {
    flex: 0.36,
    height: '100%',
  },

  photoDotsRow: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 8,
  },
  photoDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  photoDotActive: {
    width: 18,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },

  cardTextOverlayBottomLeft: {
    paddingBottom: 24,
    paddingLeft: 24,
    paddingRight: 24,
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

  // Reaction message — transparent (no background card), icon-led, big bold text
  reactionToast: {
    position: 'absolute',
    top: '32%',
    left: 32,
    right: 32,
    alignItems: 'center',
    zIndex: 40,
  },
  reactionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 10,
  },
  reactionIconCircleLike: {
    backgroundColor: '#FF007F',
    shadowColor: '#FF007F',
  },
  reactionIconCirclePass: {
    backgroundColor: '#4A89FF',
    shadowColor: '#4A89FF',
  },
  reactionTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 40,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  reactionSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  swipeBgBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 5,
    pointerEvents: 'none',
  },
  swipeBgContent: {
    alignItems: 'center',
    gap: 14,
    zIndex: 10,
  },

  detailSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    zIndex: 100,
  },
  sheetHandleWrap: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.40)',
  },

  sheetPhotoWrap: {
    height: height * 0.56,
    overflow: 'hidden',
    position: 'relative',
  },
  sheetPhoto: {
    width,
    height: height * 0.56,
    resizeMode: 'cover',
  },
  sheetPhotoGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
  },
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  sheetDotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1F2026',
  },

  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sheetNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  sheetName: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: -0.6,
  },
  sheetJob: {
    fontSize: 14,
    color: theme.textSec,
    marginTop: 4,
  },
  sheetCompatBadge: {
    backgroundColor: 'rgba(255,55,95,0.12)',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,55,95,0.25)',
  },
  sheetCompatNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF375F',
  },
  sheetCompatLbl: {
    fontSize: 11,
    color: theme.textSec,
    fontWeight: '600',
  },

  sheetCard: {
    backgroundColor: theme.isDark ? '#1C1236' : '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sheetCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textFaint,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sheetBio: {
    fontSize: 15,
    color: theme.textSec,
    lineHeight: 23,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: theme.isDark ? '#2B1E4D' : '#F2EBFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tagText: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },

  mutualDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mutualDetailAv: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  mutualDetailTxt: {
    fontSize: 13,
    color: theme.textSec,
    flex: 1,
  },

  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  sheetBtnPass: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.80)' : 'rgba(0,0,0,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,55,95,0.35)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  sheetBtnPassTxt: {
    color: '#FF375F',
    fontWeight: '800',
    fontSize: 15,
  },
  sheetBtnLike: {
    flex: 2,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  sheetBtnLikeGrad: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  sheetBtnLikeTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  sheetCloseBtn: {
    position: 'absolute',
    top: 24,
    right: 18,
    zIndex: 20,
  },
  sheetCloseBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  sheetGalleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  sheetGalleryItem: {
    width: (width - 56) / 3,
    height: (width - 56) / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sheetGalleryImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Premium empty state
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
  emptyBtn: {
    marginTop: 10,
    borderRadius: 22,
    overflow: 'hidden',
  },
  emptyBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
  },
  emptyBtnTxt: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
