// src/screens/DiscoverScreen.jsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  Animated, Dimensions, Image, PanResponder,
  SafeAreaView, ScrollView, FlatList, StatusBar, Platform, Easing, BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { apiSwipeUser, apiGetDiscoveryFeed, apiGetRequests, apiResetDiscovery } from '../services/api';
import { ensureArray, formatImageUrl } from '../utils/helpers';

const { width, height } = Dimensions.get('window');


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
  const [showDetail, setShowDetail] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBackgroundCards, setShowBackgroundCards] = useState(true);
  const [likeMsgIdx, setLikeMsgIdx] = useState(0);
  const [passMsgIdx, setPassMsgIdx] = useState(0);
  const [sheetPhotoIdx, setSheetPhotoIdx] = useState(0);

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

  // Swipe-down-to-close gesture state
  const sheetDragY = useRef(new Animated.Value(0)).current;
  const sheetScrollY = useRef(0); // tracks ScrollView vertical offset

  const sheetPanResponder = useRef(
    PanResponder.create({
      // Only claim the gesture when: scrolled to top AND dragging downward
      onMoveShouldSetPanResponder: (_, gs) =>
        sheetScrollY.current <= 0 && gs.dy > 8 && gs.dy > Math.abs(gs.dx),
      onPanResponderGrant: () => {
        sheetDragY.setValue(0);
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) sheetDragY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.8) {
          // Close — reset drag offset first then animate sheetY out
          sheetDragY.setValue(0);
          Animated.timing(sheetY, { toValue: height, duration: 220, useNativeDriver: false }).start(
            () => setShowDetail(false)
          );
        } else {
          // Snap back
          Animated.spring(sheetDragY, { toValue: 0, tension: 50, friction: 9, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

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
    userPhotos = userPhotos.map(url => formatImageUrl(url)).filter(Boolean);
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

      if (fRes?.profiles && Array.isArray(fRes.profiles)) {
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

    // No fallback — always use real database profiles
    return [];
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

  // Intercept Android hardware back press: close the detail sheet if open
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showDetailRef.current) {
          closeDetail();
          return true; // prevent default back navigation
        }
        return false; // allow default back navigation
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handlePhotoTapLeft = () => {
    if (isAnimating) return;
    setPhotoIdx(prev => Math.max(0, prev - 1));
  };

  const handlePhotoTapRight = () => {
    if (isAnimating) return;
    if (currentProfile?.images?.length) {
      setPhotoIdx(prev => (prev + 1) % currentProfile.images.length);
    }
  };

  const openDetail = () => {
    if (isAnimating) return;
    setShowDetail(true);
    sheetDragY.setValue(0);
    Animated.spring(sheetY, { toValue: 0, tension: 35, friction: 8, useNativeDriver: false }).start();
  };

  const closeDetail = () => {
    sheetDragY.setValue(0);
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
        setDbProfiles(prev => {
          const nextList = prev.filter(p => p.id !== currentP?.id);
          if (nextList.length === 0) {
            setTimeout(() => { fetchFeed(); }, 100);
          }
          return nextList;
        });
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
        setDbProfiles(prev => {
          const nextList = prev.filter(p => p.id !== currentP?.id);
          if (nextList.length === 0) {
            setTimeout(() => { fetchFeed(); }, 100);
          }
          return nextList;
        });
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

      <View style={styles.mainContent} pointerEvents={showDetail ? "none" : "auto"}>
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
                  onPress={async () => {
                    setCurrentIndex(0);
                    try {
                      await apiResetDiscovery();
                    } catch (_) {}
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
              <Image source={{ uri: formatImageUrl(nextNextProfile.images?.[0]) }} style={styles.cardPhoto} resizeMode="cover" />
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
              <Image source={{ uri: formatImageUrl(nextProfile.images?.[0]) }} style={styles.cardPhoto} resizeMode="cover" />
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
              key={`${currentProfile?.id || currentIndex}-${photoIdx}`}
              source={{ uri: formatImageUrl(currentProfile.images[photoIdx]) }}
              style={styles.cardPhoto}
              resizeMode="cover"
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
              <Pressable onPress={handlePhotoTapLeft} style={{ flex: 1 }}>
                <View style={styles.tapZoneSide} />
              </Pressable>
              <Pressable onPress={openDetail} style={{ flex: 2 }}>
                <View style={styles.tapZoneCenter} />
              </Pressable>
              <Pressable onPress={handlePhotoTapRight} style={{ flex: 1 }}>
                <View style={styles.tapZoneSide} />
              </Pressable>
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
        <Animated.View
          style={[styles.detailSheet, { transform: [{ translateY: Animated.add(sheetY, sheetDragY) }] }]}
          {...sheetPanResponder.panHandlers}
        >
          {/* Background gradient clipped to sheet border radius */}
          <View style={styles.detailSheetBgClip} pointerEvents="none">
            <LinearGradient
              colors={isDark ? ['#140E2D', '#0A051C'] : ['#F2EBFF', '#FFFFFF']}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 0 }}
            onScroll={(e) => { sheetScrollY.current = e.nativeEvent.contentOffset.y; }}
          >
            {/* Drag handle INSIDE the scroll view so it never blocks scroll */}
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>

            {/* Sliding photo carousel */}
            <View style={styles.sheetPhotoWrap}>
              <FlatList
                data={currentProfile.images}
                keyExtractor={(item, i) => `${currentProfile?.id || 'p'}-${i}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                onMomentumScrollEnd={(e) => {
                  const activeIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                  setSheetPhotoIdx(activeIndex);
                }}
                renderItem={({ item }) => (
                  <Image source={{ uri: formatImageUrl(item) }} style={styles.sheetPhoto} resizeMode="cover" />
                )}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.80)']}
                style={styles.sheetHeroGrad}
              />
              {/* Tag badge */}
              <View style={styles.sheetHeroTag}>
                <View style={styles.sheetTagDot} />
                <Text style={styles.sheetTagTxt}>{currentProfile.tag}</Text>
              </View>
              {/* Compat badge */}
              <View style={styles.sheetHeroCompat}>
                <Text style={styles.sheetHeroCompatNum}>{currentProfile.compatibility}%</Text>
                <Text style={styles.sheetHeroCompatLbl}>match</Text>
              </View>
              {/* Pagination dots */}
              {currentProfile.images.length > 1 && (
                <View style={styles.sheetPhotoDots}>
                  {currentProfile.images.map((_, i) => (
                    <View key={i} style={[styles.sheetDot, i === sheetPhotoIdx && styles.sheetDotActive]} />
                  ))}
                </View>
              )}
              {/* Name overlay */}
              <View style={styles.sheetHeroNameWrap}>
                <Text style={styles.sheetHeroName}>{currentProfile.name}, {currentProfile.age}</Text>
                <Text style={styles.sheetHeroSub}>{currentProfile.job}</Text>
              </View>
            </View>

            <View style={styles.sheetBody}>
              {/* Quick-fact chips */}
              <View style={styles.quickFactsRow}>
                <View style={styles.quickFact}>
                  <Ionicons name="location-outline" size={14} color="#FF007F" />
                  <Text style={styles.quickFactTxt}>{currentProfile.location}</Text>
                </View>
                <View style={styles.quickFact}>
                  <Ionicons name="navigate-outline" size={14} color="#8A66FF" />
                  <Text style={styles.quickFactTxt}>{currentProfile.distance}</Text>
                </View>
                <View style={styles.quickFact}>
                  <Ionicons name={currentProfile.gender?.toLowerCase().includes('female') ? 'woman-outline' : 'man-outline'} size={14} color="#4A89FF" />
                  <Text style={styles.quickFactTxt}>{currentProfile.gender}</Text>
                </View>
              </View>

              {/* About */}
              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>ABOUT</Text>
                <Text style={styles.sheetBio}>{currentProfile.bio}</Text>
              </View>

              {/* Interests */}
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

              {/* Lifestyle snapshot */}
              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>LIFESTYLE</Text>
                <View style={styles.lifestyleGrid}>
                  <View style={styles.lifestyleItem}>
                    <View style={styles.lifestyleIcon}>
                      <Ionicons name="heart-outline" size={18} color="#FF007F" />
                    </View>
                    <Text style={styles.lifestyleLbl}>Looking for</Text>
                    <Text style={styles.lifestyleVal}>Relationship</Text>
                  </View>
                  <View style={styles.lifestyleItem}>
                    <View style={styles.lifestyleIcon}>
                      <Ionicons name="fitness-outline" size={18} color="#8A66FF" />
                    </View>
                    <Text style={styles.lifestyleLbl}>Exercise</Text>
                    <Text style={styles.lifestyleVal}>Active</Text>
                  </View>
                  <View style={styles.lifestyleItem}>
                    <View style={styles.lifestyleIcon}>
                      <Ionicons name="wine-outline" size={18} color="#4A89FF" />
                    </View>
                    <Text style={styles.lifestyleLbl}>Drinks</Text>
                    <Text style={styles.lifestyleVal}>Socially</Text>
                  </View>
                  <View style={styles.lifestyleItem}>
                    <View style={styles.lifestyleIcon}>
                      <Ionicons name="star-outline" size={18} color="#FFB800" />
                    </View>
                    <Text style={styles.lifestyleLbl}>Zodiac</Text>
                    <Text style={styles.lifestyleVal}>Explore</Text>
                  </View>
                </View>
              </View>

              {/* Mutual friends */}
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

              {/* Actions */}
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
  emptyWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.glass || 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: theme.border || 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13.5,
    color: theme.textSec,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  emptyBtn: {
    marginTop: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnTxt: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
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
    // No overflow:hidden — it clips Android scroll gesture recognition
    zIndex: 100,
  },
  detailSheetBgClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  sheetHandleWrap: {
    // Inside ScrollView — not absolutely positioned, so no touch interception
    paddingTop: 14,
    paddingBottom: 10,
    alignItems: 'center',
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
    paddingHorizontal: 16,
    paddingTop: 16,
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

  // Photo slider carousel
  sheetPhotoWrap: {
    height: height * 0.52,
    position: 'relative',
    overflow: 'hidden',
  },
  sheetPhoto: {
    width,
    height: height * 0.52,
  },
  sheetPhotoDots: {
    position: 'absolute',
    bottom: 60,           // above the name overlay
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    zIndex: 10,
  },
  sheetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  sheetDotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  // Hero overlay helpers (positioned inside sheetPhotoWrap)
  sheetHeroWrap: {
    height: height * 0.52,
    position: 'relative',
    overflow: 'hidden',
  },
  sheetHeroPhoto: {
    width: '100%',
    height: '100%',
  },
  sheetHeroGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
  },
  sheetHeroTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  sheetTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30D158',
  },
  sheetTagTxt: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  sheetHeroCompat: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,55,95,0.85)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  sheetHeroCompatNum: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  sheetHeroCompatLbl: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sheetHeroNameWrap: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
  },
  sheetHeroName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sheetHeroSub: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },

  // Quick facts
  quickFactsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  quickFact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.isDark ? '#1C1236' : '#F2EBFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickFactTxt: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Lifestyle grid
  lifestyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  lifestyleItem: {
    width: '46%',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    borderRadius: 14,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  lifestyleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  lifestyleLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textFaint,
    letterSpacing: 0.5,
  },
  lifestyleVal: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textPrimary,
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
