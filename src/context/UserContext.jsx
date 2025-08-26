// src/context/UserContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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
      console.log('UserContext: Loading initial user data...');
      const storedName = await AsyncStorage.getItem('adminFullName');
      const storedEmail = await AsyncStorage.getItem('adminEmail');
      const storedToken = await AsyncStorage.getItem('authToken');

      console.log(
        'UserContext: Stored data - Name:',
        storedName,
        'Email:',
        storedEmail,
        'Token:',
        storedToken ? 'exists' : 'none',
      );

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
      console.log(
        'UserContext: Initial data loading complete, setting isLoading to false',
      );
      setIsLoading(false); // Data loading complete
    }
  }, []);

  const registerUser = useCallback(
    async (name, email, password, phoneNumber = '') => {
      try {
        console.log('UserContext: Saving registration data to AsyncStorage...');
        // Only save to AsyncStorage, don't make API call (already done in screen)
        await AsyncStorage.setItem('adminFullName', name);
        await AsyncStorage.setItem('adminEmail', email);
        setUserName(name);
        setUserEmail(email);
        console.log('UserContext: User data saved successfully');
        // Do not authenticate here; flow navigates to Login after registration
        return true;
      } catch (error) {
        console.error('Failed to save user data:', error);
        throw error;
      }
    },
    [],
  );

  const loginUser = useCallback(async (email, password) => {
    try {
      console.log('UserContext: Saving login data to AsyncStorage...');
      // Only save to AsyncStorage, don't make API call (already done in screen)
      // The token should be passed from the screen after successful API call
      const storedName = await AsyncStorage.getItem('adminFullName');
      const storedToken = await AsyncStorage.getItem('authToken');
      await AsyncStorage.setItem('adminEmail', email);
      setUserEmail(email);
      setUserName(storedName);
      setAuthToken(storedToken);
      setIsAuthenticated(true);
      console.log('UserContext: Login data saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save login data:', error);
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
      console.log(
        'UserContext: Checking registration - Name:',
        storedName,
        'Email:',
        storedEmail,
      );
      const isRegistered = !!(storedName && storedEmail);
      console.log('UserContext: Is registered:', isRegistered);
      return isRegistered; // Returns true if admin data exists, false otherwise
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
