// src/screens/ProfileScreen.jsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, StatusBar, ScrollView, Dimensions, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

const GALLERY = [
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400',
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400',
];

export default function ProfileScreen() {
  const { user } = useAuth();
  const { isDark, theme, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const allPhotos = [user.coverImage, ...GALLERY];

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.flex}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        bounces={false}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        decelerationRate="normal"
        contentContainerStyle={{ paddingBottom: 110 }}
      >

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: allPhotos[photoIdx] }} style={styles.heroImg} />
          <LinearGradient colors={theme.gradientTop} style={styles.heroTopGrad} />
          <LinearGradient colors={theme.gradientCard} style={styles.heroBottomGrad} />

          {/* Photo indicators */}
          <View style={styles.photoDots}>
            {allPhotos.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setPhotoIdx(i)}
                style={[styles.dot, i === photoIdx && styles.dotActive]}
              />
            ))}
          </View>

          {/* Top actions */}
          <View style={styles.heroTop}>
            <View style={styles.heroTopInner}>
              <TouchableOpacity style={styles.glassBtn} onPress={toggleTheme} activeOpacity={0.7}>
                <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn}>
                <Ionicons name="settings-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn}>
                <Ionicons name="share-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero info — glass panel bottom of image */}
          <View style={styles.heroInfoPanel}>
            <View style={styles.heroInfoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName}>{user.name}, {user.age || 24}</Text>
                <Text style={styles.heroSub}>{user.username}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn}>
                <LinearGradient colors={theme.gradientAccent} style={styles.editBtnGrad}>
                  <Ionicons name="create-outline" size={14} color="#fff" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Content ──────────────────────────────────────────────── */}
        <View style={styles.content}>

          {/* Stats glass card */}
          <View style={styles.statsCard}>
            {[
              { val: user.followers, label: 'Followers' },
              { val: user.following, label: 'Following' },
              { val: user.likes,     label: 'Likes'     },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.statDiv} />}
              </React.Fragment>
            ))}
          </View>

          {/* Quick actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionIconBtn}>
              <LinearGradient colors={theme.gradientAccent} style={styles.actionIconGrad}>
                <Ionicons name="heart" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconBtn}>
              <View style={styles.glassIconBtnInner}>
                <Ionicons name="mail-outline" size={20} color={theme.isDark ? "#fff" : theme.textPrimary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconBtn}>
              <View style={styles.glassIconBtnInner}>
                <Ionicons name="bookmark-outline" size={20} color={theme.isDark ? "#fff" : theme.textPrimary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Bio glass card */}
          <View style={styles.glassSection}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>

          {/* Interests */}
          <View style={styles.glassSection}>
            <Text style={styles.sectionLabel}>INTERESTS</Text>
            <View style={styles.tagsRow}>
              {(user.interests || []).map((t, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Gallery */}
          <View>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <TouchableOpacity style={styles.addBtn}>
                <Ionicons name="add" size={16} color={theme.textSec} />
                <Text style={styles.addBtnText}>Add photo</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={allPhotos}
              keyExtractor={(_, i) => i.toString()}
              horizontal showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.galleryList}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.galleryThumb, index === photoIdx && styles.galleryThumbActive]}
                  onPress={() => setPhotoIdx(index)}
                >
                  <Image source={{ uri: item }} style={styles.galleryImg} />
                  {index === photoIdx && (
                    <LinearGradient
                      colors={['rgba(255,55,95,0.40)', 'transparent']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Profile strength */}
          <View style={[styles.glassSection, { marginTop: 22 }]}>
            <Text style={styles.sectionLabel}>PROFILE STRENGTH</Text>
            <View style={styles.strengthBar}>
              <LinearGradient colors={theme.gradientAccent} style={[styles.strengthFill, { width: '72%' }]} />
            </View>
            <Text style={styles.strengthText}>72% — Add location & more photos to attract more matches</Text>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },

  // Hero
  heroWrap:      { height: height * 0.50, position: 'relative' },
  heroImg:       { position: 'absolute', width: '100%', height: '100%', resizeMode: 'cover' },
  heroTopGrad:   { position: 'absolute', top: 0, left: 0, right: 0, height: 130 },
  heroBottomGrad:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  photoDots: {
    position: 'absolute', top: 14, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot: {
    width: 6, height: 3.5, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: { width: 20, backgroundColor: '#fff' },
  heroTop:   { position: 'absolute', top: 0, left: 0, right: 0 },
  heroTopInner: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 52,
  },
  glassBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.40)', // keep dark glass button on hero image for contrast
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroInfoPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 20, paddingTop: 16,
    backgroundColor: theme.isDark ? 'rgba(13,15,26,0.50)' : 'rgba(255,255,255,0.65)',
    borderTopWidth: 1, borderTopColor: theme.border,
  },
  heroInfoRow: { flexDirection: 'row', alignItems: 'flex-end' },
  heroName:   { fontSize: 28, fontWeight: '900', color: theme.isDark ? '#fff' : theme.textPrimary, letterSpacing: -0.7 },
  heroSub:    { fontSize: 14, color: theme.textSec, marginTop: 3 },
  editBtn:    { borderRadius: 18, overflow: 'hidden' },
  editBtnGrad:{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8 },
  editBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },

  // Content
  content: { paddingHorizontal: 16, paddingTop: 18 },
  statsCard: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: theme.glass, borderRadius: 22, padding: 18,
    borderWidth: 1, borderColor: theme.border, marginBottom: 16,
  },
  statItem:  { alignItems: 'center' },
  statNum:   { fontSize: 24, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: theme.textSec, marginTop: 3 },
  statDiv:   { width: 1, backgroundColor: theme.border, marginVertical: 4 },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  actionIconBtn: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  actionIconGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  glassIconBtnInner: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: theme.glass, borderRadius: 24,
    borderWidth: 1, borderColor: theme.border,
  },

  glassSection: {
    backgroundColor: theme.glass, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: theme.border, marginBottom: 14,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: theme.textFaint, letterSpacing: 1.2, marginBottom: 10 },
  bioText:      { fontSize: 15, color: theme.textSec, lineHeight: 23 },
  tagsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: theme.glassMid, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: theme.border,
  },
  tagText: { color: theme.textPrimary, fontSize: 13, fontWeight: '600' },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.textPrimary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.glass, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: theme.border,
  },
  addBtnText: { color: theme.textSec, fontSize: 12, fontWeight: '600' },

  galleryList: { gap: 10, paddingRight: 4 },
  galleryThumb: {
    width: 90, height: 110, borderRadius: 16, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  galleryThumbActive: { borderColor: theme.accent },
  galleryImg: { width: '100%', height: '100%', resizeMode: 'cover' },

  strengthBar: { height: 6, backgroundColor: theme.glass, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthText: { fontSize: 13, color: theme.textSec, lineHeight: 19 },
});

