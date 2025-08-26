// AdminMainDashboardScreen.js
import React, { useState, useCallback } from 'react'; // Import useCallback
import { View, StyleSheet } from 'react-native';
import Sidebar from '../../../components/ManagerSidebar';

import HomeScreen from './HomeScreen';
import AdvanceBookingScreen from './AdvanceBookingScreen';
import AttendanceScreen from './AttendanceScreen';
import ClientsScreen from './ClientsScreen';
import DealsScreen from './DealsScreen';
import ExpenseScreen from './ExpenseScreen';
import Marketplace from './MarketplaceScreen';
import AdvanceSalary from './AdvanceSalary';

const ManagerHomeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Home');

  const handleTabSelect = useCallback((tabName) => {
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
        return <ServicesScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Pass the memoized handleTabSelect function as 'onSelect' */}
      <Sidebar activeTab={activeTab} onSelect={handleTabSelect} navigation={navigation} />
      <View style={styles.content}>
        {renderContent()}
      </View>
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