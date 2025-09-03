// src/screens/Admin/AdminScreens/admindashboardscreen/AttendanceScreen.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ScrollView, // Added for horizontal scrolling
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../../../../context/UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../../../../api/config';
import { useFocusEffect } from '@react-navigation/native';

import AddAttendanceModal from './modals/AddAttendanceModal'; // Adjust path as needed

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

const userProfileImagePlaceholder = require('../../../../assets/images/foundation.jpeg');

// No initial data - start with empty attendance records

// 🔐 Check authentication status
const checkAuthStatus = async () => {
  try {
    const adminAuthData = await AsyncStorage.getItem('adminAuth');
    console.log(
      '🔑 [AttendanceScreen] Auth data check:',
      adminAuthData ? 'Found' : 'Not found',
    );

    if (adminAuthData) {
      const { token, admin, isAuthenticated } = JSON.parse(adminAuthData);
      console.log('🔑 [AttendanceScreen] Auth status:', {
        tokenExists: !!token,
        adminExists: !!admin,
        isAuthenticated,
        adminName: admin?.name,
      });
      return { token, admin, isAuthenticated };
    }
    return null;
  } catch (error) {
    console.error('❌ [AttendanceScreen] Auth check failed:', error);
    return null;
  }
};

const AttendanceScreen = () => {
  const { userName, salonName } = useUser();
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isAbsentFilterActive, setIsAbsentFilterActive] = useState(false);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Fetch admin attendance records from API
  const fetchAttendanceRecords = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoadingAttendance(true);
      console.log('📡 [AttendanceScreen] Fetching admin attendance records...');

      const authStatus = await checkAuthStatus();
      if (!authStatus || !authStatus.token) {
        console.log(
          '❌ [AttendanceScreen] No authentication found for API call',
        );
        return;
      }

      // Use admin-specific attendance API
      const response = await axios.get(`${BASE_URL}/admin/attendance/all`, {
        headers: {
          Authorization: `Bearer ${authStatus.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ [Admin AttendanceScreen] API Response:', response.data);
      console.log('🔍 [Debug] Response data type:', typeof response.data);
      console.log('🔍 [Debug] Response data length:', response.data?.length);
      if (response.data && response.data.length > 0) {
        console.log(
          '🔍 [Debug] First record keys:',
          Object.keys(response.data[0]),
        );
      }

      if (response.status === 200 && Array.isArray(response.data)) {
        // Filter to ensure only admin attendance records (not employee attendance)
        const adminAttendanceOnly = response.data.filter(record => {
          // Only include records that have adminId/adminName (not employeeId)
          return record.adminId && record.adminName;
        });

        console.log(
          '📊 [Admin AttendanceScreen] Filtered admin records:',
          adminAttendanceOnly.length,
        );

        // Map backend data to frontend format
        const mappedAttendance = adminAttendanceOnly.map((record, index) => {
          // Extract role from admin data
          let adminRole = 'Admin'; // Default role for admin attendance

          // If admin data is populated, try to get actual role
          if (record.adminId && typeof record.adminId === 'object') {
            adminRole =
              record.adminId.role === 'manager'
                ? 'Manager'
                : record.adminId.role === 'admin'
                ? 'Admin'
                : 'Employee';
          }

          return {
            id:
              record.adminCustomId ||
              record.adminId ||
              `ADM${String(index + 1).padStart(3, '0')}`,
            name: record.adminName,
            role: adminRole, // Add role field
            status:
              record.checkInTime && record.checkOutTime
                ? 'Present'
                : record.checkInTime
                ? 'Checked In'
                : 'Absent',
            checkIn: record.checkInTime
              ? moment(record.checkInTime).format('hh:mm A')
              : 'N/A',
            checkOut: record.checkOutTime
              ? moment(record.checkOutTime).format('hh:mm A')
              : 'N/A',
            date: moment(record.date).format('MMMM DD, YYYY'),
            _id: record._id,
          };
        });

        console.log(
          '📊 [Admin AttendanceScreen] Mapped admin attendance:',
          mappedAttendance,
        );
        setAllAttendanceData(mappedAttendance);
      } else {
        console.log(
          '⚠️ [Admin AttendanceScreen] No admin attendance data received',
        );
        setAllAttendanceData([]);
      }
    } catch (error) {
      console.error('❌ [AttendanceScreen] Failed to fetch attendance:', error);
      setAllAttendanceData([]);
    } finally {
      setIsLoadingAttendance(false);
      setIsRefreshing(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAttendanceRecords(false);
  };

  // Check authentication status and load attendance data on component mount
  useEffect(() => {
    const initializeScreen = async () => {
      const authStatus = await checkAuthStatus();
      if (!authStatus || !authStatus.token) {
        console.log('⚠️ [AttendanceScreen] No valid authentication found');
        setIsLoadingAttendance(false);
      } else {
        console.log('✅ [AttendanceScreen] Authentication verified');
        await fetchAttendanceRecords();
      }
    };

    initializeScreen();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from face recognition)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [AttendanceScreen] Screen focused, refreshing data...');
      fetchAttendanceRecords(false); // Don't show loading spinner for focus refresh
    }, []),
  );

  // Function to generate the next sequential Employee ID for the main display
  const generateNextEmployeeId = () => {
    let maxIdNumber = 0;
    allAttendanceData.forEach(record => {
      const match = record.id.match(/^EMP(\d+)$/); // Extracts the number part
      if (match && match[1]) {
        const idNumber = parseInt(match[1], 10);
        if (!isNaN(idNumber) && idNumber > maxIdNumber) {
          maxIdNumber = idNumber;
        }
      }
    });

    const nextIdNumber = maxIdNumber + 1;
    const nextFormattedId = `EMP${String(nextIdNumber).padStart(3, '0')}`;
    return nextFormattedId;
  };

  const filteredAttendanceData = useMemo(() => {
    let currentData = [...allAttendanceData];

    if (isAbsentFilterActive) {
      currentData = currentData.filter(
        item => item.status.toLowerCase() === 'absent',
      );
    }

    if (selectedFilterDate) {
      const formattedSelectedDate =
        moment(selectedFilterDate).format('MMM DD, YYYY');
      currentData = currentData.filter(item => {
        const itemDate = moment(item.date, 'MMMM DD, YYYY').format(
          'MMM DD, YYYY',
        );
        return itemDate === formattedSelectedDate;
      });
    }

    if (searchText) {
      currentData = currentData.filter(
        item =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.id.toLowerCase().includes(searchText.toLowerCase()) ||
          item.status.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    return currentData;
  }, [allAttendanceData, selectedFilterDate, searchText, isAbsentFilterActive]);

  const onDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');

    if (date) {
      setSelectedFilterDate(date);
    } else {
      setSelectedFilterDate(null);
    }
  };

  const handleOpenDatePicker = () => {
    setShowDatePicker(true);
  };

  const handleToggleAbsentFilter = () => {
    setIsAbsentFilterActive(prevState => !prevState);
  };

  const handleClearAllFilters = () => {
    setSelectedFilterDate(null);
    setSearchText('');
    setIsAbsentFilterActive(false);
  };

  const handleOpenAddModal = () => {
    setIsAddModalVisible(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalVisible(false);
  };

  const handleSaveNewAttendance = async newEntryData => {
    console.log(
      '✅ [AttendanceScreen] Attendance saved successfully:',
      newEntryData,
    );

    // Refresh attendance data from backend to show the new record
    await fetchAttendanceRecords();

    // Clear filters to show the new record
    setSelectedFilterDate(null);
    setSearchText('');
    setIsAbsentFilterActive(false);
  };

  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.row,
        { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
      ]}
    >
      <Text style={styles.cell}>{String(item.id || '')}</Text>
      <Text style={styles.cell}>{String(item.name || '')}</Text>
      <Text style={[styles.cell, { color: '#A98C27' }]}>
        {String(item.role || '')}
      </Text>
      <Text
        style={[
          styles.cell,
          { color: item.status === 'Present' ? 'green' : '#ff5555' },
        ]}
      >
        {String(item.status || '')}
      </Text>
      <Text style={styles.cell}>{String(item.checkIn || '')}</Text>
      <Text style={styles.cell}>{String(item.checkOut || '')}</Text>
      <Text style={styles.cell}>{String(item.date || '')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.userName}>{userName || 'Guest'}</Text>
          </View>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search anything"
              placeholderTextColor="#A9A9A9"
            />
            <Ionicons
              name="search"
              size={width * 0.027}
              color="#A9A9A9"
              style={styles.searchIcon}
            />
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={width * 0.041}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialCommunityIcons
              name="alarm"
              size={width * 0.041}
              color="#fff"
            />
          </TouchableOpacity>
          <Image
            source={userProfileImagePlaceholder}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={styles.attendanceTitle}>Attendance</Text>

        <View style={styles.filterActions}>
          {/* Absent Filter Button (NEW) */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              isAbsentFilterActive && styles.activeFilterButton,
            ]}
            onPress={handleToggleAbsentFilter}
          >
            <Ionicons
              name={isAbsentFilterActive ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.filterText}>Absent</Text>
          </TouchableOpacity>

          {/* Date Filter (Fixed to use DateTimePicker) */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleOpenDatePicker}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.filterText}>
              {selectedFilterDate
                ? moment(selectedFilterDate).format('MMM DD, YYYY')
                : 'Select Date'}
            </Text>
            {selectedFilterDate && (
              <TouchableOpacity
                onPress={() => setSelectedFilterDate(null)}
                style={{ marginLeft: 5 }}
              >
                <Ionicons name="close-circle" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Add Attendance button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleOpenAddModal}
          >
            <Ionicons
              name="add-circle-outline"
              size={16}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.addText}>Add Attendance</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal Scrollable Table */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.tableContainer}
      >
        <View style={styles.tableWrapper}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>Employee ID</Text>
            <Text style={styles.headerCell}>Name</Text>
            <Text style={styles.headerCell}>Role</Text>
            <Text style={styles.headerCell}>Status</Text>
            <Text style={styles.headerCell}>Check In</Text>
            <Text style={styles.headerCell}>Check Out</Text>
            <Text style={styles.headerCell}>Date</Text>
          </View>

          {/* Table Rows */}
          <FlatList
            data={filteredAttendanceData}
            renderItem={renderItem}
            keyExtractor={(item, index) =>
              item.id + item.date + index.toString()
            }
            style={styles.table}
            scrollEnabled={false} // Disable vertical scroll in FlatList since we have horizontal scroll
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={() => (
              <View style={styles.noDataContainer}>
                {isLoadingAttendance ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>
                      Loading attendance records...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noDataText}>
                    {searchText || selectedFilterDate || isAbsentFilterActive
                      ? 'No attendance records found for the selected filters.'
                      : 'No admin attendance records yet. Click "Add" to record attendance.'}
                  </Text>
                )}
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* Render the DateTimePicker conditionally */}
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedFilterDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {/* Render the AddAttendanceModal component */}
      <AddAttendanceModal
        isVisible={isAddModalVisible}
        onClose={handleCloseAddModal}
        onSave={handleSaveNewAttendance}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    marginBottom: height * 0.02,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginHorizontal: width * 0.0001,
  },
  userInfo: {
    marginRight: width * 0.16,
  },
  greeting: {
    fontSize: width * 0.019,
    color: '#A9A9A9',
  },
  userName: {
    fontSize: width * 0.03,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    borderRadius: 10,
    paddingHorizontal: width * 0.002,
    flex: 1,
    height: height * 0.04,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  searchIcon: {
    marginRight: width * 0.01,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: width * 0.021,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: width * 0.01,
  },
  notificationButton: {
    backgroundColor: '#2A2D32',
    borderRadius: 9,
    padding: width * 0.000001,
    marginRight: width * 0.015,
    height: width * 0.058,
    width: width * 0.058,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: width * 0.058,
    height: width * 0.058,
    borderRadius: (width * 0.058) / 2,
  },
  attendanceTitle: {
    color: '#fff',
    fontSize: width * 0.029,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
    marginTop: height * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    paddingBottom: height * 0.03,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.015,
    borderRadius: 6,
    marginRight: width * 0.01,
  },
  filterText: {
    color: '#fff',
    fontSize: width * 0.019,
  },
  activeFilterButton: {
    backgroundColor: '#A98C27',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A98C27',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.015,
    borderRadius: 6,
  },
  addText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
  },
  tableContainer: {
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: height * 0.02,
  },
  tableWrapper: {
    minWidth: width * 1.4, // Ensure enough width for all columns
    flexDirection: 'column',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: height * 0.01,
    paddingVertical: height * 0.01,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: width * 0.005,
    borderRadius: 5,
    paddingLeft: width * 0.01,
  },
  headerCell: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    width: width * 0.2, // Fixed width for horizontal scrolling
    textAlign: 'center',
    paddingHorizontal: width * 0.005,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.005,
    alignItems: 'center',
    paddingLeft: width * 0.01,
  },
  cell: {
    color: '#fff',
    fontSize: width * 0.013,
    width: width * 0.2, // Fixed width for horizontal scrolling
    textAlign: 'center',
    paddingHorizontal: width * 0.005,
    paddingVertical: height * 0.01,
  },
  table: {
    marginTop: height * 0.009,
    borderRadius: 5,
    overflow: 'hidden',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#A9A9A9',
    fontSize: width * 0.018,
    marginTop: 10,
  },
});

export default AttendanceScreen;
