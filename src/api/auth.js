// src/api/auth.js
import { BASE_URL } from './config';

const AUTH_ENDPOINT = `${BASE_URL}/auth`;

export const register = async ({ username, password, role }) => {
  const res = await fetch(`${AUTH_ENDPOINT}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = `HTTP ${res.status}`;
    try {
      msg = JSON.parse(text).message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
};

export const login = async ({ username, password }) => {
  const res = await fetch(`${AUTH_ENDPOINT}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = `HTTP ${res.status}`;
    try {
      msg = JSON.parse(text).message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
};

export default { register, login };
