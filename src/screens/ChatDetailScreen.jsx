import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Modal,
  Animated,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import ProfileDetail from '../components/discovery/ProfileDetail';
import {
  apiSendMessage,
  apiBlockUser,
  apiUnblockUser,
  apiReportUser,
  apiGetMessages,
} from '../services/api';

const { width, height } = Dimensions.get('window');

const DEFAULT_USER = {
  id: null,
  name: 'Match User',
  age: 24,
  job: 'Member',
  location: 'Nearby',
  bio: 'Connected on HeartLink.',
  image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
  online: true,
  compatibility: 85,
  distance: '3 km away',
  interests: ['Travel', 'Music', 'Photography'],
};

const REPORT_REASONS = [
  'Inappropriate or offensive messages',
  'Spam or fake profile',
  'Harassment or unwanted behavior',
  'Scam or commercial activity',
  'Other reason',
];

// Sample messages for fallback
const SAMPLE_MESSAGES = [
  {
    id: '1',
    text: 'Hey there! How are you doing?',
    sender: 'other',
    time: '10:30 AM',
  },
  {
    id: '2',
    text: "I'm doing great! Thanks for asking 😊",
    sender: 'me',
    time: '10:32 AM',
  },
  {
    id: '3',
    text: 'I really like your profile picture!',
    sender: 'other',
    time: '10:33 AM',
  },
  {
    id: '4',
    text: "Thank you! That's very kind of you to say.",
    sender: 'me',
    time: '10:35 AM',
  },
];

// How close to the bottom (in px) counts as "already at the bottom"
const NEAR_BOTTOM_THRESHOLD = 120;

// Lightweight equality check — avoids JSON.stringify allocations on every
// 2.5s poll tick, which was previously re-serializing the whole array just
// to detect read-receipt changes.
const messagesAreEqual = (a, b) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.isRead !== y.isRead || x.text !== y.text) {
      return false;
    }
  }
  return true;
};

// Memoized message bubble with a soft fade + rise entrance animation. Since
// FlatList reuses item identity via keyExtractor, this effect only fires
// once per message — the first time it mounts — giving new messages a
// gentle "arrive" motion instead of popping in instantly.
const MessageBubble = React.memo(function MessageBubble({
  item,
  theme,
  styles,
  avatarUri,
  onAvatarPress,
}) {
  const isMe = item.sender === 'me';
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(rise, {
        toValue: 0,
        useNativeDriver: true,
        damping: 16,
        mass: 0.6,
        stiffness: 180,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        styles.msgRow,
        isMe && styles.msgRowMe,
        { opacity: fade, transform: [{ translateY: rise }] },
      ]}
    >
      {!isMe && (
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
          <Image source={{ uri: avatarUri }} style={styles.msgAvatar} />
        </TouchableOpacity>
      )}
      {isMe ? (
        <LinearGradient
          colors={theme.gradientAccent}
          style={[styles.bubble, styles.bubbleMe]}
        >
          <Text style={styles.bubbleTextMe}>{item.text}</Text>
          <View style={styles.timeRowMe}>
            <Text style={styles.bubbleTimeMe}>{item.time}</Text>
            <Ionicons
              name={item.isRead ? 'checkmark-done' : 'checkmark'}
              size={13}
              color={item.isRead ? '#00E5FF' : 'rgba(255,255,255,0.7)'}
              style={{ marginLeft: 4 }}
            />
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.bubbleOther]}>
          <Text style={styles.bubbleTextOther}>{item.text}</Text>
          <Text style={styles.bubbleTimeOther}>{item.time}</Text>
        </View>
      )}
    </Animated.View>
  );
});

export default function ChatDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  // Custom toast notification state
  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  // --- Scroll tracking -----------------------------------------------
  const isNearBottomRef = useRef(true);
  const listContentHeightRef = useRef(0);
  const listLayoutHeightRef = useRef(0);
  const prevMessageCountRef = useRef(0);
  const prevLastMessageIdRef = useRef(null);

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const handleScroll = useCallback((e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    listContentHeightRef.current = contentSize.height;
    listLayoutHeightRef.current = layoutMeasurement.height;
    const distanceFromBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
    isNearBottomRef.current = nearBottom;
    setShowJumpToBottom((prev) => (prev === !nearBottom ? prev : !nearBottom));
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [scrollToBottom]);

  // Dynamic state for active chat recipient user details
  const [activeUser, setActiveUser] = useState(() => {
    if (route.params?.user) {
      return { ...DEFAULT_USER, ...route.params.user };
    }
    if (route.params?.name) {
      return {
        ...DEFAULT_USER,
        name: route.params.name,
        image: route.params.image || DEFAULT_USER.image,
      };
    }
    return DEFAULT_USER;
  });

  useEffect(() => {
    if (route.params?.user) {
      setActiveUser((prev) => ({ ...prev, ...route.params.user }));
    } else if (route.params?.name) {
      setActiveUser((prev) => ({
        ...prev,
        name: route.params.name,
        image: route.params.image || prev.image,
      }));
    }
  }, [route.params]);

  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // Animated dots for typing bubble
  const typingDot1 = useRef(new Animated.Value(0.3)).current;
  const typingDot2 = useRef(new Animated.Value(0.3)).current;
  const typingDot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    let anim;
    if (isOtherTyping) {
      const createDotAnim = (dotVal, delay) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(dotVal, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(dotVal, {
                toValue: 0.3,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.delay(300),
            ])
          ),
        ]);
      };
      anim = Animated.parallel([
        createDotAnim(typingDot1, 0),
        createDotAnim(typingDot2, 150),
        createDotAnim(typingDot3, 300),
      ]);
      anim.start();
      if (isNearBottomRef.current) {
        scrollToBottom(true);
      }
    }
    return () => anim && anim.stop();
  }, [isOtherTyping, scrollToBottom]);

  // Real-time message fetcher & background poller
  const targetId = useMemo(() => {
    return route.params?.userId || route.params?.user?.id || activeUser?.id;
  }, [route.params, activeUser]);

  const fetchHistory = useCallback(
    async (isFirst = false) => {
      if (isFirst) setIsLoading(true);
      if (!targetId) {
        if (isFirst) {
          setMessages(SAMPLE_MESSAGES);
          prevMessageCountRef.current = SAMPLE_MESSAGES.length;
          prevLastMessageIdRef.current =
            SAMPLE_MESSAGES[SAMPLE_MESSAGES.length - 1]?.id ?? null;
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await apiGetMessages(targetId);
        if (response?.is_blocked_by_me) {
          setIsBlocked(true);
        }

        const recipientObj =
          response?.user || response?.recipient || response?.other_user;
        if (recipientObj && recipientObj.name) {
          setActiveUser((prev) => ({
            ...prev,
            name: recipientObj.name || prev.name,
            image: recipientObj.avatar || recipientObj.image || prev.image,
            online:
              recipientObj.online !== undefined
                ? recipientObj.online
                : prev.online,
          }));
        }

        let messagesData = [];
        if (response && response.data) messagesData = response.data;
        else if (response && response.messages) messagesData = response.messages;
        else if (Array.isArray(response)) messagesData = response;
        else if (response && response.success && response.data)
          messagesData = response.data;

        if (Array.isArray(messagesData) && messagesData.length > 0) {
          const formatted = messagesData.map((m) => ({
            id: m.id?.toString() || Date.now().toString(),
            text: m.message || m.text || m.content || '',
            sender: m.sender_id == targetId ? 'other' : 'me',
            time: m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Now',
            isRead: Boolean(m.is_read),
          }));

          const newLastId = formatted[formatted.length - 1]?.id ?? null;
          const hasNewMessage =
            formatted.length !== prevMessageCountRef.current ||
            newLastId !== prevLastMessageIdRef.current;

          setMessages((prev) =>
            messagesAreEqual(prev, formatted) ? prev : formatted
          );

          // Only scroll if it's the first load OR we're near bottom AND there's a new message
          if (isFirst) {
            setTimeout(() => scrollToBottom(false), 250);
          } else if (hasNewMessage && isNearBottomRef.current) {
            // Use requestAnimationFrame for smoother scroll after state update
            requestAnimationFrame(() => {
              scrollToBottom(true);
            });
          }

          prevMessageCountRef.current = formatted.length;
          prevLastMessageIdRef.current = newLastId;
        } else if (isFirst) {
          setMessages(SAMPLE_MESSAGES);
          prevMessageCountRef.current = SAMPLE_MESSAGES.length;
          prevLastMessageIdRef.current =
            SAMPLE_MESSAGES[SAMPLE_MESSAGES.length - 1]?.id ?? null;
        }
      } catch (error) {
        console.log('Error fetching messages:', error);
        if (isFirst) {
          setMessages(SAMPLE_MESSAGES);
          prevMessageCountRef.current = SAMPLE_MESSAGES.length;
          prevLastMessageIdRef.current =
            SAMPLE_MESSAGES[SAMPLE_MESSAGES.length - 1]?.id ?? null;
        }
      } finally {
        if (isFirst) {
          setIsLoading(false);
          setTimeout(() => scrollToBottom(false), 250);
        }
      }
    },
    [targetId, scrollToBottom]
  );

  // Auto-polling interval every 2.5s for real-time messaging only when chat is active
  useEffect(() => {
    fetchHistory(true);
    const interval = setInterval(() => {
      fetchHistory(false);
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchHistory]);

  // Auto scroll to latest message when keyboard pops up or closes
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      if (isNearBottomRef.current) {
        setTimeout(() => scrollToBottom(true), 100);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (isNearBottomRef.current) {
        setTimeout(() => scrollToBottom(false), 50);
      }
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToBottom]);

  // Custom Toast Trigger
  const triggerCustomToast = (msg) => {
    setToastText(msg);
    setToastVisible(true);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(2600),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  };

  const send = async () => {
    if (isBlocked) return;
    const textToSend = input.trim();
    if (!textToSend || isSending) return;

    setIsSending(true);

    const newMessage = {
      id: `temp-${Date.now()}`,
      text: textToSend,
      sender: 'me',
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isRead: false,
      pending: true,
    };

    setMessages((p) => {
      const next = [...p, newMessage];
      prevMessageCountRef.current = next.length;
      prevLastMessageIdRef.current = newMessage.id;
      return next;
    });
    setInput('');

    // Force scroll to bottom immediately after adding message
    isNearBottomRef.current = true;
    setShowJumpToBottom(false);
    
    // Use requestAnimationFrame to ensure scroll happens after render
    requestAnimationFrame(() => {
      scrollToBottom(true);
    });

    if (targetId) {
      try {
        await apiSendMessage(targetId, textToSend);
        // Fetch new messages but preserve scroll position
        await fetchHistory(false);
        
        // After fetching, scroll to bottom again
        requestAnimationFrame(() => {
          if (isNearBottomRef.current) {
            scrollToBottom(true);
          }
        });
      } catch (error) {
        console.log('Error sending message:', error);
      }
    }

    setIsSending(false);
  };

  // Spring-based press feedback for the send button — makes tapping feel
  // responsive instead of a flat opacity toggle.
  const sendScale = useRef(new Animated.Value(1)).current;
  const onSendPressIn = () => {
    Animated.spring(sendScale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };
  const onSendPressOut = () => {
    Animated.spring(sendScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 9,
    }).start();
  };

  // Jump-to-bottom pill fades/scales in and out instead of hard-mounting,
  // so it doesn't pop abruptly when the scroll position crosses the
  // threshold.
  const jumpAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(jumpAnim, {
      toValue: showJumpToBottom ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();
  }, [showJumpToBottom, jumpAnim]);

  const handleConfirmBlock = () => {
    setShowBlockModal(false);
    setIsBlocked(true);
    triggerCustomToast(`${activeUser.name} has been blocked successfully.`);

    if (activeUser && activeUser.id) {
      apiBlockUser(activeUser.id).catch((error) => {
        console.log('Block API error:', error);
      });
    }
  };

  const handleConfirmUnblock = async () => {
    setShowMenu(false);
    if (activeUser && activeUser.id) {
      try {
        await apiUnblockUser(activeUser.id);
        setIsBlocked(false);
        triggerCustomToast(`${activeUser.name} has been unblocked.`);
        fetchHistory(false);
      } catch (error) {
        console.log('Unblock API error:', error);
      }
    }
  };

  const handleConfirmReport = () => {
    setShowReportModal(false);
    triggerCustomToast(`Report submitted for ${activeUser.name}. Thank you!`);

    if (activeUser && activeUser.id) {
      apiReportUser(activeUser.id, selectedReason || 'Inappropriate behavior').catch(
        (error) => {
          console.log('Report API error:', error);
        }
      );
    }
  };

  const openProfile = useCallback(() => setShowProfileModal(true), []);

  const renderMsg = useCallback(
    ({ item }) => (
      <MessageBubble
        item={item}
        theme={theme}
        styles={styles}
        avatarUri={activeUser.image}
        onAvatarPress={openProfile}
      />
    ),
    [theme, styles, activeUser.image, openProfile]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  if (isLoading) {
    return (
      <LinearGradient
        colors={theme.bgGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.root}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent || '#FF007F'} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={theme.bgGrad}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Background blobs */}
      <View style={styles.glowBlobCyan} pointerEvents="none" />
      <View style={styles.glowBlobFuchsia} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      {/* Header */}
      <View style={styles.headerContainer}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerProfileTouch}
              onPress={openProfile}
              activeOpacity={0.75}
            >
              <Image source={{ uri: activeUser.image }} style={styles.headerAvatar} />

              <View style={styles.headerInfo}>
                <Text style={styles.headerName}>{activeUser.name}</Text>
                <View style={styles.onlineRow}>
                  {isOtherTyping ? (
                    <>
                      <View style={[styles.onlineDot, { backgroundColor: '#30D158' }]} />
                      <Text style={[styles.onlineText, { color: '#30D158', fontWeight: '700' }]}>
                        typing...
                      </Text>
                    </>
                  ) : (
                    <>
                      {activeUser.online && <View style={styles.onlineDot} />}
                      <Text style={styles.onlineText}>
                        {activeUser.online ? 'Online now' : 'Offline'}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setShowMenu((p) => !p)}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Floating 3-Dots Dropdown Menu */}
      {showMenu && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.dropdownCard}>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setShowMenu(false);
                setShowReportModal(true);
              }}
            >
              <Ionicons name="flag-outline" size={18} color="#FF9500" />
              <Text style={styles.dropdownOptionText}>Report User</Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            {isBlocked ? (
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={handleConfirmUnblock}
              >
                <Ionicons name="lock-open-outline" size={18} color="#30D158" />
                <Text style={[styles.dropdownOptionText, { color: '#30D158' }]}>
                  Unblock User
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => {
                  setShowMenu(false);
                  setShowBlockModal(true);
                }}
              >
                <Ionicons name="ban-outline" size={18} color="#FF375F" />
                <Text style={[styles.dropdownOptionText, { color: '#FF375F' }]}>
                  Block User
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      )}

        {/* Messages log */}
        <View style={styles.messagesArea}>
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMsg}
            keyExtractor={keyExtractor}
            contentContainerStyle={[
              styles.msgList,
              { flexGrow: 1, justifyContent: 'flex-end' },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={handleContentSizeChange}
            onLayout={() => scrollToBottom(false)}
            // Perf: keeps scrolling smooth as the thread grows, and avoids
            // re-mounting/blanking rows mid-scroll on iOS.
            initialNumToRender={16}
            maxToRenderPerBatch={12}
            windowSize={11}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={Platform.OS === 'android'}
            ListFooterComponent={
              isOtherTyping ? (
                <View style={[styles.msgRow, { marginBottom: 6 }]}>
                  <TouchableOpacity onPress={openProfile} activeOpacity={0.8}>
                    <Image source={{ uri: activeUser.image }} style={styles.msgAvatar} />
                  </TouchableOpacity>
                  <View style={[styles.bubble, styles.bubbleOther, styles.typingBubble]}>
                    <View style={styles.typingDotsRow}>
                      <Animated.View style={[styles.typingDot, { opacity: typingDot1 }]} />
                      <Animated.View style={[styles.typingDot, { opacity: typingDot2 }]} />
                      <Animated.View style={[styles.typingDot, { opacity: typingDot3 }]} />
                    </View>
                  </View>
                </View>
              ) : null
            }
          />

          {/* "Jump to latest" pill — animates in/out smoothly */}
          <Animated.View
            pointerEvents={showJumpToBottom ? 'auto' : 'none'}
            style={[
              styles.jumpToBottomBtn,
              {
                opacity: jumpAnim,
                transform: [
                  {
                    scale: jumpAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                  },
                  {
                    translateY: jumpAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                isNearBottomRef.current = true;
                setShowJumpToBottom(false);
                scrollToBottom(true);
              }}
            >
              <LinearGradient colors={theme.gradientAccent} style={styles.jumpToBottomGrad}>
                <Ionicons name="chevron-down" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Input deck or Blocked Banner */}
        <View style={styles.inputContainer}>
          <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
            {isBlocked ? (
              <View style={styles.blockedBannerRow}>
                <Text style={styles.blockedBannerText}>
                  You blocked this user.
                </Text>
                <TouchableOpacity onPress={handleConfirmUnblock} style={styles.unblockBannerBtn}>
                  <Text style={styles.unblockBannerBtnText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputRow}>
                <View style={styles.inputWrap}>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Type message…"
                    placeholderTextColor={theme.textFaint}
                    value={input}
                    onChangeText={setInput}
                    multiline
                  />
                </View>

                <TouchableOpacity
                  onPress={send}
                  onPressIn={onSendPressIn}
                  onPressOut={onSendPressOut}
                  activeOpacity={0.9}
                  style={styles.sendBtn}
                  disabled={isSending || !input.trim()}
                >
                  <Animated.View style={{ flex: 1, transform: [{ scale: sendScale }] }}>
                    <LinearGradient
                      colors={theme.gradientAccent}
                      style={[
                        styles.sendGrad,
                        (!input.trim() || isSending) && styles.sendGradDisabled,
                      ]}
                    >
                      <Ionicons name="send" size={15} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>

      {/* Profile Detail Modal (Matches & Requests style popup) */}
      <ProfileDetail
        visible={showProfileModal}
        profile={activeUser}
        onClose={() => setShowProfileModal(false)}
        isMatch={true}
      />

      {/* Custom Block Confirmation Modal */}
      <Modal
        visible={showBlockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.customAlertCard}>
            <View style={styles.alertIconCircleDanger}>
              <Ionicons name="ban" size={30} color="#FF375F" />
            </View>
            <Text style={styles.alertTitle}>Block User</Text>
            <Text style={styles.alertText}>
              Do you really want to block {activeUser.name}?
            </Text>

            <View style={styles.alertButtonsRow}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                onPress={() => setShowBlockModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.alertCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertConfirmBtnDanger}
                onPress={handleConfirmBlock}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#FF375F', '#D00040']} style={styles.alertBtnGrad}>
                  <Text style={styles.alertConfirmTxt}>Block</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.customReportCard}>
            <View style={styles.alertIconCircleWarning}>
              <Ionicons name="flag" size={26} color="#FF9500" />
            </View>
            <Text style={styles.alertTitle}>Report {activeUser.name}</Text>
            <Text style={styles.alertSubTitle}>
              Select a reason for reporting this user:
            </Text>

            <View style={styles.reportReasonsList}>
              {REPORT_REASONS.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.reportReasonItem,
                    selectedReason === reason && styles.reportReasonSelected,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={
                      selectedReason === reason ? 'radio-button-on' : 'radio-button-off'
                    }
                    size={18}
                    color={selectedReason === reason ? '#FF007F' : theme.textFaint}
                  />
                  <Text
                    style={[
                      styles.reportReasonTxt,
                      selectedReason === reason && styles.reportReasonTxtSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.alertButtonsRow}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                onPress={() => setShowReportModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.alertCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertConfirmBtn}
                onPress={handleConfirmReport}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#FF007F', '#B5179E']} style={styles.alertBtnGrad}>
                  <Text style={styles.alertConfirmTxt}>Submit Report</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Tailored Notification Toast */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.customToastWrap,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="checkmark-circle" size={22} color="#30D158" />
          <Text style={styles.customToastTxt}>{toastText}</Text>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    root: { flex: 1, position: 'relative' },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: theme.textSec,
      fontSize: 16,
      marginTop: 12,
    },

    glowBlobCyan: {
      position: 'absolute',
      top: height * 0.15,
      left: -80,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(0, 191, 255, 0.12)',
      opacity: theme.isDark ? 0.35 : 0.04,
      zIndex: 0,
    },
    glowBlobFuchsia: {
      position: 'absolute',
      bottom: height * 0.3,
      right: -80,
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: 'rgba(255, 0, 127, 0.12)',
      opacity: theme.isDark ? 0.4 : 0.04,
      zIndex: 0,
    },

    // Header
    headerContainer: {
      backgroundColor: theme.isDark ? '#160F2B' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      zIndex: 10,
    },
    headerSafeArea: {
      width: '100%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 14,
      gap: 10,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerProfileTouch: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    headerInfo: { flex: 1 },
    headerName: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: -0.2,
    },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    onlineDot: { width: 6.5, height: 6.5, borderRadius: 3.25, backgroundColor: '#34C759' },
    onlineText: { fontSize: 11, color: theme.textSec, fontWeight: '600' },
    menuBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Dropdown menu
    dropdownOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
    },
    dropdownCard: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 100 : 85,
      right: 18,
      width: 170,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: theme.isDark ? '#1D1338' : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 10,
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    dropdownOptionText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    dropdownDivider: {
      height: 1,
      backgroundColor: theme.border,
    },

    // Messages log
    messagesArea: { flex: 1, position: 'relative' },
    msgList: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16, gap: 10 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    msgRowMe: { flexDirection: 'row-reverse' },
    msgAvatar: { width: 30, height: 30, borderRadius: 15, marginBottom: 2 },

    bubble: {
      maxWidth: '74%',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      overflow: 'hidden',
    },
    bubbleOther: {
      backgroundColor: theme.isDark ? '#261C44' : '#EAE7F6',
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.06)',
    },
    bubbleMe: {
      borderBottomRightRadius: 4,
    },
    bubbleTextOther: { fontSize: 14.5, color: theme.textPrimary, lineHeight: 21 },
    bubbleTextMe: { fontSize: 14.5, color: '#fff', lineHeight: 21 },
    bubbleTimeOther: {
      fontSize: 9.5,
      color: theme.textFaint,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    bubbleTimeMe: {
      fontSize: 9.5,
      color: 'rgba(255,255,255,0.75)',
      marginTop: 4,
      alignSelf: 'flex-end',
    },

    // Jump-to-bottom pill
    jumpToBottomBtn: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    jumpToBottomGrad: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Input deck
    inputContainer: {
      backgroundColor: theme.isDark ? '#160F2B' : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
    },
    inputSafeArea: {
      width: '100%',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    inputWrap: {
      flex: 1,
      backgroundColor: theme.isDark ? '#231B3D' : '#F4F2FA',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
      paddingHorizontal: 16,
      paddingVertical: 4,
      maxHeight: 110,
    },
    input: {
      color: theme.textPrimary,
      fontSize: 15,
      padding: 0,
      paddingVertical: 8,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      overflow: 'hidden',
    },
    sendGrad: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendGradDisabled: {
      opacity: 0.5,
    },

    // Modal Backdrop & Cards
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(5, 2, 12, 0.88)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    customAlertCard: {
      width: '100%',
      borderRadius: 28,
      padding: 24,
      alignItems: 'center',
      backgroundColor: theme.isDark ? '#1C1433' : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 12,
    },
    customReportCard: {
      width: '100%',
      borderRadius: 28,
      padding: 24,
      alignItems: 'center',
      backgroundColor: theme.isDark ? '#1C1433' : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 12,
    },
    alertIconCircleDanger: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255, 55, 95, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: 'rgba(255, 55, 95, 0.3)',
    },
    alertIconCircleWarning: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: 'rgba(255, 149, 0, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 149, 0, 0.3)',
    },
    alertTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.textPrimary,
      marginBottom: 6,
      textAlign: 'center',
    },
    alertSubTitle: {
      fontSize: 13,
      color: theme.textSec,
      marginBottom: 16,
      textAlign: 'center',
    },
    alertText: {
      fontSize: 15,
      color: theme.textSec,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    alertButtonsRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
      marginTop: 8,
    },
    alertCancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    alertCancelTxt: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textSec,
    },
    alertConfirmBtn: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      overflow: 'hidden',
    },
    alertConfirmBtnDanger: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      overflow: 'hidden',
    },
    alertBtnGrad: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    alertConfirmTxt: {
      fontSize: 15,
      fontWeight: '800',
      color: '#fff',
    },

    // Report Reasons List
    reportReasonsList: {
      width: '100%',
      marginBottom: 16,
      gap: 8,
    },
    reportReasonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    reportReasonSelected: {
      backgroundColor: 'rgba(255, 0, 127, 0.12)',
      borderColor: 'rgba(255, 0, 127, 0.4)',
    },
    reportReasonTxt: {
      fontSize: 13.5,
      color: theme.textSec,
      fontWeight: '500',
      flex: 1,
    },
    reportReasonTxtSelected: {
      color: theme.textPrimary,
      fontWeight: '700',
    },

    // Toast Notification
    customToastWrap: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 54 : 36,
      left: 20,
      right: 20,
      borderRadius: 24,
      backgroundColor: theme.isDark ? '#1C1433' : '#FFFFFF',
      paddingHorizontal: 18,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: 'rgba(48, 209, 88, 0.4)',
      overflow: 'hidden',
      zIndex: 999,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    customToastTxt: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textPrimary,
      flex: 1,
    },

    // Checkmarks & Typing Dots
    timeRowMe: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 3,
    },
    typingBubble: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
    },
    typingDotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    typingDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: theme.accent || '#FF007F',
    },

    // Blocked Banner Styles
    blockedBannerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    blockedBannerText: {
      fontSize: 14,
      color: theme.textSec,
      fontWeight: '600',
    },
    unblockBannerBtn: {
      backgroundColor: 'rgba(48, 209, 88, 0.15)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(48, 209, 88, 0.4)',
    },
    unblockBannerBtnText: {
      color: '#30D158',
      fontSize: 13,
      fontWeight: '800',
    },
  });