// src/components/discovery/ProfileDetail.jsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Image, Dimensions, FlatList, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { ensureArray } from '../../utils/helpers';

const { width, height } = Dimensions.get('window');

export default function ProfileDetail({ visible, profile, onClose, onLike, onPass, isMatch = false }) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const { isDark, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  if (!profile) return null;

  const rawPhotos = profile.images && profile.images.length > 0
    ? profile.images
    : (profile.photos && profile.photos.length > 0 ? profile.photos : [profile.image]);

  const photos = ensureArray(rawPhotos, [
    profile.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800'
  ]).map(p => (typeof p === 'string' ? p : (p?.photo_url || p?.url || profile.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800')));

  const interests = ensureArray(profile.interests, ['Travel', 'Music', 'Coffee', 'Fitness']);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <View style={styles.container}>
        
        {/* Floating close X button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <View style={styles.closeBtnInner}>
            <Ionicons name="chevron-down" size={20} color={theme.textPrimary} />
          </View>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Photo Carousel */}
          <View style={styles.photoWrap}>
            <FlatList
              data={photos}
              keyExtractor={(_, i) => i.toString()}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const contentOffset = e.nativeEvent.contentOffset.x;
                const activeIndex = Math.round(contentOffset / width);
                setActivePhotoIdx(activeIndex);
              }}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.photo} />
              )}
            />
            <LinearGradient
              colors={['transparent', theme.bgDark]}
              style={styles.photoGrad}
            />
            {/* Photo carousel dots */}
            {photos.length > 1 && (
              <View style={styles.photoDots}>
                {photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activePhotoIdx && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>

          {/* Profile details body */}
          <View style={styles.body}>
            {/* Name, age, compatibility */}
            <View style={styles.nameRow}>
              <View style={styles.flex}>
                <Text style={styles.nameText}>{profile.name}, {profile.age}</Text>
                <Text style={styles.jobText}>{profile.job || 'Professional'}</Text>
              </View>
              {profile.compatibility && (
                <View style={styles.compatBadge}>
                  <Text style={styles.compatNum}>{profile.compatibility}%</Text>
                  <Text style={styles.compatLabel}>match</Text>
                </View>
              )}
            </View>

            {/* About Card */}
            <View style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="person-outline" size={16} color="#FF007F" style={{ marginRight: 6 }} />
                <Text style={styles.cardLabel}>ABOUT ME</Text>
              </View>
              <Text style={styles.bioText}>"{profile.bio || 'No bio provided yet.'}"</Text>
            </View>

            {/* Video Intro Badge Card */}
            {(profile.video_intro_url || profile.videoIntroUrl) ? (
              <View style={styles.videoIntroCard}>
                <LinearGradient colors={['rgba(255,0,127,0.15)', 'rgba(181,23,158,0.05)']} style={StyleSheet.absoluteFill} />
                <View style={styles.videoIntroRow}>
                  <View style={styles.videoIntroIconBox}>
                    <Ionicons name="videocam" size={20} color="#FF007F" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.videoIntroTitle}>Video Introduction</Text>
                    <Text style={styles.videoIntroSub}>Verified 15s video intro available</Text>
                  </View>
                  <TouchableOpacity style={styles.playVideoBtn} activeOpacity={0.8}>
                    <Ionicons name="play" size={14} color="#fff" />
                    <Text style={styles.playVideoText}>Watch</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Personal Details & Identity Card */}
            <View style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="ribbon-outline" size={16} color="#FF007F" style={{ marginRight: 6 }} />
                <Text style={styles.cardLabel}>PERSONAL DETAILS</Text>
              </View>
              
              <View style={styles.detailsGrid}>
                {profile.mother_tongue || profile.motherTongue ? (
                  <View style={styles.detailPill}>
                    <Ionicons name="language-outline" size={14} color="#FF007F" style={{ marginRight: 6 }} />
                    <Text style={styles.detailPillText}>Mother Tongue: {profile.mother_tongue || profile.motherTongue}</Text>
                  </View>
                ) : null}

                {profile.religion ? (
                  <View style={styles.detailPill}>
                    <Ionicons name="sparkles-outline" size={14} color="#FF007F" style={{ marginRight: 6 }} />
                    <Text style={styles.detailPillText}>Religion: {profile.religion}</Text>
                  </View>
                ) : null}

                {profile.education ? (
                  <View style={styles.detailPill}>
                    <Ionicons name="school-outline" size={14} color="#FF007F" style={{ marginRight: 6 }} />
                    <Text style={styles.detailPillText}>Education: {profile.education}</Text>
                  </View>
                ) : null}

                {profile.marital_status || profile.maritalStatus ? (
                  <View style={styles.detailPill}>
                    <Ionicons name="shield-checkmark-outline" size={14} color="#FF007F" style={{ marginRight: 6 }} />
                    <Text style={styles.detailPillText}>Status: {profile.marital_status || profile.maritalStatus}</Text>
                  </View>
                ) : null}

                {profile.diet ? (
                  <View style={styles.detailPill}>
                    <Ionicons name="restaurant-outline" size={14} color="#FF007F" style={{ marginRight: 6 }} />
                    <Text style={styles.detailPillText}>Diet: {profile.diet}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* How I Am To Date (Lifestyle & Dating Habits Card) */}
            <View style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="wine-outline" size={16} color="#FF007F" style={{ marginRight: 6 }} />
                <Text style={styles.cardLabel}>HOW I AM TO DATE (LIFESTYLE)</Text>
              </View>
              
              <View style={styles.detailsGrid}>
                {profile.smoking ? (
                  <View style={styles.detailPill}>
                    <Ionicons name="flame-outline" size={14} color="#FF007F" style={{ marginRight: 6 }} />
                    <Text style={styles.detailPillText}>Smoking: {profile.smoking}</Text>
                  </View>
                ) : null}

                {profile.drinking ? (
                  <View style={styles.detailPill}>
                    <Ionicons name="wine-outline" size={14} color="#FF007F" style={{ marginRight: 6 }} />
                    <Text style={styles.detailPillText}>Drinking: {profile.drinking}</Text>
                  </View>
                ) : null}

                {profile.clubbing ? (
                  <View style={styles.detailPill}>
                    <Ionicons name="disc-outline" size={14} color="#FF007F" style={{ marginRight: 6 }} />
                    <Text style={styles.detailPillText}>Nightlife / Clubbing: {profile.clubbing}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Interests Card */}
            <View style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="sparkles-outline" size={16} color="#FF007F" style={{ marginRight: 6 }} />
                <Text style={styles.cardLabel}>INTERESTS & HOBBIES</Text>
              </View>
              <View style={styles.tagsRow}>
                {interests.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Ionicons name="checkmark-circle-outline" size={13} color="#FF007F" style={{ marginRight: 4 }} />
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Photos Grid Gallery */}
            {photos.length > 0 && (
              <View style={styles.glassCard}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="images-outline" size={16} color="#FF007F" style={{ marginRight: 6 }} />
                  <Text style={styles.cardLabel}>GALLERY</Text>
                </View>
                <View style={styles.galleryGrid}>
                  {photos.map((img, i) => (
                    <View key={i} style={styles.galleryItem}>
                      <Image source={{ uri: img }} style={styles.galleryImg} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Large layout bottom offset spacing */}
            <View style={{ height: 120 }} />
          </View>
        </ScrollView>

        {/* Floating bottom action panel */}
        {(onPass || onLike) ? (
          <View style={styles.bottomBar}>
            {onPass ? (
              <TouchableOpacity style={styles.btnPass} onPress={() => { onPass(profile.id); onClose(); }}>
                <Text style={styles.btnPassText}>{isMatch ? "Unmatch" : "Pass"}</Text>
              </TouchableOpacity>
            ) : null}
            
            {onLike ? (
              <TouchableOpacity style={styles.btnLike} onPress={() => { onLike(profile.id); onClose(); }}>
                <LinearGradient colors={theme.gradientAccent} style={styles.btnLikeGrad}>
                  <Ionicons name={isMatch ? "chatbubble-ellipses-outline" : "heart"} size={20} color="#fff" />
                  <Text style={styles.btnLikeText}>{isMatch ? "Message" : "Accept Match"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

      </View>
    </Modal>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bgDark },
  flex:      { flex: 1 },

  // Close chevron button
  closeBtn: { position: 'absolute', top: 52, right: 18, zIndex: 20 },
  closeBtnInner: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
    borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Carousel photo
  photoWrap: { height: height * 0.52, overflow: 'hidden', position: 'relative' },
  photo:     { width, height: height * 0.52, resizeMode: 'cover' },
  photoGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 },
  photoDots: {
    position: 'absolute', bottom: 14, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6, zIndex: 10,
  },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 18, height: 6, borderRadius: 3, backgroundColor: '#fff' },

  // Body content
  body: { paddingHorizontal: 20, paddingTop: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  nameText: { fontSize: 28, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.6 },
  jobText:  { fontSize: 14, color: theme.textSec, marginTop: 4 },
  
  compatBadge: {
    backgroundColor: 'rgba(255,55,95,0.18)',
    borderRadius: 18, padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,55,95,0.35)',
  },
  compatNum:   { fontSize: 20, fontWeight: '900', color: '#FF375F' },
  compatLabel: { fontSize: 10, color: theme.isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)', fontWeight: '600' },

  // Glass card panels
  glassCard: {
    backgroundColor: theme.glass,
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: theme.border,
    marginBottom: 12,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardLabel: {
    fontSize: 10, fontWeight: '800', color: theme.textFaint,
    letterSpacing: 1.5,
  },
  videoIntroCard: {
    borderRadius: 20, padding: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,0,127,0.3)',
    marginBottom: 12, overflow: 'hidden', position: 'relative',
  },
  videoIntroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  videoIntroIconBox: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,0,127,0.15)', justifyContent: 'center', alignItems: 'center' },
  videoIntroTitle: { fontSize: 14, fontWeight: '800', color: theme.textPrimary },
  videoIntroSub: { fontSize: 11, color: theme.textSec, marginTop: 1 },
  playVideoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#FF007F' },
  playVideoText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  detailsGrid: { gap: 8, marginTop: 4 },
  detailPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.glass, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: theme.border },
  detailPillText: { fontSize: 13, fontWeight: '600', color: theme.textPrimary },
  bioText: { fontSize: 15, color: theme.textSec, lineHeight: 23, fontStyle: 'italic' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.glass,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: theme.border,
  },
  tagText: { color: theme.textPrimary, fontSize: 13, fontWeight: '600' },

  // Photo gallery grid
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  galleryItem: {
    width: (width - 40 - 32 - 16) / 3,
    height: 90, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
  },
  galleryImg: { width: '100%', height: '100%', resizeMode: 'cover' },

  // Floating bottom glass action panel
  bottomBar: {
    position: 'absolute',
    bottom: 24, left: 16, right: 16, height: 72,
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(14, 14, 20, 1)' : 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24, borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.isDark ? 0.35 : 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  btnPass: {
    flex: 1, height: 48, borderRadius: 24,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
    borderWidth: 1.5, borderColor: 'rgba(255,55,95,0.50)',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  btnPassText: { color: '#FF375F', fontWeight: '800', fontSize: 14 },
  btnLike:     { flex: 2, height: 48, borderRadius: 24, overflow: 'hidden' },
  btnLikeGrad: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnLikeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});