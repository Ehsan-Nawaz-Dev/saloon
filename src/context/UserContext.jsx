// src/context/UserContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister } from '../api/auth';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  // isAuthenticated should be false by default on app launch to force login
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  // Load initial data and any persisted auth token
  const loadUserData = useCallback(async () => {
    try {
      const storedName = await AsyncStorage.getItem('adminFullName');
      const storedEmail = await AsyncStorage.getItem('adminEmail');
      const storedToken = await AsyncStorage.getItem('authToken');

      // Set user details if they exist (for display later), but don't authenticate yet
      if (storedName && storedEmail) {
        setUserName(storedName);
        setUserEmail(storedEmail);
      }

      if (storedToken) {
        setAuthToken(storedToken);
        setIsAuthenticated(true);
      } else {
        setUserName(null);
        setUserEmail(null);
      }
    } catch (error) {
      console.error(
        'Failed to load initial user data from AsyncStorage:',
        error,
      );
    } finally {
      setIsLoading(false); // Data loading complete
    }
  }, []);

  const registerUser = useCallback(async (name, email, password) => {
    try {
      await apiRegister({ username: email, password, role: 'admin' });
      await AsyncStorage.setItem('adminFullName', name);
      await AsyncStorage.setItem('adminEmail', email);
      setUserName(name);
      setUserEmail(email);
      // Do not authenticate here; flow navigates to Login after registration
      return true;
    } catch (error) {
      console.error('Failed to register user:', error);
      throw error;
    }
  }, []);

  const loginUser = useCallback(async (email, password) => {
    try {
      const result = await apiLogin({ username: email, password });
      const token = result?.token;
      if (!token) throw new Error('Invalid login response');
      await AsyncStorage.setItem('authToken', token);
      // Keep email for display; name is already stored during registration
      const storedName = await AsyncStorage.getItem('adminFullName');
      await AsyncStorage.setItem('adminEmail', email);
      setAuthToken(token);
      setUserEmail(email);
      setUserName(storedName);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Failed to login user:', error);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('adminFullName');
      await AsyncStorage.removeItem('adminEmail');
      await AsyncStorage.removeItem('authToken');
      setUserName(null);
      setUserEmail(null);
      setAuthToken(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to remove user data from AsyncStorage:', error);
    }
  }, []);

  // This function checks if an admin has EVER been registered
  const checkInitialRegistration = useCallback(async () => {
    try {
      const storedName = await AsyncStorage.getItem('adminFullName');
      const storedEmail = await AsyncStorage.getItem('adminEmail');
      return !!(storedName && storedEmail); // Returns true if admin data exists, false otherwise
    } catch (error) {
      console.error('Error checking initial registration:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return (
    <UserContext.Provider
      value={{
        userName,
        userEmail,
        isAuthenticated,
        isLoading,
        authToken,
        registerUser,
        loginUser,
        logoutUser,
        checkInitialRegistration,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
