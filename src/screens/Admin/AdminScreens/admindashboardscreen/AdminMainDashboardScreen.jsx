// AdminMainDashboardScreen.js
import React, { useState, useCallback } from 'react'; // Import useCallback
import { View, StyleSheet } from 'react-native';
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

const AdminMainDashboardScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Services');

  // Use useCallback to memoize the handleTabSelect function.
  // This ensures that the 'onSelect' prop passed to Sidebar remains stable
  // across re-renders, preventing potential issues with closures in setTimeout.
  const handleTabSelect = useCallback((tabName) => {
    setActiveTab(tabName);
  }, []); // Empty dependency array means this function is created once

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
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
});

export default AdminMainDashboardScreen;