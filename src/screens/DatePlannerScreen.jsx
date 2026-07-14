// src/screens/DatePlannerScreen.jsx — Plan a Date with Curated Restaurant Spots & Top Boosted Spot
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, SafeAreaView, StatusBar, ScrollView, Dimensions, Alert, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

const BOOSTED_RESTAURANT = {
  id: 'boost_r1',
  name: 'Amour Rooftop Bar',
  cuisine: 'Italian Fine Dining & Wine 🍷',
  rating: '5.0',
  price: 'Rs',
  location: 'Chelsea, NY',
  image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800',
  tag: 'COSMIC BOOST',
  desc: 'Experience pure romance with breathtaking Manhattan skyline views, award-winning vintage wines, and intimate violin sessions.',
  address: '150 West 24th St, New York, NY 10011',
  mapLink: 'https://maps.google.com/?q=Amour+Rooftop+Bar+Chelsea+NY'
};

const RESTAURANTS = [
  { id: 'r1', name: 'La Parisienne', cuisine: 'French Bistro 🗼', rating: '4.9', price: 'Rs', location: 'SoHo, NY', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', tag: 'Most Romantic' },
  { id: 'r2', name: 'Zen Garden Sushi', cuisine: 'Japanese Fine 🌸', rating: '4.8', price: 'Rs', location: 'Tribeca, NY', image: 'https://images.unsplash.com/photo-1579027989536-b7b1ecda6374?w=400', tag: 'Intimate Vibe' },
  { id: 'r3', name: 'Sunset Roof Lounge', cuisine: 'Cocktails & Bites 🍹', rating: '4.7', price: 'Rs', location: 'Midtown, NY', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', tag: 'Stellar Views' },
];

export default function DatePlannerScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const renderBoostedRestaurant = () => {
    return (
      <View style={styles.boostSection}>
        <View style={styles.boostHeader}>
          <LinearGradient
            colors={['#A78BFA', '#F472B6']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.boostHeaderIconGrad}
          >
            <Ionicons name="flash" size={10} color="#fff" />
          </LinearGradient>
          <Text style={styles.boostHeaderTitle}>COSMIC BOOST SPOT</Text>
        </View>

        <TouchableOpacity
          style={styles.boostCard}
          onPress={() => navigation.navigate('RestaurantDetail', { spot: BOOSTED_RESTAURANT })}
          activeOpacity={0.9}
        >
          <Image source={{ uri: BOOSTED_RESTAURANT.image }} style={styles.boostCardImg} />
          <LinearGradient colors={['transparent', 'rgba(10, 5, 28, 0.25)', 'rgba(10, 5, 28, 0.90)']} style={styles.boostCardOverlay} />

          <View style={styles.boostTagPill}>
            <Text style={styles.boostTagText}>{BOOSTED_RESTAURANT.tag}</Text>
          </View>

          <View style={styles.boostDetails}>
            <Text style={styles.boostName}>{BOOSTED_RESTAURANT.name}</Text>
            <Text style={styles.boostCuisine}>{BOOSTED_RESTAURANT.cuisine} · {BOOSTED_RESTAURANT.price}</Text>
            <Text style={styles.boostLoc}>📍 {BOOSTED_RESTAURANT.location} · ⭐ {BOOSTED_RESTAURANT.rating}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Glowing background depth blobs */}
      <View style={styles.glowBlobPurple} pointerEvents="none" />
      <View style={styles.glowBlobCyan} pointerEvents="none" />

      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Date Planner</Text>
          <Text style={styles.sub}>Plan an unforgettable spot connection with your matches</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Top Boosted Restaurant */}
          {renderBoostedRestaurant()}

          <Text style={styles.sectionLabel}>Curated Restaurant Spots</Text>
          <View style={styles.spotGrid}>
            {RESTAURANTS.map(item => {
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.spotCard}
                  onPress={() => navigation.navigate('RestaurantDetail', { spot: item })}
                  activeOpacity={0.9}
                >
                  <BlurView
                    intensity={isDark ? 40 : 60}
                    tint={isDark ? "dark" : "light"}
                    style={StyleSheet.absoluteFill}
                  />
                  <Image source={{ uri: item.image }} style={styles.spotImg} />
                  <View style={styles.spotOverlay} />
                  
                  {item.tag && (
                    <View style={styles.spotTag}>
                      <Text style={styles.spotTagText}>{item.tag}</Text>
                    </View>
                  )}

                  <View style={styles.spotTextWrap}>
                    <Text style={styles.spotName}>{item.name}</Text>
                    <Text style={styles.spotCuisine}>{item.cuisine} · {item.price}</Text>
                    <Text style={styles.spotLoc}>📍 {item.location} · ⭐ {item.rating}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, position: 'relative' },

  // Glowing background faders
  glowBlobPurple: {
    position: 'absolute',
    top: height * 0.15,
    right: -85,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
    opacity: 0.8,
    zIndex: 0,
  },
  glowBlobCyan: {
    position: 'absolute',
    bottom: height * 0.25,
    left: -85,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(6, 182, 212, 0.14)',
    opacity: 0.7,
    zIndex: 0,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 14 : 14,
    paddingBottom: 12,
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
    marginBottom: 12,
    marginTop: 18,
    paddingHorizontal: 20,
  },

  // Cosmic Boost Spot Card
  boostSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
  },
  boostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  boostHeaderIconGrad: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostHeaderTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: 0.8,
  },
  boostCard: {
    height: 180,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  boostCardImg: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    width: '100%', height: '100%',
    resizeMode: 'cover',
  },
  boostCardOverlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
  },
  boostTagPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#FF375F',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: '#FF375F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  boostTagText: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  boostDetails: {
    position: 'absolute',
    bottom: 16,
    left: 18,
    right: 18,
  },
  boostName: {
    fontSize: 19,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.2,
  },
  boostCuisine: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  boostLoc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },

  // Spot selection grid
  spotGrid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  spotCard: {
    height: 125,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    position: 'relative',
  },
  spotImg: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  spotOverlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  spotTextWrap: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  spotName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  spotCuisine: {
    fontSize: 12.5,
    color: theme.textSec,
    marginBottom: 4,
  },
  spotLoc: {
    fontSize: 11,
    color: theme.textFaint,
  },
  spotTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 55, 95, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  spotTagText: {
    color: '#FF375F',
    fontSize: 8,
    fontWeight: '700',
  },
});
