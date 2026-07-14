// src/screens/ProfileScreen.jsx — High-fidelity Glassmorphic Profile & Settings
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, StatusBar, ScrollView, Dimensions, FlatList, Platform, Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

const GALLERY_DEFAULT = [
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500',
];

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { isDark, theme, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [photoIdx, setPhotoIdx] = useState(0);

  // Safe fallback to prevent null crashes
  const profileUser = useMemo(() => {
    return user || {
      name: 'Alex Rivera',
      username: '@alex_rivera',
      age: 26,
      bio: 'Designer focused on creating beautiful, user-centered digital experiences.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
      followers: 412,
      following: 278,
      likes: 1043,
      interests: ['Design', 'Photography', 'Travel', 'Coffee', 'Music'],
    };
  }, [user]);

  const allPhotos = useMemo(() => {
    return [profileUser.coverImage, ...GALLERY_DEFAULT];
  }, [profileUser]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Discover' });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out of HeartLink?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: () => {
            logout();
            // Fallback navigate to Register if stack resets
            navigation.reset({
              index: 0,
              routes: [{ name: 'Register' }],
            });
          } 
        }
      ]
    );
  };

  const handleEdit = () => {
    Alert.alert("Edit Profile ✍️", "Profile editing will be unlocked in the next HeartLink update.");
  };

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.flex}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Floating background decorative blobs */}
      <View style={styles.glowBlobPurple} pointerEvents="none" />
      <View style={styles.glowBlobCyan} pointerEvents="none" />

      {/* Main Scroll Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Cover Photo Area */}
        <View style={styles.coverWrapper}>
          <Image source={{ uri: allPhotos[photoIdx] }} style={styles.coverImg} />
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={styles.coverTopGrad} />
          <LinearGradient colors={['transparent', theme.isDark ? '#0D0F1A' : '#F6F5FA']} style={styles.coverBottomGrad} />

          {/* Symmetrical Top Action Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.glassBtn} onPress={handleBack} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerRightActions}>
              <TouchableOpacity style={styles.glassBtn} onPress={toggleTheme} activeOpacity={0.7}>
                <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn} onPress={handleLogout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Photo Pagination Bar */}
          <View style={styles.photoIndicatorRow}>
            {allPhotos.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setPhotoIdx(i)}
                style={[styles.indicatorBar, i === photoIdx && styles.indicatorBarActive]}
              />
            ))}
          </View>
        </View>

        {/* User Card Area (Overlaps the Cover Bottom) */}
        <View style={styles.profileBody}>
          <View style={styles.avatarRow}>
            {/* Overlapping Profile Avatar */}
            <View style={styles.avatarRing}>
              <Image source={{ uri: profileUser.avatar }} style={styles.avatarImg} />
            </View>
            
            <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.85}>
              <LinearGradient colors={theme.gradientAccent} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.editBtnGrad}>
                <Ionicons name="create" size={14} color="#fff" />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Name & Details Card */}
          <View style={styles.infoBox}>
            <BlurView intensity={isDark ? 45 : 75} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <Text style={styles.profileName}>{profileUser.name}, {profileUser.age || 26}</Text>
            <Text style={styles.profileUsername}>{profileUser.username}</Text>
          </View>

          {/* Stats Glass Card */}
          <View style={styles.statsCard}>
            <BlurView intensity={isDark ? 40 : 70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>{profileUser.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>{profileUser.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>{profileUser.likes}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.sectionBox}>
            <BlurView intensity={isDark ? 40 : 70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <Text style={styles.sectionLabel}>About Me</Text>
            <Text style={styles.bioText}>{profileUser.bio}</Text>
          </View>

          {/* Interests Section */}
          <View style={styles.sectionBox}>
            <BlurView intensity={isDark ? 40 : 70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <Text style={styles.sectionLabel}>Interests</Text>
            <View style={styles.interestsRow}>
              {(profileUser.interests || []).map((tag, idx) => (
                <View key={idx} style={styles.interestTag}>
                  <Text style={styles.interestTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Gallery Section */}
          <View style={styles.galleryContainer}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>Photo Gallery</Text>
              <TouchableOpacity style={styles.addPhotoBtn} activeOpacity={0.7}>
                <Ionicons name="add" size={14} color={theme.textPrimary} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={allPhotos}
              keyExtractor={(_, i) => i.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.galleryList}
              renderItem={({ item, index }) => {
                // Alternating asymmetrical corners matching premium styling
                const isEven = index % 2 === 0;
                const corners = isEven
                  ? { borderTopLeftRadius: 18, borderBottomRightRadius: 18 }
                  : { borderTopRightRadius: 18, borderBottomLeftRadius: 18 };

                return (
                  <TouchableOpacity
                    style={[styles.galleryThumb, corners, index === photoIdx && styles.galleryThumbActive]}
                    onPress={() => setPhotoIdx(index)}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: item }} style={styles.galleryThumbImg} />
                    {index === photoIdx && (
                      <LinearGradient
                        colors={['rgba(255, 55, 95, 0.3)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Profile Strength Rating */}
          <View style={styles.sectionBox}>
            <BlurView intensity={isDark ? 40 : 70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <Text style={styles.sectionLabel}>Profile Strength</Text>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={theme.gradientAccent}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: '75%' }]}
              />
            </View>
            <Text style={styles.progressSubtext}>75% — Complete verification to stand out to nearby matches</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },
  scrollContainer: {
    paddingBottom: 110,
  },

  // Glowing background elements
  glowBlobPurple: {
    position: 'absolute',
    top: height * 0.35,
    right: -85,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    opacity: 0.8,
    zIndex: 0,
  },
  glowBlobCyan: {
    position: 'absolute',
    bottom: height * 0.1,
    left: -85,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    opacity: 0.7,
    zIndex: 0,
  },

  // Cover Image banner
  coverWrapper: {
    height: 260,
    position: 'relative',
    width: '100%',
  },
  coverImg: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    width: '100%', height: '100%',
    resizeMode: 'cover',
  },
  coverTopGrad: {
    position: 'absolute',
    left: 0, right: 0, top: 0,
    height: 100,
  },
  coverBottomGrad: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 120,
  },

  // Header Nav Bar overlay
  headerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12,
    zIndex: 35,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  glassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Photo Dots
  photoIndicatorRow: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 10,
  },
  indicatorBar: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  indicatorBarActive: {
    width: 28,
    backgroundColor: '#fff',
  },

  // Profile Body (overlaps cover)
  profileBody: {
    paddingHorizontal: 20,
    marginTop: -45, // pulls avatar/card up overlapping cover image
    zIndex: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3.5,
    borderColor: theme.isDark ? '#0D0F1A' : '#F6F5FA',
    backgroundColor: theme.glass,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
    shadowColor: '#FF375F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  editBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  editBtnText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // Info details container
  infoBox: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.glass,
    overflow: 'hidden',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  profileUsername: {
    fontSize: 13,
    color: theme.textSec,
    marginTop: 3,
    fontWeight: '500',
  },

  // Stats Card layout
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.glass,
    borderRadius: 24,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11.5,
    color: theme.textSec,
    marginTop: 4,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.border,
  },

  // Common Section card
  sectionBox: {
    backgroundColor: theme.glass,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textFaint,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14.5,
    color: theme.textSec,
    lineHeight: 22,
  },

  // Interests Tags
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: theme.glassMid,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  interestTagText: {
    color: theme.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
  },

  // Gallery
  galleryContainer: {
    marginBottom: 16,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  galleryTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: theme.textPrimary,
    letterSpacing: -0.2,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.glass,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  addPhotoText: {
    color: theme.textSec,
    fontSize: 11.5,
    fontWeight: '700',
  },
  galleryList: {
    gap: 12,
  },
  galleryThumb: {
    width: 90,
    height: 115,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  galleryThumbActive: {
    borderColor: '#FF375F',
  },
  galleryThumbImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Progress Bar
  progressTrack: {
    height: 6,
    backgroundColor: theme.glassMid,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSubtext: {
    fontSize: 12.5,
    color: theme.textSec,
    lineHeight: 18,
  },
});
