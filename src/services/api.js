// src/services/api.js — HeartLink API Service Client Bridge for Laravel Backend
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';

const TOKEN_STORAGE_KEY = '@heartlink_token_session';
let userToken = null;
let activeWorkingHost = null;

const getHostCandidates = () => {
  const hosts = [];

  // If we already know a working host from previous successful requests, try it first
  if (activeWorkingHost) {
    hosts.push(activeWorkingHost);
  }

  // 1. Dynamic host IP provided by Expo CLI (resolves exact PC IP for LAN/physical phone/emulator)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      hosts.push(`http://${ip}:8000/api/v1`);
    }
  }

  // 2. Android Emulator standard loopback
  if (Platform.OS === 'android') {
    hosts.push('http://10.0.2.2:8000/api/v1');
  }

  // 3. Fallbacks
  hosts.push('http://127.0.0.1:8000/api/v1');
  hosts.push('http://localhost:8000/api/v1');

  // Deduplicate array preserving order
  return Array.from(new Set(hosts));
};

export const setAuthToken = (token) => {
  userToken = token;
};

export const getAuthToken = () => userToken;

// Eagerly load the token from storage once on startup
const _preloadToken = async () => {
  try {
    const saved = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved && !userToken) {
      userToken = saved;
    }
  } catch (_) {}
};
_preloadToken();

export const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const hosts = getHostCandidates();
  let lastError = null;

  for (const host of hosts) {
    try {
      const response = await fetch(`${host}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        // Successful network connection to host, even if server returned HTTP error status
        activeWorkingHost = host;
        throw new Error(data.message || 'API request failed');
      }

      // Record successful host for subsequent fast requests
      activeWorkingHost = host;
      return data;
    } catch (error) {
      lastError = error;
      // If server responded with status code / application error, don't attempt other hosts
      if (error.message && !error.message.includes('fetch failed') && !error.message.includes('Network request failed') && !error.message.includes('ConnectException')) {
        throw error;
      }
    }
  }

  console.warn(`[HeartLink API Error] ${endpoint}:`, lastError?.message);
  throw lastError || new Error('Unable to connect to Laravel backend');
};

// ─── Auth API ────────────────────────────────────────────────────────
export const apiRegister = (userData) => apiFetch('/auth/register', { method: 'POST', body: userData });
export const apiLogin    = (credentials) => apiFetch('/auth/login', { method: 'POST', body: credentials });
export const apiLogout   = () => apiFetch('/auth/logout', { method: 'POST' });
export const apiGetProfile = () => apiFetch('/user/profile');
export const apiUpdateProfile = (data) => apiFetch('/user/profile', { method: 'POST', body: data });

// ─── Discovery & Swiping API ─────────────────────────────────────────
export const apiGetDiscoveryFeed = () => apiFetch('/discover');
export const apiSwipeUser = (swipedUserId, type) => apiFetch('/discover/swipe', {
  method: 'POST',
  body: { swiped_user_id: swipedUserId, type },
});

// ─── Matches & Requests API ──────────────────────────────────────────
export const apiGetMatches  = () => apiFetch('/matches');
export const apiGetRequests = () => apiFetch('/requests');
export const apiAcceptRequest  = (userId) => apiFetch(`/requests/${userId}/accept`,  { method: 'POST' });
export const apiDeclineRequest = (userId) => apiFetch(`/requests/${userId}/decline`, { method: 'POST' });

// ─── Notifications API ───────────────────────────────────────────────
export const apiGetNotifications      = () => apiFetch('/notifications');
export const apiMarkNotificationsRead = () => apiFetch('/notifications/mark-read', { method: 'POST' });

// ─── Chat & Moderation API ───────────────────────────────────────────
export const apiGetConversations = () => apiFetch('/chats');
export const apiGetMessages = (otherUserId) => apiFetch(`/chats/${otherUserId}`);
export const apiSendMessage = (receiverId, message) => apiFetch('/chats/send', {
  method: 'POST',
  body: { receiver_id: receiverId, message },
});
export const apiBlockUser = (blockedUserId) => apiFetch('/users/block', {
  method: 'POST',
  body: { blocked_user_id: blockedUserId },
});
export const apiUnblockUser = (blockedUserId) => apiFetch('/users/unblock', {
  method: 'POST',
  body: { blocked_user_id: blockedUserId },
});
export const apiReportUser = (reportedUserId, reason) => apiFetch('/users/report', {
  method: 'POST',
  body: { reported_user_id: reportedUserId, reason },
});

// ─── Date Planner API ────────────────────────────────────────────────
export const apiGetRestaurants = () => apiFetch('/restaurants');
export const apiCreateDateProposal = (proposalData) => apiFetch('/date-bookings', {
  method: 'POST',
  body: proposalData,
});

// ─── Subscriptions API ───────────────────────────────────────────────
export const apiSubscribePlan = (planData) => apiFetch('/subscriptions/subscribe', {
  method: 'POST',
  body: planData,
});
