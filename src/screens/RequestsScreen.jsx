// src/screens/RequestsScreen.jsx — Swipeable Requests Deck with Top Boosted Inquiry
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, SafeAreaView, StatusBar, Alert, Dimensions, FlatList, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import ProfileDetail from '../components/discovery/ProfileDetail';
import CustomAlertModal from '../components/CustomAlertModal';
import { apiGetRequests, apiAcceptRequest, apiDeclineRequest, apiRespondDateProposal, apiUnmatchUser } from '../services/api';
import { ensureArray, formatImageUrl } from '../utils/helpers';

const { width, height } = Dimensions.get('window');

export default function RequestsScreen() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const loadRequests = async () => {
    try {
      const res = await apiGetRequests();
      if (res?.requests && Array.isArray(res.requests)) {
        const apiList = res.requests.map(u => {
          const rawAvatar = u.avatar || (u.photos && u.photos[0]?.photo_url) || (u.user && u.user.avatar) || '';
          const rawPhotos = ensureArray(u.photos?.map(p => (typeof p === 'string' ? p : (p ? (p.photo_url || p.uri) : null))).filter(Boolean));
          if (rawAvatar && !rawPhotos.includes(rawAvatar)) rawPhotos.unshift(rawAvatar);
          const formattedPhotos = rawPhotos.map(p => formatImageUrl(p)).filter(Boolean);

          const isBoosted = !!(u.is_boosted || u.swipe_type === 'super_like' || u.type === 'date_proposal');
          const dateStr = u.date_sent || 'Recently';
          const reqStatus = u.request_status || 'pending';

          return {
            id: u.id,
            booking_id: u.booking_id,
            type: u.type || 'match_request',
            is_outgoing: !!u.is_outgoing,
            restaurant: u.restaurant,
            booking_date: u.booking_date,
            booking_time: u.booking_time,
            name: u.name,
            age: u.user?.age || u.age || 24,
            job: u.user?.job || u.job || 'Member',
            image: formatImageUrl(rawAvatar),
            images: formattedPhotos.length > 0 ? formattedPhotos : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'],
            interests: ensureArray(u.user?.interests || u.interests, ['Travel', 'Music', 'Photography']),
            likedAt: dateStr,
            dateSent: dateStr,
            bio: u.user?.bio || u.bio || 'Interested in connecting with you!',
            compatibility: u.user?.compatibility_score || u.compatibility_score || 92,
            mutuals: [],
            is_boosted: isBoosted,
            status: reqStatus,
          };
        });

        // Boosted & Pending requests come first, followed by date
        apiList.sort((a, b) => {
          if (a.is_boosted !== b.is_boosted) return b.is_boosted ? 1 : -1;
          const rank = { pending: 3, accepted: 2, declined: 1 };
          return (rank[b.status] || 0) - (rank[a.status] || 0);
        });

        setRequests(apiList);
      }
    } catch (e) {
      console.warn('Load requests error:', e?.message);
    }
  };

  useEffect(() => {
    loadRequests();
    const unsubscribe = navigation.addListener('focus', () => {
      loadRequests();
    });
    return unsubscribe;
  }, [navigation]);

  const [matchAlertVisible, setMatchAlertVisible] = useState(false);
  const [declineAlertVisible, setDeclineAlertVisible] = useState(false);

  const accept = async (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' } : r));
    try {
      await apiAcceptRequest(id);
    } catch (e) {
      console.warn('Accept error:', e?.message);
    }
    setMatchAlertVisible(true);
  };

  const decline = async (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'declined' } : r));
    try {
      await apiDeclineRequest(id);
    } catch (e) {
      console.warn('Decline error:', e?.message);
    }
  };

  const openProfile = (profile) => {
    const formatted = {
      ...profile,
      images: [profile.image],
      distance: profile.likedAt,
    };
    setSelectedProfile(formatted);
    setDetailVisible(true);
  };

  const unmatchAndRemove = async (item) => {
    if (!item) return;
    const rawId = item.id;
    const targetUserId = item.user_id || (typeof rawId === 'string' ? rawId.replace('swipe_', '').replace('proposal_', '') : rawId);
    setRequests(prev => prev.filter(r => r.id !== item.id));
    try {
      await apiUnmatchUser(targetUserId);
    } catch (e) {
      console.warn('Unmatch error:', e?.message);
    }
  };

  const openChatForProfile = (item) => {
    if (!item) return;
    const rawId = item.id;
    const targetUserId = item.user_id || (typeof rawId === 'string' ? rawId.replace('swipe_', '').replace('proposal_', '') : rawId);
    navigation.navigate('ChatDetail', { userId: targetUserId });
  };

  const acceptDateProposal = async (item) => {
    setRequests(prev => prev.map(r => r.id === item.id ? { ...r, status: 'accepted' } : r));
    try {
      await apiRespondDateProposal(item.booking_id, 'accepted');
    } catch (e) {
      console.warn('Accept date proposal error:', e?.message);
    }
  };

  const declineDateProposal = async (item) => {
    setRequests(prev => prev.map(r => r.id === item.id ? { ...r, status: 'declined' } : r));
    try {
      await apiRespondDateProposal(item.booking_id, 'declined');
    } catch (e) {
      console.warn('Decline date proposal error:', e?.message);
    }
  };

  const renderAdmirer = ({ item }) => {
    const isBoosted = item.is_boosted;
    const isAccepted = item.status === 'accepted';
    const isDeclined = item.status === 'declined' || item.status === 'rejected';

    if (item.type === 'date_proposal') {
      const restName = item.restaurant?.name || 'Romantic Restaurant';
      const restImg = item.restaurant?.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600';

      return (
        <View style={styles.dateProposalCard}>
          <BlurView intensity={isDark ? 55 : 85} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.15)', 'rgba(255, 0, 127, 0.15)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Proposal Badge Banner */}
          <View style={styles.dateProposalHeader}>
            <LinearGradient colors={['#F59E0B', '#FF007F']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.dateProposalBadge}>
              <Ionicons name="wine" size={11} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.dateProposalBadgeTxt}>🍷 DATE PROPOSAL</Text>
            </LinearGradient>
            <Text style={styles.dateProposalTime}>{item.dateSent}</Text>
          </View>

          {/* Body: Person & Restaurant Info */}
          <View style={styles.dateProposalBody}>
            <TouchableOpacity onPress={() => openProfile(item)} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Image source={{ uri: item.image }} style={styles.dateProposalUserAvatar} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.dateProposalUserTitle}>
                  {item.is_outgoing ? `You proposed a date to ${item.name}` : `${item.name} invited you on a date!`}
                </Text>
                <Text style={styles.dateProposalSub}>{item.job} · {item.compatibility}% Match</Text>
              </View>
            </TouchableOpacity>

            {/* Restaurant Box */}
            <View style={styles.dateRestaurantBox}>
              <Image source={{ uri: formatImageUrl(restImg) }} style={styles.dateRestaurantImg} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.dateRestaurantName} numberOfLines={1}>{restName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons name="calendar-outline" size={12} color="#FF007F" style={{ marginRight: 4 }} />
                  <Text style={styles.dateDetailsTxt}>{item.booking_date} at {item.booking_time}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons / Status */}
          <View style={styles.dateProposalFooter}>
            {isAccepted ? (
              <View style={styles.dateAcceptedPill}>
                <Ionicons name="checkmark-circle" size={16} color="#30D158" style={{ marginRight: 6 }} />
                <Text style={styles.dateAcceptedPillTxt}>Date Proposal Accepted! 🥂</Text>
              </View>
            ) : isDeclined ? (
              <View style={styles.dateDeclinedPill}>
                <Ionicons name="close-circle" size={16} color="#FF375F" style={{ marginRight: 6 }} />
                <Text style={styles.dateDeclinedPillTxt}>Date Proposal Declined</Text>
              </View>
            ) : item.is_outgoing ? (
              <View style={styles.datePendingPill}>
                <Ionicons name="time-outline" size={14} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={styles.datePendingPillTxt}>Waiting for {item.name}'s response...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10, flex: 1, marginTop: 4 }}>
                <TouchableOpacity style={styles.dateDeclineBtn} onPress={() => declineDateProposal(item)}>
                  <Ionicons name="close-circle" size={15} color="#FF375F" style={{ marginRight: 4 }} />
                  <Text style={styles.dateDeclineBtnTxt}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateAcceptBtn} onPress={() => acceptDateProposal(item)}>
                  <LinearGradient colors={['#30D158', '#10B981']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={styles.dateAcceptGrad}>
                    <Ionicons name="checkmark-circle" size={15} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.dateAcceptBtnTxt}>Accept Date 🥂</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.cardStrip, isBoosted && styles.cardStripBoosted]}
        onPress={() => openProfile(item)}
        activeOpacity={0.85}
      >
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />

        {isBoosted && (
          <LinearGradient
            colors={['rgba(167, 139, 250, 0.25)', 'rgba(244, 114, 182, 0.25)']}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Asymmetric avatar */}
        <Image source={{ uri: item.image }} style={[styles.stripAvatar, isBoosted && styles.stripAvatarBoosted]} />
        
        <View style={styles.stripInfo}>
          <View style={styles.stripTitleRow}>
            <Text style={styles.stripName} numberOfLines={1}>{item.name}</Text>
            {isBoosted && (
              <View style={styles.boostPillTag}>
                <Ionicons name="flash" size={9} color="#FFF" style={{ marginRight: 2 }} />
                <Text style={styles.boostPillTxt}>BOOSTED</Text>
              </View>
            )}
          </View>
          
          {/* Compatibility & Date Sent tag */}
          <View style={[styles.stripCompatBadge, isBoosted && styles.stripCompatBadgeBoosted]}>
            <Ionicons name={isBoosted ? "flash" : "heart"} size={8} color={isBoosted ? "#FFD700" : "#FF375F"} />
            <Text style={[styles.stripCompatText, isBoosted && { color: theme.textPrimary }]}>
              {item.compatibility}% match · {item.dateSent || item.likedAt}
            </Text>
          </View>
        </View>

        <View style={styles.stripActions}>
          {isAccepted ? (
            <View style={styles.acceptedPill}>
              <Ionicons name="checkmark-circle" size={14} color="#30D158" style={{ marginRight: 4 }} />
              <Text style={styles.acceptedPillTxt}>Accepted</Text>
            </View>
          ) : isDeclined ? (
            <View style={styles.declinedPill}>
              <Ionicons name="close-circle" size={14} color="#8E8E93" style={{ marginRight: 4 }} />
              <Text style={styles.declinedPillTxt}>Declined</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.stripDecline} onPress={() => decline(item.id)}>
                <Ionicons name="close" size={16} color={theme.textSec} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.stripAccept} onPress={() => accept(item.id)}>
                <LinearGradient
                  colors={isBoosted ? ['#8B5CF6', '#D946EF'] : theme.gradientAccent}
                  style={styles.stripAcceptGrad}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const pendingCount = useMemo(() => {
    return requests.filter(r => (r.status || r.request_status || 'pending') === 'pending').length;
  }, [requests]);

  const renderHeader = () => (
    <View>
      {requests.length > 0 && (
        <Text style={styles.listSectionTitle}>All Requests</Text>
      )}
    </View>
  );

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Glowing background depth blobs */}
      <View style={styles.glowBlobCyan} pointerEvents="none" />
      <View style={styles.glowBlobPurple} pointerEvents="none" />

      <SafeAreaView style={styles.flex}>
        {/* Header navigation bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Requests</Text>
            <Text style={styles.sub}>{requests.length} cosmic admirers</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <Ionicons name="notifications" size={20} color={theme.textPrimary} />
            {pendingCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {requests.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <Ionicons name="heart-half-outline" size={60} color={theme.textFaint} />
              <Text style={styles.emptyTitle}>Empty space</Text>
              <Text style={styles.emptySub}>When someone sends you cosmic likes, they'll appear here</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderAdmirer}
            keyExtractor={i => i.id}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* Details slide-up sheet */}
      <ProfileDetail
        visible={detailVisible}
        profile={selectedProfile}
        onClose={() => {
          setDetailVisible(false);
          setSelectedProfile(null);
        }}
        onLike={selectedProfile?.status === 'accepted' ? () => {
          const p = selectedProfile;
          setDetailVisible(false);
          setSelectedProfile(null);
          openChatForProfile(p);
        } : (id) => accept(id)}
        onPass={selectedProfile?.status === 'accepted' ? () => {
          const p = selectedProfile;
          setDetailVisible(false);
          setSelectedProfile(null);
          unmatchAndRemove(p);
        } : (id) => decline(id)}
        isMatch={selectedProfile?.status === 'accepted'}
      />

      <CustomAlertModal
        visible={matchAlertVisible}
        title="It's a Match!"
        message="You and your admirer can now message each other."
        icon="heart"
        iconColor="#FF007F"
        confirmText="Start Chatting"
        onConfirm={() => setMatchAlertVisible(false)}
      />
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, position: 'relative' },

  // Glowing fader blobs
  glowBlobCyan: {
    position: 'absolute',
    top: height * 0.08,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 191, 255, 0.16)',
    opacity: 0.7,
    zIndex: 0,
  },
  glowBlobPurple: {
    position: 'absolute',
    bottom: height * 0.18,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(123, 47, 190, 0.20)',
    opacity: 0.8,
    zIndex: 0,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 14 : 14,
    paddingBottom: 16,
    zIndex: 10,
  },
  title: { fontSize: 28, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.6 },
  sub:   { fontSize: 13, color: theme.textSec, marginTop: 3 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.glass,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: '#FF375F', borderRadius: 9,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: theme.isDark ? '#08080C' : '#fff',
  },
  bellBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },

  // ── Boost Section at the Top ──────────────────────────────────────────
  boostSection: {
    marginBottom: 26,
  },
  boostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  boostHeaderIconGrad: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 1.2,
  },
  boostCard: {
    height: 230,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: theme.glass,
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.isDark ? 0.35 : 0.15,
    shadowRadius: 14,
  },
  boostCardImg: { position: 'absolute', width: '100%', height: '100%', resizeMode: 'cover' },
  boostCardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
  boostCompatPill: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.45)',
    borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    zIndex: 5,
  },
  boostCompatText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  boostDetails: { position: 'absolute', bottom: 20, left: 20 },
  boostName: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },
  boostJob: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  boostTime: { fontSize: 11, color: '#A78BFA', fontWeight: '700', marginTop: 5 },
  boostActions: {
    position: 'absolute', bottom: 16, right: 16,
    flexDirection: 'row', gap: 10, alignItems: 'center',
  },
  boostDecline: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostAccept: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
  boostAcceptGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Standard List Section ──────────────────────────────────────────────
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  cardStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.glass,
    borderRadius: 22,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardStripBoosted: {
    borderColor: '#8B5CF6',
    borderWidth: 1.5,
    backgroundColor: theme.isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)',
  },
  stripAvatar: {
    width: 66,
    height: 66,
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
  },
  stripAvatarBoosted: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  stripInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
    justifyContent: 'center',
  },
  stripTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  stripName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  boostPillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  boostPillTxt: {
    color: '#FFF',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  stripJob: {
    fontSize: 12,
    color: theme.textSec,
    marginTop: 2,
  },
  stripCompatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 55, 95, 0.10)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  stripCompatBadgeBoosted: {
    backgroundColor: 'rgba(139, 92, 246, 0.20)',
  },
  stripCompatText: {
    color: '#FF375F',
    fontSize: 8.5,
    fontWeight: '800',
  },
  stripActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexShrink: 0,
  },
  acceptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  acceptedPillTxt: {
    color: '#30D158',
    fontSize: 11,
    fontWeight: '800',
  },
  declinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.3)',
  },
  declinedPillTxt: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '800',
  },
  stripDecline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stripAccept: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  stripAcceptGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
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

  // Date Proposal Card Styles
  dateProposalCard: {
    backgroundColor: theme.glass,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: theme.isDark ? 0.35 : 0.15,
    shadowRadius: 10,
  },
  dateProposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateProposalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateProposalBadgeTxt: {
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dateProposalTime: {
    fontSize: 11,
    color: theme.textSec,
    fontWeight: '600',
  },
  dateProposalBody: {
    marginBottom: 10,
  },
  dateProposalUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#FF007F',
  },
  dateProposalUserTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  dateProposalSub: {
    fontSize: 11.5,
    color: theme.textSec,
    marginTop: 2,
  },
  dateRestaurantBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dateRestaurantImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  dateRestaurantName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  dateDetailsTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF007F',
  },
  dateProposalFooter: {
    marginTop: 6,
  },
  dateAcceptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderWidth: 1,
    borderColor: '#30D158',
  },
  dateAcceptedPillTxt: {
    color: '#30D158',
    fontSize: 12.5,
    fontWeight: '800',
  },
  dateDeclinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 55, 95, 0.12)',
    borderWidth: 1,
    borderColor: '#FF375F',
  },
  dateDeclinedPillTxt: {
    color: '#FF375F',
    fontSize: 12.5,
    fontWeight: '800',
  },
  datePendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  datePendingPillTxt: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  dateDeclineBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 55, 95, 0.12)',
    borderWidth: 1,
    borderColor: '#FF375F',
  },
  dateDeclineBtnTxt: {
    color: '#FF375F',
    fontSize: 12.5,
    fontWeight: '800',
  },
  dateAcceptBtn: {
    flex: 1.4,
    borderRadius: 14,
    overflow: 'hidden',
  },
  dateAcceptGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dateAcceptBtnTxt: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
