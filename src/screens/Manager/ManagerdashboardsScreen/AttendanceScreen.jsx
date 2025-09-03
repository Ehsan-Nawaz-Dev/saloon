import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  ScrollView, // Added for horizontal scrolling
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../../../context/UserContext';

// Helper function to truncate username to 6 words maximum
const truncateUsername = username => {
  if (!username) return 'Guest';
  const words = username.split(' ');
  if (words.length <= 6) return username;
  return words.slice(0, 6).join(' ') + '...';
};
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../../../api/config';

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

const userProfileImagePlaceholder = require('../../../assets/images/foundation.jpeg');

// No initial static data - will fetch from backend

// 🔐 Get authentication token
const getAuthToken = async () => {
  try {
    const data = await AsyncStorage.getItem('managerAuth');
    if (data) {
      const { token } = JSON.parse(data);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

// Fetch employee attendance records from backend (excluding admin attendance)
const fetchEmployeeAttendanceRecords = async () => {
  try {
    console.log(
      '📡 [Manager Attendance] Fetching employee attendance records...',
    );

    const token = await getAuthToken();
    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      : {};

    // Use employee attendance API, not admin attendance API
    const response = await axios.get(`${BASE_URL}/attendance/all`, { headers });
    console.log('✅ [Manager Attendance] API Response:', response.data);

    if (response.status === 200 && Array.isArray(response.data)) {
      // Filter out admin attendance - only show employee/manager attendance
      const employeeAttendanceOnly = response.data.filter(record => {
        // Only include records that have employeeId (not adminId)
        return record.employeeId && record.employeeName;
      });

      console.log(
        '📊 [Manager Attendance] Filtered employee records:',
        employeeAttendanceOnly.length,
      );

      // Map backend data to frontend format with proper data validation
      const mappedAttendance = employeeAttendanceOnly.map((record, index) => {
        // Debug: Check what employeeId actually contains
        console.log(
          `🔍 [Record ${index}] Raw employeeId:`,
          record.employeeId,
          typeof record.employeeId,
        );
        console.log(`🔍 [Record ${index}] Raw record structure:`, {
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          hasEmployeeId: 'employeeId' in record,
        });

        // Handle employeeId properly - it's populated by backend with employee data
        let displayId;
        let employeeRole = 'Employee'; // Default role
        let employeeName = record.employeeName || 'Unknown';

        if (record.employeeId && typeof record.employeeId === 'object') {
          // Backend populated the employeeId with full employee data
          displayId =
            record.employeeId.employeeId || String(record.employeeId._id);

          // Debug role extraction
          console.log(
            `🔍 [Record ${index}] Raw role from populated data:`,
            record.employeeId.role,
          );

          // Fix role mapping - ensure proper capitalization
          const rawRole = record.employeeId.role?.toLowerCase() || 'employee';
          employeeRole =
            rawRole === 'manager'
              ? 'Manager'
              : rawRole === 'admin'
              ? 'Admin'
              : 'Employee';

          employeeName =
            record.employeeId.name || record.employeeName || 'Unknown';

          console.log(`✅ [Record ${index}] Populated employee data:`, {
            displayId,
            employeeName,
            rawRole,
            finalEmployeeRole: employeeRole,
            originalEmployeeId: record.employeeId.employeeId,
          });
        } else if (typeof record.employeeId === 'string') {
          displayId = record.employeeId;
          // Try to get role from record itself
          const rawRole = record.role?.toLowerCase() || 'employee';
          employeeRole =
            rawRole === 'manager'
              ? 'Manager'
              : rawRole === 'admin'
              ? 'Admin'
              : 'Employee';
          console.log(
            `✅ [Record ${index}] String employeeId:`,
            displayId,
            'Role:',
            employeeRole,
          );
        } else {
          displayId = `EMP${String(index + 1).padStart(3, '0')}`;
          console.log(`✅ [Record ${index}] Generated displayId:`, displayId);
        }

        // Ensure all values are strings or valid React children
        const mappedRecord = {
          id: String(displayId),
          name: String(employeeName),
          role: String(employeeRole),
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
          _id: String(record._id || ''),
        };

        // Validate that all fields are strings
        Object.keys(mappedRecord).forEach(key => {
          if (
            typeof mappedRecord[key] === 'object' &&
            mappedRecord[key] !== null
          ) {
            console.warn(
              `⚠️ [Data Validation] Field ${key} is an object:`,
              mappedRecord[key],
            );
            mappedRecord[key] = String(mappedRecord[key]);
          }
        });

        return mappedRecord;
      });

      console.log(
        '📊 [Manager Attendance] Mapped employee attendance count:',
        mappedAttendance.length,
      );

      // Log individual records safely
      mappedAttendance.forEach((record, idx) => {
        console.log(`📋 [Record ${idx + 1}]:`, {
          id: record.id,
          name: record.name,
          role: record.role,
          status: record.status,
          date: record.date,
        });
      });
      return mappedAttendance;
    }

    return [];
  } catch (error) {
    console.error('❌ [Manager Attendance] Failed to fetch attendance:', error);
    return [];
  }
};

const AttendanceScreen = () => {
  const navigation = useNavigation(); // Initialize navigation
  const { userName, salonName } = useUser();
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state for data fetch

  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isAbsentFilterActive, setIsAbsentFilterActive] = useState(false);

  // Function to simulate fetching attendance data (replace with actual API call)
  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 50));
      // In a real app, you'd fetch data from your backend here
      setAllAttendanceData(initialAttendanceData); // Using static data for now
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
      // Handle error (e.g., show an error message to the user)
    } finally {
      setLoading(false);
    }
  }, []);

  // Load attendance data
  const loadAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📡 [Manager Attendance] Loading attendance data...');

      const attendanceData = await fetchEmployeeAttendanceRecords();
      setAllAttendanceData(attendanceData);

      console.log('✅ [Manager Attendance] Data loaded successfully');
    } catch (error) {
      console.error('❌ [Manager Attendance] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use useFocusEffect to refetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [AttendanceScreen] Screen focused, loading data...');
      loadAttendanceData();

      // Reset filters when screen gains focus
      setSelectedFilterDate(null);
      setSearchText('');
      setIsAbsentFilterActive(false);
    }, [loadAttendanceData]),
  );

  // Function to generate the next sequential Employee ID for the main display
  const generateNextEmployeeId = useCallback(() => {
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
  }, [allAttendanceData]); // Depend on allAttendanceData to get the latest IDs

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

  // Navigate to employee face recognition for attendance
  const handleFaceScanForAttendance = () => {
    console.log(
      '🔄 [Navigation] Navigating to employee face recognition for attendance',
    );
    navigation.navigate('EmployeeAttendanceFaceRecognition');
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
            <Text style={styles.userName}>{truncateUsername(userName)}</Text>
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
          {/* Absent Filter Button */}
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

          {/* Date Filter */}
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
                : 'Date'}
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

          {/* Face Scan for Add Attendance */}
          <TouchableOpacity
            style={styles.faceScanButton}
            onPress={handleFaceScanForAttendance}
          >
            <Ionicons
              name="scan-outline"
              size={width * 0.02}
              color="#fff"
              style={styles.faceScanIcon}
            />
            <Text style={styles.faceScanButtonText}>
              Face Scan for Add Attendance
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#A98C27" />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
      ) : (
        <>
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
                ListEmptyComponent={() => (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>
                      {searchText || selectedFilterDate || isAbsentFilterActive
                        ? 'No attendance records found for the selected filters.'
                        : 'No employee attendance records yet. Use Face Scan to add attendance.'}
                    </Text>
                  </View>
                )}
              />
            </View>
          </ScrollView>
        </>
      )}

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
  faceScanButton: {
    backgroundColor: '#A98C27',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.03,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  faceScanIcon: {
    marginRight: width * 0.01,
  },
  faceScanButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: width * 0.016,
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
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.8)', // Semi-transparent dark background
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10, // Ensure it's on top
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: width * 0.02,
  },
});

export default AttendanceScreen;
