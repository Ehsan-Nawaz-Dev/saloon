import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken, getUserType } from '../utils/authUtils';
import Toast from 'react-native-toast-message';
import { BASE_URL } from '../api/config';
import {
  getNotifications,
  getNotificationCount,
  getUpcomingReminders,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../api/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const latestNotificationIdRef = useRef(null);

  // Generic helper: run an API call, and if backend reports a 401/invalid-face-token,
  // attempt token conversion and retry once.
  const callWithRetry = useCallback(
    async action => {
      const token = await getValidToken();
      console.log(
        '[NotificationContext] callWithRetry: Using token:',
        token && token.substring(0, 20),
      );
      let response = await action(token);
      const errorText = String(response?.error || '');
      const needsRetry =
        response &&
        response.success === false &&
        (/401/.test(errorText) ||
          /unauthorized/i.test(errorText) ||
          /invalid\s*face\s*authentication\s*token/i.test(errorText));
      if (needsRetry) {
        console.log(
          '[NotificationContext] callWithRetry: 401/invalid face token detected, retrying token exchange...',
        );
        // Try again after attempting conversion (getValidToken runs conversion for face token)
        const refreshed = await getValidToken();
        console.log(
          '[NotificationContext] callWithRetry: Retrying with token:',
          refreshed && refreshed.substring(0, 20),
        );
        response = await action(refreshed);
      }
      return response;
    },
    [getValidToken],
  );

  // Ensure we have a valid JWT; if admin face token is present, convert it
  const getValidToken = useCallback(async () => {
    let token = await getAuthToken();
    console.log(
      '[NotificationContext] getValidToken: Initial token:',
      token && token.substring(0, 20),
    );
    try {
      if (token && token.startsWith('face_auth_')) {
        const adminAuthRaw = await AsyncStorage.getItem('adminAuth');
        console.log(
          '[NotificationContext] getValidToken: Found face_auth_ token, adminAuthRaw:',
          adminAuthRaw,
        );
        if (adminAuthRaw) {
          const adminAuth = JSON.parse(adminAuthRaw);
          const admin = adminAuth?.admin;
          console.log(
            '[NotificationContext] getValidToken: Parsed admin:',
            admin,
          );
          if (admin?._id || admin?.id) {
            const adminId = admin._id || admin.id;
            console.log(
              '[NotificationContext] getValidToken: Exchanging face token for JWT for adminId:',
              adminId,
            );
            const res = await fetch(`${BASE_URL}/auth/face-login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                adminId: adminId,
                name: admin.name,
                faceVerified: true,
                role: 'admin',
              }),
            });
            console.log(
              '[NotificationContext] getValidToken: /auth/face-login response status:',
              res.status,
            );
            if (res.ok) {
              const data = await res.json();
              const jwt = data.token || data.data?.token;
              console.log(
                '[NotificationContext] getValidToken: Received JWT:',
                jwt && jwt.substring(0, 20),
              );
              if (jwt) {
                await AsyncStorage.setItem(
                  'adminAuth',
                  JSON.stringify({ ...adminAuth, token: jwt }),
                );
                token = jwt;
              }
            } else {
              const errText = await res.text();
              console.log(
                '[NotificationContext] getValidToken: /auth/face-login failed:',
                errText,
              );
            }
          } else {
            console.log(
              '[NotificationContext] getValidToken: No admin _id or id found in adminAuth',
            );
          }
        } else {
          console.log(
            '[NotificationContext] getValidToken: No adminAuthRaw found in AsyncStorage',
          );
        }
      }
    } catch (e) {
      console.error('❌ Token conversion failed:', e);
    }
    console.log(
      '[NotificationContext] getValidToken: Returning token:',
      token && token.substring(0, 20),
    );
    return token;
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (page = 1, limit = 20, filters = {}) => {
      try {
        setIsLoading(true);
        const params = { page, limit, ...filters };
        const response = await callWithRetry(t => getNotifications(t, params));

        if (response.success) {
          if (page === 1) {
            setNotifications(response.data.notifications);
          } else {
            setNotifications(prev => [...prev, ...response.data.notifications]);
          }
          setUnreadCount(response.data.pagination.unreadCount);

          // In-app toast for newly arrived unread notification (top banner for 5s)
          if (page === 1 && response.data.notifications.length > 0) {
            const newest = response.data.notifications[0];
            const newestId = newest._id;
            if (latestNotificationIdRef.current === null) {
              latestNotificationIdRef.current = newestId;
            } else if (
              newestId !== latestNotificationIdRef.current &&
              !newest.isRead
            ) {
              Toast.show({
                type:
                  newest.type === 'error'
                    ? 'error'
                    : newest.type === 'warning'
                    ? 'warning'
                    : 'success',
                position: 'top',
                text1: newest.title || 'New notification',
                text2: newest.message || '',
                visibilityTime: 6000,
                onPress: () => {
                  // Consumers can navigate on press
                  Toast.hide();
                },
              });
              latestNotificationIdRef.current = newestId;
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  // Fetch notification count
  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await callWithRetry(t => getNotificationCount(t));
      if (response.success) {
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('❌ Error fetching notification count:', error);
    }
  }, []);

  // Fetch upcoming reminders
  const fetchUpcomingReminders = useCallback(async () => {
    try {
      const response = await callWithRetry(t => getUpcomingReminders(t));
      if (response.success) {
        setUpcomingReminders(response.reminders);
      }
    } catch (error) {
      console.error('❌ Error fetching upcoming reminders:', error);
    }
  }, [callWithRetry]);

  // Mark notification as read
  const markAsRead = useCallback(
    async notificationId => {
      try {
        const response = await callWithRetry(t =>
          markNotificationAsRead(notificationId, t),
        );
        if (response.success) {
          // Update local state
          setNotifications(prev =>
            prev.map(notification =>
              notification._id === notificationId
                ? { ...notification, isRead: true }
                : notification,
            ),
          );

          // Update unread count
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('❌ Error marking notification as read:', error);
      }
    },
    [callWithRetry],
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await callWithRetry(t => markAllNotificationsAsRead(t));
      if (response.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, isRead: true })),
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  }, [callWithRetry]);

  // Delete notification
  const deleteNotificationById = useCallback(
    async notificationId => {
      try {
        const response = await callWithRetry(t =>
          deleteNotification(notificationId, t),
        );
        if (response.success) {
          // Update local state
          const deletedNotification = notifications.find(
            n => n._id === notificationId,
          );
          setNotifications(prev =>
            prev.filter(notification => notification._id !== notificationId),
          );

          // Update unread count if notification was unread
          if (deletedNotification && !deletedNotification.isRead) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      } catch (error) {
        console.error('❌ Error deleting notification:', error);
      }
    },
    [notifications],
  );

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchNotifications(1),
      fetchNotificationCount(),
      fetchUpcomingReminders(),
    ]);
  }, [fetchNotifications, fetchNotificationCount, fetchUpcomingReminders]);

  // Load more notifications
  const loadMoreNotifications = useCallback(async () => {
    if (isLoading) return;

    const currentPage = Math.ceil(notifications.length / 20) + 1;
    await fetchNotifications(currentPage);
  }, [fetchNotifications, notifications.length, isLoading]);

  // Initialize notifications on app start
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const userType = await getUserType();
        if (userType) {
          await refreshNotifications();
        }
      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [refreshNotifications]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotificationCount();
      fetchUpcomingReminders();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchNotificationCount, fetchUpcomingReminders]);

  const value = {
    // State
    notifications,
    unreadCount,
    upcomingReminders,
    isLoading,
    isRefreshing,

    // Actions
    fetchNotifications,
    fetchNotificationCount,
    fetchUpcomingReminders,
    markAsRead,
    markAllAsRead,
    deleteNotificationById,
    refreshNotifications,
    loadMoreNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider',
    );
  }
  return context;
};
