// src/screens/PlansScreen.jsx — Ultra-Sleek Glassmorphic Plans Screen
import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, Dimensions, Platform, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import CustomAlertModal from '../components/CustomAlertModal';
import { apiSubscribePlan } from '../services/api';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.86;
const CARD_SPACING = (width - CARD_WIDTH) / 2;

const CARDS_DATA = [
  {
    id: 'vip',
    name: 'HeartLink VIP',
    tagline: '10x Match Rate & Priority Local Takeover',
    iconName: 'sparkles-outline',
    badgeText: 'ULTIMATE VIP',
    accentColor: '#FF007F',
    gradient: ['#FF007F', '#8B5CF6'],
    glowColor: 'rgba(255, 0, 127, 0.28)',
    durations: [
      { id: '12m', label: '12 Mo', price: '₹117', unit: '/wk', total: '₹5,999/yr', save: '80% OFF' },
      { id: '6m',  label: '6 Mo',  price: '₹233', unit: '/wk', total: '₹5,599/6mo', save: '60% OFF', popular: true },
      { id: '1m',  label: '1 Mo',   price: '₹449', unit: '/wk', total: '₹1,799/mo', save: 'FLEX' },
    ],
    features: [
      { icon: 'flash-outline', title: '10x Priority Visibility & Super Boosts' },
      { icon: 'heart-outline', title: 'See Everyone Who Liked Your Profile' },
      { icon: 'chatbubbles-outline', title: 'Send Direct Messages Before Matching' },
      { icon: 'planet-outline', title: 'Passport Location Changer Worldwide' },
      { icon: 'reload-outline', title: 'Unlimited Rewinds on Passed Profiles' },
      { icon: 'eye-off-outline', title: 'Incognito & Private Browsing Mode' },
      { icon: 'sparkles-outline', title: 'AI Cosmic Match Guarantee' },
      { icon: 'options-outline', title: 'Unlimited Match Preference Filters' },
    ],
  },
  {
    id: 'gold',
    name: 'HeartLink Gold',
    tagline: 'See Who Likes You & Boost Your Reach',
    iconName: 'star-outline',
    badgeText: 'MOST POPULAR',
    accentColor: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    glowColor: 'rgba(245, 158, 11, 0.25)',
    durations: [
      { id: '12m', label: '12 Mo', price: '₹86',  unit: '/wk', total: '₹4,399/yr', save: '74% OFF' },
      { id: '6m',  label: '6 Mo',  price: '₹166', unit: '/wk', total: '₹3,999/6mo', save: '50% OFF', popular: true },
      { id: '1m',  label: '1 Mo',   price: '₹349', unit: '/wk', total: '₹1,399/mo', save: 'FLEX' },
    ],
    features: [
      { icon: 'heart-outline', title: 'See Who Liked Your Profile Instantly' },
      { icon: 'sparkles-outline', title: 'Explore 2x Curated Profiles Daily' },
      { icon: 'reload-outline', title: 'Unlimited Rewinds on Swipes' },
      { icon: 'planet-outline', title: 'Passport Access to Change Location' },
      { icon: 'eye-off-outline', title: 'Private Browsing Mode Controls' },
      { icon: 'options-outline', title: 'Search with Advanced Preference Filters' },
    ],
  },
  {
    id: 'plus',
    name: 'HeartLink Plus',
    tagline: 'Unlimited Likes & Essential Tools',
    iconName: 'flash-outline',
    badgeText: 'STARTER PASS',
    accentColor: '#06B6D4',
    gradient: ['#06B6D4', '#3B82F6'],
    glowColor: 'rgba(6, 182, 212, 0.22)',
    durations: [
      { id: '12m', label: '12 Mo', price: '₹62',  unit: '/wk', total: '₹3,199/yr', save: '60% OFF' },
      { id: '6m',  label: '6 Mo',  price: '₹117', unit: '/wk', total: '₹2,799/6mo', save: '40% OFF', popular: true },
      { id: '1m',  label: '1 Mo',   price: '₹249', unit: '/wk', total: '₹999/mo', save: 'FLEX' },
    ],
    features: [
      { icon: 'infinite-outline', title: 'Send Unlimited Likes & Direct Comments' },
      { icon: 'chatbubbles-outline', title: 'Send First Message Before Match' },
      { icon: 'reload-outline', title: 'Recheck Up to 15 Passed Profiles' },
      { icon: 'options-outline', title: 'Custom Preference Filter Controls' },
    ],
  },
];

export default function PlansScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const [cardDurations, setCardDurations] = useState({
    vip: '6m',
    gold: '6m',
    plus: '6m',
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);
  const [purchasedPlanName, setPurchasedPlanName] = useState('');

  const handleSelectDuration = (cardId, durationId) => {
    setCardDurations(prev => ({ ...prev, [cardId]: durationId }));
  };

  const handleSubscribe = (card) => {
    const durId = cardDurations[card.id] || '6m';
    const durObj = card.durations.find(d => d.id === durId) || card.durations[1];
    setPurchasedPlanName(`${card.name} (${durObj.label} at ${durObj.total})`);
    setSuccessAlertVisible(true);

    apiSubscribePlan({
      plan_name: card.name,
      duration: durObj.label,
      price: durObj.total,
    }).catch(() => {});
  };

  const renderCard = ({ item: card, index }) => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.91, 1.0, 0.91],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.65, 1.0, 0.65],
      extrapolate: 'clamp',
    });

    const selectedDurId = cardDurations[card.id] || '6m';
    const selectedDurObj = card.durations.find(d => d.id === selectedDurId) || card.durations[1];

    return (
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale }], opacity }]}>
        <View style={styles.cardContainer}>
          {/* Top Subtle Gradient Glow */}
          <LinearGradient
            colors={[card.glowColor, 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }}
            style={StyleSheet.absoluteFill}
          />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardInnerScroll}>
            {/* Top Pill Badge */}
            <View style={styles.badgeRow}>
              <View style={styles.badgeCapsule}>
                <LinearGradient
                  colors={card.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name={card.iconName} size={12} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.badgeText}>{card.badgeText}</Text>
              </View>
            </View>

            {/* Header Icon & Plan Name */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { shadowColor: card.accentColor }]}>
                <LinearGradient
                  colors={card.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.iconGrad}
                >
                  <Ionicons name={card.iconName} size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.cardTitle}>{card.name}</Text>
              <Text style={styles.cardTagline}>{card.tagline}</Text>
            </View>

            {/* Duration Selector Tabs inside Card */}
            <View style={styles.durationSection}>
              <Text style={styles.sectionLabel}>SELECT DURATION</Text>
              <View style={styles.durationRow}>
                {card.durations.map((dur) => {
                  const isSelected = dur.id === selectedDurId;
                  return (
                    <TouchableOpacity
                      key={dur.id}
                      style={[
                        styles.durTab,
                        isSelected && styles.durTabSelected,
                      ]}
                      onPress={() => handleSelectDuration(card.id, dur.id)}
                      activeOpacity={0.8}
                    >
                      {isSelected && (
                        <LinearGradient
                          colors={card.gradient}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={StyleSheet.absoluteFill}
                        />
                      )}

                      <View style={styles.durTabContent}>
                        {dur.save ? (
                          <View style={[styles.savePill, isSelected && styles.savePillActive]}>
                            <Text style={[styles.saveTxt, isSelected && styles.whiteTxt]}>
                              {dur.save}
                            </Text>
                          </View>
                        ) : null}

                        <Text style={[styles.durLabelText, isSelected && styles.whiteTxt]}>
                          {dur.label}
                        </Text>
                        <Text style={[styles.durPriceText, isSelected && styles.whiteTxt]}>
                          {dur.price}<Text style={styles.durUnitText}>{dur.unit}</Text>
                        </Text>
                        <Text style={[styles.durTotalText, isSelected && styles.whiteFaintTxt]}>
                          {dur.total}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Features Checklist */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionLabel}>INCLUDED PERKS</Text>
              <View style={styles.featuresList}>
                {card.features.map((feat, fIdx) => (
                  <View key={fIdx} style={styles.featureRow}>
                    <View style={[styles.featureIconBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                      <Ionicons name={feat.icon} size={15} color={card.accentColor} />
                    </View>
                    <Text style={styles.featureTitle}>{feat.title}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Sticky CTA Button at Bottom of Card */}
          <View style={styles.cardCtaWrap}>
            <TouchableOpacity
              onPress={() => handleSubscribe(card)}
              activeOpacity={0.88}
              style={[styles.cardCtaBtn, { shadowColor: card.accentColor }]}
            >
              <LinearGradient
                colors={card.gradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.cardCtaGrad}
              >
                <Ionicons name="sparkles" size={17} color="#FFFFFF" />
                <Text style={styles.cardCtaText}>
                  Get {card.name} ({selectedDurObj.price}{selectedDurObj.unit})
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Decorative Orbs */}
      <View style={styles.glowBlobFuchsia} pointerEvents="none" />
      <View style={styles.glowBlobCyan} pointerEvents="none" />

      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>HeartLink Membership</Text>
            <Text style={styles.headerSubtitle}>Swipe to choose your plan</Text>
          </View>

          <View style={{ width: 38 }} />
        </View>

        {/* Slidable Carousel of Cards */}
        <View style={styles.carouselContainer}>
          <Animated.FlatList
            ref={flatListRef}
            data={CARDS_DATA}
            renderItem={renderCard}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled={false}
            snapToInterval={CARD_WIDTH}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
              setActiveIndex(newIndex);
            }}
          />
        </View>

        {/* Page Dots Indicator */}
        <View style={styles.paginationRow}>
          {CARDS_DATA.map((card, i) => {
            const inputRange = [
              (i - 1) * CARD_WIDTH,
              i * CARD_WIDTH,
              (i + 1) * CARD_WIDTH,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [7, 24, 7],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1.0, 0.35],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={card.id}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity, backgroundColor: card.accentColor },
                ]}
              />
            );
          })}
        </View>

        <Text style={styles.disclaimerText}>
          Membership automatically renews. Manage or cancel anytime in account settings.
        </Text>
      </SafeAreaView>

      {/* Confirmation Modal */}
      <CustomAlertModal
        visible={successAlertVisible}
        title="Membership Activated"
        message={`Your ${purchasedPlanName} pass is now active. Enjoy your elite benefits!`}
        icon="sparkles"
        iconColor="#FF007F"
        confirmText="Continue"
        onConfirm={() => {
          setSuccessAlertVisible(false);
          navigation.goBack();
        }}
      />
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, position: 'relative' },

  glowBlobFuchsia: {
    position: 'absolute',
    top: height * 0.1,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 0, 127, 0.18)',
    opacity: 0.8,
    zIndex: 0,
  },
  glowBlobCyan: {
    position: 'absolute',
    bottom: height * 0.15,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 191, 255, 0.15)',
    opacity: 0.7,
    zIndex: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 10,
    paddingBottom: 8,
    zIndex: 10,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.textFaint,
    marginTop: 2,
  },

  // Carousel
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  flatListContent: {
    paddingHorizontal: CARD_SPACING,
    alignItems: 'center',
  },

  // Card Outer & Inner
  cardWrapper: {
    width: CARD_WIDTH,
    height: height * 0.71,
    paddingHorizontal: 6,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.isDark ? 0.45 : 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  cardContainer: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.85)',
    backgroundColor: theme.isDark ? '#1C1433' : '#FFFFFF',
    overflow: 'hidden',
  },
  cardInnerScroll: {
    padding: 18,
    paddingBottom: 80,
  },

  // Badge Tag
  badgeRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.0,
  },

  // Header Icon & Title
  cardHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 10,
  },
  iconGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  cardTagline: {
    fontSize: 12,
    color: theme.textSec,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 17,
  },

  // Duration Grid
  durationSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textFaint,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durTab: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
    overflow: 'hidden',
  },
  durTabSelected: {
    borderColor: 'transparent',
  },
  durTabContent: {
    padding: 10,
    alignItems: 'center',
  },
  savePill: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  savePillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  saveTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#30D158',
  },
  durLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  durPriceText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
    marginTop: 2,
  },
  durUnitText: {
    fontSize: 10,
    fontWeight: '600',
  },
  durTotalText: {
    fontSize: 9.5,
    color: theme.textFaint,
    marginTop: 2,
    textAlign: 'center',
  },
  whiteTxt: {
    color: '#FFFFFF',
  },
  whiteFaintTxt: {
    color: 'rgba(255, 255, 255, 0.75)',
  },

  // Features Section
  featuresSection: {
    marginBottom: 10,
  },
  featuresList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  featureTitle: {
    fontSize: 13,
    color: theme.textPrimary,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },

  // Sticky Card CTA
  cardCtaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.isDark ? '#1C1433' : '#FFFFFF',
    overflow: 'hidden',
  },
  cardCtaBtn: {
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardCtaGrad: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cardCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Pagination Dots
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },

  disclaimerText: {
    fontSize: 10,
    color: theme.textFaint,
    textAlign: 'center',
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
});
