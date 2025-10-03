// ManagerHomeScreen.js
import React, { useState, useCallback, useEffect } from 'react'; // Import useCallback
import { View, StyleSheet, Alert, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '../../../components/ManagerSidebar';

import HomeScreen from './HomeScreen';
import AdvanceBookingScreen from './AdvanceBookingScreen';
import AttendanceScreen from './AttendanceScreen';
import ClientsScreen from './ClientsScreen';
import DealsScreen from './DealsScreen';
import ExpenseScreen from './ExpenseScreen';
import Marketplace from './MarketplaceScreen';
import AdvanceSalary from './AdvanceSalary';

const ManagerHomeScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication check function
  const checkAuthentication = async () => {
    try {
      const managerAuthData = await AsyncStorage.getItem('managerAuth');
      const adminAuthData = await AsyncStorage.getItem('adminAuth');
      
      if (managerAuthData) {
        const { token, isAuthenticated: authStatus } = JSON.parse(managerAuthData);
        if (token && authStatus) {
          setIsAuthenticated(true);
          return;
        }
      }
      
      if (adminAuthData) {
        const { token, isAuthenticated: authStatus } = JSON.parse(adminAuthData);
        if (token && authStatus) {
          setIsAuthenticated(true);
          return;
        }
      }
      
      Alert.alert('Authentication Error', 'Please login again.');
      navigation.replace('RoleSelection');
    } catch (error) {
      console.error('Authentication check failed:', error);
      Alert.alert('Authentication Error', 'Please login again.');
      navigation.replace('RoleSelection');
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Handle targetTab parameter from navigation
  useEffect(() => {
    if (route.params?.targetTab) {
      setActiveTab(route.params.targetTab);
      // Clear the parameter after using it
      navigation.setParams({ targetTab: undefined });
    }
  }, [route.params?.targetTab, navigation]);

  const handleTabSelect = useCallback(tabName => {
    setActiveTab(tabName);
  }, []);
  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'AdvanceBooking':
        return <AdvanceBookingScreen />;
      case 'Attendance':
        return <AttendanceScreen />;
      case 'Clients':
        return <ClientsScreen />;
      case 'Deals':
        return <DealsScreen />;
      case 'Expense':
        return <ExpenseScreen />;
      case 'Marketplaces':
        return <Marketplace />;
      case 'AdvanceSalary':
        return <AdvanceSalary />;
      default:
        return <HomeScreen />;
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  // Show authentication error if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <View style={styles.container}>
      {/* Pass the memoized handleTabSelect function as 'onSelect' */}
      <Sidebar
        activeTab={activeTab}
        onSelect={handleTabSelect}
        navigation={navigation}
      />
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#161719',
  },
  content: {
    flex: 1,
    backgroundColor: '#161719',
  },
});

export default ManagerHomeScreen;
