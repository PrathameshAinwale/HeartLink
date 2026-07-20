// src/screens/NotificationsScreen.jsx — In-app Notifications for accepted/declined requests
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  SafeAreaView, StatusBar, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { apiGetNotifications, apiMarkNotificationsRead } from '../services/api';

const { height } = Dimensions.get('window');

const TYPE_META = {
  request_accepted: {
    icon: 'heart',
    iconColor: '#FF375F',
    label: 'Request Accepted',
    bgColor: 'rgba(255, 55, 95, 0.12)',
  },
  request_declined: {
    icon: 'close-circle',
    iconColor: '#8B5CF6',
    label: 'Request Declined',
    bgColor: 'rgba(139, 92, 246, 0.12)',
  },
  new_match: {
    icon: 'star',
    iconColor: '#FFD700',
    label: 'New Match',
    bgColor: 'rgba(255, 215, 0, 0.10)',
  },
  new_like: {
    icon: 'heart-outline',
    iconColor: '#FF007F',
    label: 'Someone Liked You',
    bgColor: 'rgba(255, 0, 127, 0.08)',
  },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const res = await apiGetNotifications();
      if (res?.notifications) {
        setNotifications(res.notifications);
      }
    } catch (e) {
      console.warn('Load notifications error:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
      // Mark all as read when screen is opened
      apiMarkNotificationsRead().catch(() => {});
    }, [])
  );

  const renderItem = ({ item }) => {
    const meta = TYPE_META[item.type] || TYPE_META.new_like;
    const avatar = item.from_user?.avatar;

    return (
      <View style={[styles.card, !item.is_read && styles.cardUnread]}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={24} color={theme.textFaint} />
            </View>
          )}
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: meta.bgColor }]}>
            <Ionicons name={meta.icon} size={12} color={meta.iconColor} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.fromName}>{item.from_user?.name || 'Someone'}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.typePill, { backgroundColor: meta.bgColor }]}>
              <Text style={[styles.typeLabel, { color: meta.iconColor }]}>{meta.label}</Text>
            </View>
            <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>

        {/* Unread dot */}
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
    );
  };

  return (
    <LinearGradient colors={theme.bgGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Glow blobs */}
      <View style={styles.glowBlobPurple} pointerEvents="none" />
      <View style={styles.glowBlobCyan} pointerEvents="none" />

      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.sub}>
              {notifications.filter(n => !n.is_read).length} unread
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyCard}>
                  <Ionicons name="notifications-outline" size={60} color={theme.textFaint} />
                  <Text style={styles.emptyTitle}>All quiet here</Text>
                  <Text style={styles.emptySub}>
                    When someone accepts or declines your request, you'll see it here
                  </Text>
                </View>
              </View>
            )
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (theme) => StyleSheet.create({
  flex:  { flex: 1 },
  root:  { flex: 1, position: 'relative' },

  glowBlobPurple: {
    position: 'absolute', bottom: height * 0.2, right: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(123, 47, 190, 0.18)', zIndex: 0,
  },
  glowBlobCyan: {
    position: 'absolute', top: height * 0.1, left: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(0, 191, 255, 0.14)', zIndex: 0,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 14 : 14,
    paddingBottom: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.glass,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.border,
  },
  title: { fontSize: 22, fontWeight: '900', color: theme.textPrimary, textAlign: 'center', letterSpacing: -0.5 },
  sub:   { fontSize: 12, color: theme.textSec, textAlign: 'center', marginTop: 2 },

  list: { paddingHorizontal: 18, paddingBottom: 40, paddingTop: 4 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: theme.glass,
    borderRadius: 20, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: theme.border,
    position: 'relative',
  },
  cardUnread: {
    borderColor: 'rgba(255, 55, 95, 0.3)',
    backgroundColor: 'rgba(255, 55, 95, 0.04)',
  },

  avatarWrap: { position: 'relative', marginRight: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  avatarFallback: {
    backgroundColor: theme.glass,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.border,
  },
  typeBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: theme.bgDark,
  },

  content: { flex: 1 },
  fromName: { fontSize: 15, fontWeight: '800', color: theme.textPrimary, marginBottom: 3 },
  message:  { fontSize: 13, color: theme.textSec, lineHeight: 19, marginBottom: 8 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  typeLabel: { fontSize: 10, fontWeight: '800' },
  time:      { fontSize: 11, color: theme.textFaint },

  unreadDot: {
    position: 'absolute', top: 14, right: 14,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF375F',
  },

  // Empty state
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, paddingTop: 80 },
  emptyCard: {
    backgroundColor: theme.glass, borderRadius: 24, padding: 32,
    alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: theme.textPrimary },
  emptySub:   { fontSize: 14, color: theme.textSec, textAlign: 'center', lineHeight: 21 },
});
