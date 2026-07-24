// src/context/NotificationContext.jsx — Global In-App & Device Push Notification Provider
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { apiGetConversations, apiGetRequests, apiGetNotifications } from '../services/api';
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
  const lastUnreadNotifCountRef = useRef(0);
  const isInitialFetchRef = useRef(true);
  const isFetchingRef = useRef(false);

  const triggerNotification = useCallback((data) => {
    setBannerData(data);
    setBannerVisible(true);
  }, []);

  const dismissNotification = useCallback(() => {
    setBannerVisible(false);
  }, []);

  // Poll for new messages, match requests, and date proposals
  const checkNotifications = useCallback(async () => {
    if (!isAuthenticated || !user || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [chatRes, reqRes, notifRes] = await Promise.all([
        apiGetConversations().catch(() => null),
        apiGetRequests().catch(() => null),
        apiGetNotifications().catch(() => null),
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

      // 2. Check for NEW Match Requests & Date Proposals
      if (reqRes?.requests && Array.isArray(reqRes.requests)) {
        const pendingList = reqRes.requests.filter(
          (r) => (r.request_status || r.status || 'pending') === 'pending'
        );
        const currentPendingCount = pendingList.length;
        const prevPendingCount = lastPendingRequestsCountRef.current;

        if (!isInitialFetchRef.current && currentPendingCount > prevPendingCount) {
          const latestReq = pendingList[0];
          const isProposal = latestReq?.type === 'date_proposal' || latestReq?.request_type === 'date_proposal';

          triggerNotification({
            type: isProposal ? 'date_proposal' : 'request',
            title: isProposal ? 'New Date Proposal! 🥂' : 'New Match Request! ⚡',
            message: latestReq?.name
              ? (isProposal
                  ? `${latestReq.name} invited you on a date at ${latestReq.restaurant?.name || 'a date spot'}!`
                  : `${latestReq.name} wants to connect with you`)
              : 'Someone sent you a request!',
            avatar: latestReq?.avatar ? formatImageUrl(latestReq.avatar) : null,
            userId: latestReq?.user_id || latestReq?.user?.id,
            user: latestReq?.user,
          });
        }
        lastPendingRequestsCountRef.current = currentPendingCount;
      }

      // 3. Check for Notifications (date responses, acceptances, etc.)
      if (notifRes?.notifications && Array.isArray(notifRes.notifications)) {
        const unreadNotifs = notifRes.notifications.filter((n) => !n.is_read);
        const currentUnreadNotifCount = unreadNotifs.length;
        const prevUnreadNotifCount = lastUnreadNotifCountRef.current || 0;

        if (!isInitialFetchRef.current && currentUnreadNotifCount > prevUnreadNotifCount) {
          const latestNotif = unreadNotifs[0];
          if (latestNotif) {
            const notifType = latestNotif.type || 'notification';
            let title = 'HeartLink Alert 🥂';
            if (notifType === 'request_accepted') title = 'Request Accepted! 💕';
            else if (notifType === 'message_reaction') title = 'New Reaction! ❤️';
            else if (notifType === 'date_proposal') title = 'New Date Proposal! 🥂';
            else if (notifType.includes('date')) title = 'Date Update 🥂';

            triggerNotification({
              type: notifType,
              title,
              message: latestNotif.message || 'You have a new update!',
              avatar: latestNotif.from_user?.avatar ? formatImageUrl(latestNotif.from_user.avatar) : null,
              userId: latestNotif.from_user?.id,
              user: latestNotif.from_user,
            });
          }
        }
        lastUnreadNotifCountRef.current = currentUnreadNotifCount;
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
