// src/api/notificationService.js
import { BASE_URL } from './config';

const withAuthHeaders = token => ({
  Authorization: `Bearer ${token}`,
});

const buildQueryString = params => {
  if (!params || typeof params !== 'object') return '';
  const esc = encodeURIComponent;
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${esc(k)}=${esc(String(v))}`)
    .join('&');
  return query ? `?${query}` : '';
};

export const getNotifications = async (token, params = {}) => {
  const qs = buildQueryString(params);
  const res = await fetch(`${BASE_URL}/notifications${qs}`, {
    method: 'GET',
    headers: {
      ...withAuthHeaders(token),
      'Content-Type': 'application/json',
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      error: json?.message || `HTTP ${res.status}`,
    };
  }
  return json;
};

export const getNotificationCount = async token => {
  const res = await fetch(`${BASE_URL}/notifications/count`, {
    method: 'GET',
    headers: {
      ...withAuthHeaders(token),
      'Content-Type': 'application/json',
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, unreadCount: 0, error: json?.message };
  }
  return json;
};

export const getUpcomingReminders = async token => {
  const res = await fetch(`${BASE_URL}/notifications/upcoming-reminders`, {
    method: 'GET',
    headers: {
      ...withAuthHeaders(token),
      'Content-Type': 'application/json',
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, reminders: [], error: json?.message };
  }
  return json;
};

export const markNotificationAsRead = async (notificationId, token) => {
  const res = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      ...withAuthHeaders(token),
      'Content-Type': 'application/json',
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: json?.message };
  }
  return json;
};

export const markAllNotificationsAsRead = async token => {
  const res = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
    method: 'PUT',
    headers: {
      ...withAuthHeaders(token),
      'Content-Type': 'application/json',
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: json?.message };
  }
  return json;
};

export const deleteNotification = async (notificationId, token) => {
  const res = await fetch(`${BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: {
      ...withAuthHeaders(token),
      'Content-Type': 'application/json',
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: json?.message };
  }
  return json;
};

export default {
  getNotifications,
  getNotificationCount,
  getUpcomingReminders,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
