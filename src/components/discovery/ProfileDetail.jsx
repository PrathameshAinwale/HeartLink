// src/components/discovery/ProfileDetail.jsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Image, Dimensions, FlatList, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function ProfileDetail({ visible, profile, onClose, onLike, onPass, isMatch = false }) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const { isDark, theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  if (!profile) return null;

  const photos = profile.images && profile.images.length > 0 ? profile.images : [profile.image];
  const interests = profile.interests && profile.interests.length > 0 ? profile.interests : ['Travel', 'Music', 'Coffee', 'Fitness'];

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
              <Text style={styles.cardLabel}>ABOUT</Text>
              <Text style={styles.bioText}>"{profile.bio || 'No bio provided yet.'}"</Text>
            </View>

            {/* Interests Card */}
            <View style={styles.glassCard}>
              <Text style={styles.cardLabel}>INTERESTS</Text>
              <View style={styles.tagsRow}>
                {interests.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Photos Grid Gallery */}
            {photos.length > 0 && (
              <View style={styles.glassCard}>
                <Text style={styles.cardLabel}>GALLERY</Text>
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

        {/* Floating bottom glass action panel */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.btnPass} onPress={() => { onPass(profile.id); onClose(); }}>
            <Text style={styles.btnPassText}>{isMatch ? "Unmatch" : "Pass"}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.btnLike} onPress={() => { onLike(profile.id); onClose(); }}>
            <LinearGradient colors={theme.gradientAccent} style={styles.btnLikeGrad}>
              <Ionicons name={isMatch ? "chatbubble-ellipses-outline" : "heart"} size={20} color="#fff" />
              <Text style={styles.btnLikeText}>{isMatch ? "Message" : "Accept Match"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

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
  cardLabel: {
    fontSize: 10, fontWeight: '800', color: theme.textFaint,
    letterSpacing: 1.5, marginBottom: 10,
  },
  bioText: { fontSize: 15, color: theme.textSec, lineHeight: 23, fontStyle: 'italic' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
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