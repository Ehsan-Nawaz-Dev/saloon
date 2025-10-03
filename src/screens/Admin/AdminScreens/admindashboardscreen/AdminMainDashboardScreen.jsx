// AdminMainDashboardScreen.js
import React, { useState, useCallback, useEffect } from 'react'; // Import useEffect
import { View, StyleSheet, Alert, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '../../../../components/Sidebar';

import ServicesScreen from './ServicesScreen';
import AdvanceBookingScreen from './AdvanceBookingScreen';
import AttendanceScreen from './AttendanceScreen';
import ClientsScreen from './ClientsScreen';
import DealsScreen from './DealsScreen';
import EmployeesScreen from './EmployeesScreen';
import ExpenseScreen from './ExpenseScreen';
import MarketplaceScreen from './MarketplaceScreen';
import PendingApprovals from './PendingApprovalsScreen';
import AdvanceSalary from './AdvanceSalary';
import GSTConfigurationScreen from './GSTConfigurationScreen';
import NotificationsScreen from '../../../NotificationSceen';

const AdminMainDashboardScreen = ({ navigation, route }) => {
  // Add 'route' prop
  const [activeTab, setActiveTab] = useState('Services');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication check function
  const checkAuthentication = async () => {
    try {
      const adminAuthData = await AsyncStorage.getItem('adminAuth');
      if (adminAuthData) {
        const { token, isAuthenticated: authStatus } = JSON.parse(adminAuthData);
        if (token && authStatus) {
          setIsAuthenticated(true);
        } else {
          Alert.alert('Authentication Error', 'Please login again.');
          navigation.replace('AdminLogin');
        }
      } else {
        Alert.alert('Authentication Error', 'Please login again.');
        navigation.replace('AdminLogin');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      Alert.alert('Authentication Error', 'Please login again.');
      navigation.replace('AdminLogin');
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Use useEffect to handle incoming navigation parameters.
  // This will set the active tab based on the 'targetTab' param passed from the sidebar.
  useEffect(() => {
    if (route.params?.targetTab) {
      setActiveTab(route.params.targetTab);
    }
  }, [route.params?.targetTab]); // Dependency array: run this effect when 'targetTab' changes

  const handleTabSelect = useCallback(tabName => {
    setActiveTab(tabName);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'Services':
        return <ServicesScreen />;
      case 'AdvanceBooking':
        return <AdvanceBookingScreen />;
      case 'Attendance':
        return <AttendanceScreen />;
      case 'Clients':
        return <ClientsScreen />;
      case 'Deals':
        return <DealsScreen />;
      case 'Employees':
        return <EmployeesScreen />;
      case 'Expense':
        return <ExpenseScreen />;
      case 'Marketplace':
        return <MarketplaceScreen />;
      case 'PendingApprovals':
        return <PendingApprovals />;
      case 'AdvanceSalary':
        return <AdvanceSalary />;
      case 'GSTConfiguration':
        return <GSTConfigurationScreen />;
      case 'NotificationsScreen':
        return <NotificationsScreen />;
      default:
        return <ServicesScreen />;
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

export default AdminMainDashboardScreen;
