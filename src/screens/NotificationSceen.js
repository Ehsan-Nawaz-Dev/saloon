// src/screens/admin/NotificationsScreen.jsx
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef, // 1. Added useRef
} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { getAdminToken, getManagerToken } from '../utils/authUtils'; // Assuming these exist

import Toast from 'react-native-toast-message'; // 2. Added Toast Import

const { width, height } = Dimensions.get('window');

const BASE_URL = 'https://sartesalon.com/api';

// ====================================================================
// API UTILITY FUNCTIONS
// ====================================================================

/**
 * Utility to get the correct token from AsyncStorage.
 * @returns {Promise<string|null>} The auth token or null.
 */
const getAuthToken = async () => {
  const adminAuth = await AsyncStorage.getItem('adminAuth');
  const managerAuth = await AsyncStorage.getItem('managerAuth');

  // Prioritize non-face-auth Admin token
  if (adminAuth) {
    const adminData = JSON.parse(adminAuth);
    if (adminData.token && !adminData.token.startsWith('face_auth_')) {
      return adminData.token;
    }
  }

  // Fallback to Manager token (any type, including face_auth)
  if (managerAuth) {
    const managerData = JSON.parse(managerAuth);
    if (managerData.token) {
      return managerData.token;
    }
  }

  // Fallback to Admin face_auth token if only that exists
  if (adminAuth) {
    const adminData = JSON.parse(adminAuth);
    if (adminData.token && adminData.token.startsWith('face_auth_')) {
      return adminData.token;
    }
  }

  return null;
};

/**
 * Handles all CRUD API calls for notifications using the backend routes.
 * @param {string} endpoint The specific API endpoint relative to /notifications (e.g., 'mark-all-read', 'id/read').
 * @param {string} method HTTP method ('PUT', 'DELETE').
 * @param {string} token The authentication token.
 * @returns {Promise<any>} The parsed JSON response data.
 */
const handleNotificationApiCall = async (endpoint, method, token) => {
  if (!token) {
    throw new Error('Authentication token is missing.');
  }

  // Endpoint construction: BASE_URL/notifications/endpoint
  const fullUrl = `${BASE_URL}/notifications/${endpoint}`;
  console.log(`📡 Calling API: ${method} ${fullUrl}`);

  const response = await fetch(fullUrl, {
    method: method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`❌ API call failed for ${endpoint}:`, errorData);
    throw new Error(
      errorData.message || `API call failed with status ${response.status}`,
    );
  }

  return response.json();
};
// ====================================================================

const NotificationsScreen = () => {
  const navigation = useNavigation();

  // 3. REF to track the latest notification ID seen.
  const latestNotificationIdRef = useRef(null);

  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [notificationsData, setNotificationsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emptyDataMessage, setEmptyDataMessage] = useState('');

  const formatDate = dateString => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today, ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (diffInDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const fetchNotifications = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setIsLoading(true); // Show loading only on initial/full load
      setError(null);
      setEmptyDataMessage('');

      try {
        let token = await getAuthToken();
        const adminAuth = await AsyncStorage.getItem('adminAuth');

        if (!token) {
          // Token acquisition logic (kept for consistency)
          if (adminAuth) {
            const adminData = JSON.parse(adminAuth);
            if (adminData.token && adminData.token.startsWith('face_auth_')) {
              token = adminData.token;
            }
          }

          if (!token) {
            Alert.alert(
              'Session Expired',
              'Please login again to access notifications.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('LoginScreen'),
                },
              ],
            );
            return;
          }
        }

        // Base GET endpoint
        let response = await fetch(`${BASE_URL}/notifications`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // Face Auth Retry Logic (Kept for consistency)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let retrySucceeded = false;

          if (
            token.startsWith('face_auth_') &&
            response.status === 401 &&
            adminAuth
          ) {
            const adminData = JSON.parse(adminAuth);
            if (adminData.admin) {
              const tokenResponse = await fetch(`${BASE_URL}/auth/face-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  adminId: adminData.admin._id,
                  name: adminData.admin.name,
                  faceVerified: true,
                  role: 'admin',
                }),
              });

              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                const newToken = tokenData.token || tokenData.data?.token;
                if (newToken) {
                  await AsyncStorage.setItem(
                    'adminAuth',
                    JSON.stringify({ ...adminData, token: newToken }),
                  );

                  // Retry API call with new token
                  response = await fetch(`${BASE_URL}/notifications`, {
                    method: 'GET',
                    headers: {
                      Authorization: `Bearer ${newToken}`,
                      'Content-Type': 'application/json',
                    },
                  });

                  if (response.ok) {
                    retrySucceeded = true;
                  }
                }
              }
            }
          }

          if (!retrySucceeded) {
            throw new Error(
              `HTTP error! Status: ${response.status}. Message: ${
                errorData.message || 'Unknown error'
              }`,
            );
          }
        }

        const data = await response.json();

        if (
          !data.success ||
          !data.data ||
          !Array.isArray(data.data.notifications)
        ) {
          throw new Error(
            'Unexpected data format from server. "notifications" array is missing.',
          );
        }

        const mappedData = data.data.notifications.map(item => ({
          id: item._id,
          title: item.title || 'No Title',
          message: item.message || 'No message',
          type: item.type || 'info',
          timestamp: formatDate(item.createdAt),
          read: item.isRead || false,
        }));

        // =========================================================
        // 4. LOGIC TO TRIGGER TOAST ON NEW UNREAD NOTIFICATION
        // =========================================================
        if (mappedData.length > 0) {
          const currentLatest = mappedData[0]; // Assuming the API returns the newest first
          const currentLatestId = currentLatest.id;

          if (latestNotificationIdRef.current === null) {
            // First load: Set the reference ID, do NOT show toast.
            latestNotificationIdRef.current = currentLatestId;
          } else if (
            // Subsequent load: Check for a new ID AND if it's unread.
            currentLatestId !== latestNotificationIdRef.current &&
            !currentLatest.read
          ) {
            // Show the global toast notification
            Toast.show({
              type:
                currentLatest.type === 'error'
                  ? 'error'
                  : currentLatest.type === 'warning'
                  ? 'warning'
                  : 'success',
              position: 'top',
              text1: currentLatest.title,
              text2: currentLatest.message,
              visibilityTime: 5000,
              onPress: () => {
                // Allows user to click the toast to navigate
                navigation.navigate('NotificationsScreen');
                Toast.hide();
              },
            });

            // Update the ref to the new latest ID
            latestNotificationIdRef.current = currentLatestId;
          }
        }
        // =========================================================

        if (mappedData.length === 0) {
          setEmptyDataMessage('No notifications available for your account.');
        }

        setNotificationsData(mappedData);
      } catch (err) {
        console.error('❌ Failed to fetch notifications:', err);
        setError(err.message);
        Alert.alert('Error', `Failed to load notifications: ${err.message}`);
      } finally {
        if (!isRefresh) setIsLoading(false);
      }
    },
    [navigation, formatDate],
  ); // Added formatDate as dependency for useCallback

  useEffect(() => {
    // Initial fetch on mount
    fetchNotifications();
  }, [fetchNotifications]);

  useFocusEffect(
    // Refetch when the screen comes into focus
    useCallback(() => {
      fetchNotifications(true); // Pass true to avoid showing the loading spinner on every focus
    }, [fetchNotifications]),
  );

  // ====================================================================
  // HANDLERS
  // ====================================================================

  const handleMarkAsRead = useCallback(async id => {
    setIsActionLoading(true);
    try {
      const token = await getAuthToken();
      await handleNotificationApiCall(`${id}/read`, 'PUT', token);

      // Update local state on success
      setNotificationsData(prevData =>
        prevData.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification,
        ),
      );
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to mark notification as read: ${error.message}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    setIsActionLoading(true);
    try {
      const token = await getAuthToken();
      await handleNotificationApiCall('mark-all-read', 'PUT', token);

      // Update local state on success
      setNotificationsData(prevData =>
        prevData.map(notification => ({ ...notification, read: true })),
      );
      Alert.alert('Success', 'All notifications marked as read.');
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to mark all notifications as read: ${error.message}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const handleDeleteNotification = useCallback(async id => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsActionLoading(true);
            try {
              const token = await getAuthToken();
              await handleNotificationApiCall(id, 'DELETE', token);

              // Update local state on success
              setNotificationsData(prevData =>
                prevData.filter(notification => notification.id !== id),
              );
              Alert.alert('Success', 'Notification deleted successfully.');
            } catch (error) {
              Alert.alert(
                'Error',
                `Failed to delete notification: ${error.message}`,
              );
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ],
    );
  }, []);

  // ====================================================================
  // RENDER LOGIC
  // ====================================================================

  const filteredNotifications = useMemo(() => {
    let currentData = [...notificationsData];

    if (searchText) {
      currentData = currentData.filter(
        notification =>
          notification.title.toLowerCase().includes(searchText.toLowerCase()) ||
          notification.message
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          notification.type.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    if (filterType === 'unread') {
      currentData = currentData.filter(notification => !notification.read);
    } else if (filterType === 'read') {
      currentData = currentData.filter(notification => notification.read);
    }

    return currentData;
  }, [notificationsData, searchText, filterType]);

  const renderNotificationItem = ({ item, index }) => {
    let typeColor = '#A98C27';
    let icon = 'information-circle-outline';

    switch (item.type) {
      case 'success':
        typeColor = '#4CAF50';
        icon = 'checkmark-circle-outline';
        break;
      case 'warning':
        typeColor = '#FFA500';
        icon = 'warning-outline';
        break;
      case 'error':
        typeColor = '#FF5555';
        icon = 'alert-circle-outline';
        break;
      case 'info':
      case 'advance_booking_reminder':
      default:
        typeColor = '#2196F3';
        icon = 'information-circle-outline';
        break;
    }

    return (
      <View
        style={[
          styles.notificationRow,
          { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
          !item.read && styles.unreadNotification,
        ]}
      >
        <View style={styles.notificationIconContainer}>
          <View
            style={[
              styles.notificationTypeIndicator,
              { backgroundColor: typeColor },
            ]}
          />
          <Ionicons name={icon} size={width * 0.02} color={typeColor} />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            {!item.read && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>New</Text>
              </View>
            )}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
        </View>

        <View style={styles.notificationActions}>
          {isActionLoading ? (
            <ActivityIndicator size="small" color="#A98C27" />
          ) : (
            <>
              {!item.read && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleMarkAsRead(item.id)}
                >
                  <Ionicons
                    name="checkmark-done-outline"
                    size={width * 0.018}
                    color="#4CAF50"
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteNotification(item.id)}
              >
                <Ionicons
                  name="trash-outline"
                  size={width * 0.018}
                  color="#ff5555"
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.contentArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.notificationsHeaderSection}>
          <Text style={styles.screenTitle}>Notifications</Text>
          <View style={styles.buttonsGroup}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterType === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setFilterType('all')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === 'all' && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterType === 'unread' && styles.filterButtonActive,
              ]}
              onPress={() => setFilterType('unread')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === 'unread' && styles.filterButtonTextActive,
                ]}
              >
                Unread
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterType === 'read' && styles.filterButtonActive,
              ]}
              onPress={() => setFilterType('read')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === 'read' && styles.filterButtonTextActive,
                ]}
              >
                Read
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name="checkmark-done-outline"
                  size={width * 0.02}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={styles.markAllButtonText}>
                {isActionLoading ? 'Processing...' : 'Mark All Read'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => fetchNotifications(true)} // Pass true for refresh mode
              disabled={isLoading || isActionLoading}
            >
              <Ionicons
                name="refresh"
                size={width * 0.02}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.notificationsContainer}>
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.noDataContainer}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#A98C27" />
                    <Text style={styles.loadingText}>
                      Loading notifications...
                    </Text>
                  </View>
                ) : error ? (
                  <Text style={styles.noDataText}>Error: {error}</Text>
                ) : emptyDataMessage ? (
                  <Text style={styles.noDataText}>{emptyDataMessage}</Text>
                ) : (
                  <Text style={styles.noDataText}>
                    No notifications found for the current filter.
                  </Text>
                )}
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingHorizontal: width * 0.02,
    paddingTop: height * 0.02,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#161719',
    borderRadius: 10,
  },
  scrollContent: {
    padding: width * 0.02,
    paddingBottom: height * 0.05,
  },
  screenTitle: {
    color: '#fff',
    fontSize: width * 0.029,
    fontWeight: '600',
    marginRight: width * 0.01,
  },
  notificationsHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
    marginTop: height * -0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    paddingBottom: height * 0.03,
  },
  buttonsGroup: {
    flexDirection: 'row',
    gap: width * 0.02,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: '#2A2D32',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.025,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  filterButtonActive: {
    backgroundColor: '#A98C27',
    borderColor: '#A98C27',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.025,
    borderRadius: 8,
  },
  markAllButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.025,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
  },
  notificationsContainer: {
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    padding: width * 0.01,
    minHeight: height * 0.4,
  },
  notificationRow: {
    flexDirection: 'row',
    padding: width * 0.02,
    marginVertical: height * 0.005,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3C3C3C',
    alignItems: 'flex-start',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#A98C27',
  },
  notificationIconContainer: {
    marginRight: width * 0.02,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: height * 0.005,
  },
  notificationTypeIndicator: {
    width: width * 0.01,
    height: height * 0.02,
    borderRadius: width * 0.005,
    marginBottom: height * 0.01,
  },
  notificationContent: {
    flex: 1,
    marginRight: width * 0.02,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.005,
  },
  notificationTitle: {
    color: '#fff',
    fontSize: width * 0.016,
    fontWeight: '600',
    flex: 1,
    flexWrap: 'wrap',
  },
  unreadBadge: {
    backgroundColor: '#A98C27',
    paddingHorizontal: width * 0.015,
    paddingVertical: height * 0.005,
    borderRadius: 12,
    marginLeft: width * 0.01,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: width * 0.012,
    fontWeight: '600',
  },
  notificationMessage: {
    color: '#ccc',
    fontSize: width * 0.014,
    marginBottom: height * 0.005,
    lineHeight: height * 0.025,
  },
  notificationTimestamp: {
    color: '#888',
    fontSize: width * 0.012,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: width * 0.015,
    marginLeft: width * 0.01,
    borderRadius: 4,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
    marginTop: 10,
  },
  noDataText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
