// src/components/Sidebar.jsx (or .js) - This is where the change is required
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigationState } from '@react-navigation/native';

import AppLogo from '../assets/images/logo.png';

const { width, height } = Dimensions.get('window');

const sidebarItems = [
  { name: 'Services', icon: 'room-service' },
  { name: 'Marketplace', icon: 'store' },
  { name: 'Deals', icon: 'tag-multiple' },
  { name: 'Attendance', icon: 'account-check' },
  { name: 'PendingApprovals', icon: 'clock-alert' },
  { name: 'Expense', icon: 'cash-multiple' },
  { name: 'AdvanceSalary', icon: 'cash-plus' },
  { name: 'AdvanceBooking', icon: 'calendar-check' },
  { name: 'Employees', icon: 'badge-account' },
  { name: 'Clients', icon: 'account-group' },
];

const Sidebar = ({ activeTab, onSelect, navigation }) => {
  const navigationState = useNavigationState(state => state);

  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const timeoutIdRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const handleSidebarPress = useCallback(
    tabName => {
      const currentRoute = navigationState.routes[navigationState.index];

      // Check if the current route is either 'SubServices' OR 'SubMarketplace'
      const isCurrentlyOnSubScreen =
        currentRoute.name === 'SubServices' ||
        currentRoute.name === 'SubMarketplace';

      if (isCurrentlyOnSubScreen) {
        // First try to go back safely
        try {
          if (navigation && typeof navigation.goBack === 'function') {
            // Check if we can go back
            if (navigation.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
              // Wait a bit for the navigation to complete, then navigate to the new screen
              timeoutIdRef.current = setTimeout(() => {
                if (onSelectRef.current) {
                  onSelectRef.current(tabName);
                }
                timeoutIdRef.current = null;
              }, 100);
            } else {
              // If can't go back, directly navigate to the new screen
              if (onSelectRef.current) {
                onSelectRef.current(tabName);
              }
            }
          } else {
            // If navigation is not available, directly navigate to the new screen
            if (onSelectRef.current) {
              onSelectRef.current(tabName);
            }
          }
        } catch (error) {
          console.log('Navigation error:', error);
          // If there's an error, directly navigate to the new screen
          if (onSelectRef.current) {
            onSelectRef.current(tabName);
          }
        }
      } else {
        // Normal navigation for main screens
        if (onSelectRef.current) {
          onSelectRef.current(tabName);
        }
      }
    },
    [navigation, navigationState],
  );

  return (
    <View style={styles.sidebar}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        {sidebarItems.map(item => (
          <TouchableOpacity
            key={item.name}
            onPress={() => handleSidebarPress(item.name)}
            style={[styles.tab, activeTab === item.name && styles.activeTab]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={width * 0.04}
              color={activeTab === item.name ? '#fff' : '#A9A9A9'}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === item.name && styles.tabTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: width * 0.25,
    maxWidth: 250,
    backgroundColor: '#2A2D32',
    paddingVertical: height * 0.0002,
    //marginBottom: height * 0.0001,
    borderRightWidth: 1,
    borderRightColor: '#2A2D32',
  },
  logoContainer: {
    alignItems: 'center',
    //marginBottom: height * 0.0001,
  },
  logo: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: (width * 0.1) / 2,
    marginBottom: height * 0,
  },
  logoText: {
    color: '#A98C27',
    fontSize: width * 0.025,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  userInfo: {
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D32',
    marginBottom: height * 0.03,
    alignItems: 'center',
  },
  tabsContainer: {
    marginTop: -height * 0.022,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: height * 0.013,
    paddingHorizontal: width * 0.02,
    borderRadius: 2,
    marginBottom: height * 0.001,
  },
  activeTab: {
    backgroundColor: '#A98C27',
  },
  tabIcon: {
    marginRight: width * 0.02,
  },
  tabText: {
    color: '#A9A9A9',
    fontSize: width * 0.018,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Sidebar;
