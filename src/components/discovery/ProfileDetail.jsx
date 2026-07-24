// src/components/discovery/ProfileDetail.jsx — Seamless Full-Screen Profile Popup
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Pressable,
  ScrollView, Image, Dimensions, FlatList, Animated, PanResponder, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { ensureArray, formatImageUrl, calculateMatchPercentage } from '../../utils/helpers';

const { width, height } = Dimensions.get('window');

export default function ProfileDetail({ visible, profile, onClose, onLike, onPass, isMatch = false }) {
  const [sheetPhotoIdx, setSheetPhotoIdx] = useState(0);
  const { isDark, theme } = useTheme();
  const { user: currentUser } = useAuth();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const compatPercentage = useMemo(() => {
    if (profile?.compatibility) return profile.compatibility;
    return calculateMatchPercentage(currentUser, profile);
  }, [currentUser, profile]);

  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      setSheetPhotoIdx(0);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: height,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 12,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!profile || !visible) return null;

  const rawPhotos = profile.images && profile.images.length > 0
    ? profile.images
    : (profile.photos && profile.photos.length > 0 ? profile.photos : [profile.image]);

  const photos = ensureArray(rawPhotos, [
    profile.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800'
  ]).map(p => (typeof p === 'string' ? p : (p?.photo_url || p?.url || profile.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800')));

  const interests = ensureArray(profile.interests, ['Travel', 'Music', 'Coffee', 'Fitness', 'Art', 'Yoga']);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          style={[styles.detailSheet, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
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
          >
            {/* Sliding photo carousel (Starts right at top y=0, NO white space!) */}
            <View style={styles.sheetPhotoWrap}>
              {/* Floating top close X / chevron button */}
              <TouchableOpacity style={styles.floatingCloseBtn} onPress={handleClose} activeOpacity={0.7}>
                <Ionicons name="chevron-down" size={24} color="#FFF" />
              </TouchableOpacity>

              <FlatList
                data={photos}
                keyExtractor={(_, i) => i.toString()}
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
                colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.85)']}
                style={styles.sheetHeroGrad}
              />
              {/* Hero Compat badge (Representation 1) */}
              <View style={styles.sheetHeroCompat}>
                <Text style={styles.sheetHeroCompatNum}>{compatPercentage}%</Text>
                <Text style={styles.sheetHeroCompatLbl}>match</Text>
              </View>
              {/* Pagination dots */}
              {photos.length > 1 && (
                <View style={styles.sheetPhotoDots}>
                  {photos.map((_, i) => (
                    <View key={i} style={[styles.sheetDot, i === sheetPhotoIdx && styles.sheetDotActive]} />
                  ))}
                </View>
              )}
              {/* Name overlay */}
              <View style={styles.sheetHeroNameWrap}>
                <Text style={styles.sheetHeroName}>{profile.name}{profile.showAge !== false ? `, ${profile.age}` : ''}</Text>
                <Text style={styles.sheetHeroSub}>{profile.showOccupation !== false ? (profile.job || 'Connections') : 'Member'}</Text>
              </View>
            </View>

            <View style={styles.sheetBody}>
              {/* Quick-fact chips */}
              <View style={styles.quickFactsRow}>
                <View style={styles.quickFact}>
                  <Ionicons name="location-outline" size={14} color="#FF007F" />
                  <Text style={styles.quickFactTxt}>{profile.location || profile.city || 'Nearby'}</Text>
                </View>
                <View style={styles.quickFact}>
                  <Ionicons name="navigate-outline" size={14} color="#8A66FF" />
                  <Text style={styles.quickFactTxt}>{profile.distance || (profile.distance_km ? `${profile.distance_km} km away` : '3 km away')}</Text>
                </View>
                <View style={styles.quickFact}>
                  <Ionicons name={profile.gender?.toLowerCase().includes('female') ? 'woman-outline' : 'man-outline'} size={14} color="#4A89FF" />
                  <Text style={styles.quickFactTxt}>{profile.gender || 'Person'}</Text>
                </View>
              </View>

              {/* About Card */}
              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>ABOUT</Text>
                <Text style={styles.sheetBio}>"{profile.bio || 'Living colorfully, one outfit at a time. Always chasing the next adventure and finding good vibes!'}"</Text>
              </View>

              {/* Personal Details & Identity */}
              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>PERSONAL DETAILS</Text>
                <View style={styles.tagsRow}>
                  {(!profile.hideEducation && !profile.user?.settings?.hide_education) && (
                    <View style={styles.tag}>
                      <Ionicons name="school-outline" size={13} color="#FF007F" style={{ marginRight: 4 }} />
                      <Text style={styles.tagText}>Education: {profile.education || 'Bachelor’s Degree'}</Text>
                    </View>
                  )}
                  <View style={styles.tag}>
                    <Ionicons name="sparkles-outline" size={13} color="#FF007F" style={{ marginRight: 4 }} />
                    <Text style={styles.tagText}>Religion: {profile.religion || 'Spiritual'}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Ionicons name="language-outline" size={13} color="#FF007F" style={{ marginRight: 4 }} />
                    <Text style={styles.tagText}>Mother Tongue: {profile.mother_tongue || profile.motherTongue || 'English'}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Ionicons name="shield-checkmark-outline" size={13} color="#FF007F" style={{ marginRight: 4 }} />
                    <Text style={styles.tagText}>Status: {profile.marital_status || profile.maritalStatus || 'Never Married'}</Text>
                  </View>
                </View>
              </View>

              {/* Interests Card */}
              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>INTERESTS</Text>
                <View style={styles.tagsRow}>
                  {interests.map((t, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Lifestyle & Dating Habits Card (Always populated with rich data) */}
              <View style={styles.sheetCard}>
                <Text style={styles.sheetCardLabel}>HOW I AM TO DATE (LIFESTYLE)</Text>
                <View style={styles.lifestyleGrid}>
                  <View style={styles.lifestyleItem}>
                    <View style={styles.lifestyleIcon}>
                      <Ionicons name="flame-outline" size={18} color="#FF007F" />
                    </View>
                    <Text style={styles.lifestyleLbl}>Smoking</Text>
                    <Text style={styles.lifestyleVal}>{profile.smoking || 'Non-smoker'}</Text>
                  </View>
                  <View style={styles.lifestyleItem}>
                    <View style={styles.lifestyleIcon}>
                      <Ionicons name="wine-outline" size={18} color="#8A66FF" />
                    </View>
                    <Text style={styles.lifestyleLbl}>Drinking</Text>
                    <Text style={styles.lifestyleVal}>{profile.drinking || 'Socially'}</Text>
                  </View>
                  <View style={styles.lifestyleItem}>
                    <View style={styles.lifestyleIcon}>
                      <Ionicons name="disc-outline" size={18} color="#4A89FF" />
                    </View>
                    <Text style={styles.lifestyleLbl}>Nightlife</Text>
                    <Text style={styles.lifestyleVal}>{profile.clubbing || 'Occasionally'}</Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              {(onPass || onLike) ? (
                <View style={styles.sheetActions}>
                  {onPass ? (
                    <TouchableOpacity
                      style={styles.sheetBtnPass}
                      onPress={() => { handleClose(); onPass(profile.id); }}
                    >
                      <Ionicons name="close" size={22} color="#FF375F" />
                      <Text style={styles.sheetBtnPassTxt}>{isMatch ? "Unmatch" : "Pass"}</Text>
                    </TouchableOpacity>
                  ) : null}
                  
                  {onLike ? (
                    <TouchableOpacity
                      style={styles.sheetBtnLike}
                      onPress={() => { handleClose(); onLike(profile.id); }}
                    >
                      <LinearGradient colors={['#FF007F', '#B5179E']} style={styles.sheetBtnLikeGrad}>
                        <Ionicons name={isMatch ? "chatbubble-ellipses-outline" : "heart"} size={20} color="#fff" />
                        <Text style={styles.sheetBtnLikeTxt}>{isMatch ? "Chat" : "Like"}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              <View style={{ height: 110 }} />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const getStyles = (theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  detailSheet: {
    height: height,
    width: width,
    backgroundColor: theme.isDark ? '#140E2D' : '#FFFFFF',
    overflow: 'hidden',
  },
  detailSheetBgClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  floatingCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 20,
    left: 16,
    zIndex: 100,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sheetPhotoWrap: {
    height: height * 0.54,
    width: width,
    overflow: 'hidden',
    position: 'relative',
  },
  sheetPhoto: {
    width: width,
    height: height * 0.54,
    resizeMode: 'cover',
  },
  sheetHeroGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },

  sheetHeroCompat: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 0, 127, 0.85)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sheetHeroCompatNum: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  sheetHeroCompatLbl: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sheetPhotoDots: {
    position: 'absolute',
    bottom: 65,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  sheetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  sheetDotActive: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  sheetHeroNameWrap: {
    position: 'absolute',
    bottom: 18,
    left: 20,
    right: 90,
  },
  sheetHeroName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sheetHeroSub: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginTop: 2,
  },

  sheetBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  quickFactsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickFact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: theme.border || 'rgba(0,0,0,0.06)',
  },
  quickFactTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.textPrimary,
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
  overallCompatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compatIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compatTextWrap: {
    flex: 1,
  },
  compatScoreTxt: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.textPrimary,
  },
  compatSubTxt: {
    fontSize: 12,
    color: theme.textSec,
    marginTop: 2,
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
    flexDirection: 'row',
    alignItems: 'center',
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

  lifestyleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  lifestyleItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  },
  lifestyleIcon: {
    marginBottom: 4,
  },
  lifestyleLbl: {
    fontSize: 10.5,
    color: theme.textSec,
    fontWeight: '600',
  },
  lifestyleVal: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.textPrimary,
    marginTop: 2,
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
});