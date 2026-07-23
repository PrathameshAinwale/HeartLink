// src/context/NotificationContext.jsx — Global In-App & Device Push Notification Provider
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { apiGetConversations, apiGetRequests } from '../services/api';
import { formatImageUrl } from '../utils/helpers';

const NotificationContext = createContext({
  bannerVisible: false,
  bannerData: null,
  triggerNotification: () => {},
  dismissNotification: () => {},
});

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerData, setBannerData] = useState(null);

  // Tracking previous counts to detect incoming notifications
  const lastUnreadCountRef = useRef({});
  const lastPendingRequestsCountRef = useRef(0);
  const isInitialFetchRef = useRef(true);
  const isFetchingRef = useRef(false);

  const triggerNotification = useCallback((data) => {
    setBannerData(data);
    setBannerVisible(true);
  }, []);

  const dismissNotification = useCallback(() => {
    setBannerVisible(false);
  }, []);

  // Poll for new messages and new match requests
  const checkNotifications = useCallback(async () => {
    if (!isAuthenticated || !user || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [chatRes, reqRes] = await Promise.all([
        apiGetConversations().catch(() => null),
        apiGetRequests().catch(() => null),
      ]);

      // 1. Check for NEW Chat Messages
      if (chatRes?.conversations && Array.isArray(chatRes.conversations)) {
        chatRes.conversations.forEach((conv) => {
          const userId = conv.id;
          const currentUnread = conv.unread_count || 0;
          const prevUnread = lastUnreadCountRef.current[userId] || 0;

          if (!isInitialFetchRef.current && currentUnread > prevUnread) {
            // New unread message received from this user!
            triggerNotification({
              type: 'chat',
              title: conv.name || 'New Message',
              message: conv.last_msg || 'Sent you a message',
              avatar: formatImageUrl(conv.avatar),
              userId: conv.id,
              user: conv.user,
            });
          }
          lastUnreadCountRef.current[userId] = currentUnread;
        });
      }

      // 2. Check for NEW Match Requests
      if (reqRes?.requests && Array.isArray(reqRes.requests)) {
        const pendingList = reqRes.requests.filter(
          (r) => (r.request_status || r.status || 'pending') === 'pending'
        );
        const currentPendingCount = pendingList.length;
        const prevPendingCount = lastPendingRequestsCountRef.current;

        if (!isInitialFetchRef.current && currentPendingCount > prevPendingCount) {
          // New match request received!
          const latestReq = pendingList[0];
          triggerNotification({
            type: 'request',
            title: 'New Match Request! ⚡',
            message: latestReq?.name ? `${latestReq.name} wants to connect with you` : 'Someone sent you a cosmic match request!',
            avatar: latestReq?.avatar ? formatImageUrl(latestReq.avatar) : null,
          });
        }
        lastPendingRequestsCountRef.current = currentPendingCount;
      }

      if (isInitialFetchRef.current) {
        isInitialFetchRef.current = false;
      }
    } catch (err) {
      // ignore transient poll errors
    } finally {
      isFetchingRef.current = false;
    }
  }, [isAuthenticated, user, triggerNotification]);

  useEffect(() => {
    if (isAuthenticated) {
      isInitialFetchRef.current = true;
      checkNotifications();
      const interval = setInterval(checkNotifications, 2000); // 2-second snappy polling
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, checkNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        bannerVisible,
        bannerData,
        triggerNotification,
        dismissNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
