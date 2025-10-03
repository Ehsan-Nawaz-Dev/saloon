// src/screens/Admin/AdminScreens/admindashboardscreen/AdvanceBookingScreen.jsx

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
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NotificationBell from '../../../../components/NotificationBell';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddBookingModal from './modals/AddBookingModal';
import ViewBookingModal from './modals/ViewBookingModal';

import {
  getAllAdvanceBookings,
  addAdvanceBooking,
  updateAdvanceBookingStatus,
  deleteAdvanceBooking,
  getAdvanceBookingStats,
} from '../../../../api/advanceBookingService';

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

const userProfileImagePlaceholder = require('../../../../assets/images/logo.png');

const getDisplayImageSource = image => {
  if (
    typeof image === 'string' &&
    (image.startsWith('http://') ||
      image.startsWith('https://') ||
      image.startsWith('file://') ||
      image.startsWith('content://') ||
      image.startsWith('data:image'))
  ) {
    return { uri: image };
  }
  return userProfileImagePlaceholder;
};

// Replace the existing calculateReminderTime function with this:
const calculateReminderTime = (bookingDate, bookingTime) => {
  try {
    console.log('🔍 Calculating reminder for:', { bookingDate, bookingTime });

    // Ensure proper date format
    const dateStr = moment(bookingDate).format('YYYY-MM-DD');

    // Parse time properly - handle both 12hr and 24hr formats
    let timeStr = bookingTime;
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
      // If no AM/PM, assume it's 24hr format and convert
      const [hours, minutes] = timeStr.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      timeStr = `${hour12}:${minutes} ${ampm}`;
    }

    // Combine date and time
    const combinedStr = `${dateStr} ${timeStr}`;
    console.log('🔍 Combined string:', combinedStr);

    // Parse with multiple format attempts
    let combinedDateTime;
    const formats = [
      'YYYY-MM-DD hh:mm A',
      'YYYY-MM-DD HH:mm A',
      'YYYY-MM-DD h:mm A',
      'YYYY-MM-DD H:mm A',
    ];

    for (const format of formats) {
      combinedDateTime = moment(combinedStr, format, true);
      if (combinedDateTime.isValid()) {
        console.log('✅ Parsed with format:', format);
        break;
      }
    }

    if (!combinedDateTime.isValid()) {
      console.error('❌ Failed to parse date/time:', combinedStr);
      return null;
    }

    // Subtract exactly 24 hours
    const reminderMoment = combinedDateTime.clone().subtract(24, 'hours');

    console.log(
      '✅ Booking DateTime:',
      combinedDateTime.format('YYYY-MM-DD hh:mm A'),
    );
    console.log(
      '✅ Reminder DateTime:',
      reminderMoment.format('YYYY-MM-DD hh:mm A'),
    );

    // Return in backend-compatible format
    return reminderMoment.format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    console.error('❌ Error in calculateReminderTime:', error);
    return null;
  }
};

const AdvanceBookingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { authenticatedAdmin } = route.params || {};

  const userName = authenticatedAdmin?.name || 'Guest';
  const userProfileImage =
    authenticatedAdmin?.profilePicture || authenticatedAdmin?.livePicture;
  const profileImageSource = getDisplayImageSource(userProfileImage);

  const [searchText, setSearchText] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isAddBookingModalVisible, setIsAddBookingModalVisible] =
    useState(false);
  const [isViewBookingModalVisible, setIsViewBookingModalVisible] =
    useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalAdvanceAmount: 0,
    upcomingBookings: 0,
  });

  const getAuthToken = async () => {
    try {
      const authData = await AsyncStorage.getItem('adminAuth');
      if (authData) {
        const { token, isAuthenticated } = JSON.parse(authData);
        if (token && isAuthenticated) {
          return token;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get auth token from storage:', error);
      return null;
    }
  };

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

  const fetchAdvanceBookings = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        console.log('❌ No auth token available');
        Alert.alert('Authentication Error', 'Please login again.', [
          {
            text: 'OK',
            onPress: () => navigation.replace('AdminLogin'),
          },
        ]);
        return;
      }

      console.log('🔍 Fetching advance bookings...');
      const response = await getAllAdvanceBookings(token);

      if (response.success && Array.isArray(response.data)) {
        console.log('✅ Raw bookings from API:', response.data);

        // Log the first booking's reminderDate specifically
        if (response.data.length > 0) {
          console.log(
            'First booking reminderDate:',
            response.data[0].reminderDate,
          );
          console.log(
            'Parsed reminder moment:',
            moment(response.data[0].reminderDate, 'YYYY-MM-DD hh:mm A').format(
              'MMM DD, YYYY hh:mm A',
            ),
          );
        }

        setBookings(response.data);
      } else {
        console.log('❌ No bookings data received');
        setBookings([]);
      }
    } catch (error) {
      console.error('❌ Error fetching advance bookings:', error);
      Alert.alert(
        'Error',
        'Failed to load advance bookings. Please try again.',
      );
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookingStats = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await getAdvanceBookingStats(token);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching booking stats:', error);
    }
  };

  useEffect(() => {
    fetchAdvanceBookings();
    fetchBookingStats();
  }, [fetchAdvanceBookings]);

  const refreshBookings = () => {
    fetchAdvanceBookings();
    fetchBookingStats();
  };

  const handleAddBooking = async bookingData => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      const reminderDate = calculateReminderTime(
        bookingData.date,
        bookingData.time,
      );
      const updatedBookingData = { ...bookingData, reminderDate };

      console.log('🔍 Adding new booking:', updatedBookingData);
      const response = await addAdvanceBooking(updatedBookingData, token);

      if (response.success) {
        Alert.alert('Success', 'Advance booking added successfully!');
        setIsAddBookingModalVisible(false);
        refreshBookings();
      } else {
        Alert.alert('Error', response.message || 'Failed to add booking');
      }
    } catch (error) {
      console.error('❌ Error adding booking:', error);
      let errorMessage = 'Failed to add booking. Please try again.';

      if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      const response = await updateAdvanceBookingStatus(
        bookingId,
        newStatus,
        token,
      );

      if (response.success) {
        Alert.alert('Success', 'Booking status updated successfully!');
        refreshBookings();
      } else {
        Alert.alert('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('❌ Error updating booking status:', error);
      Alert.alert(
        'Error',
        'Failed to update booking status. Please try again.',
      );
    }
  };

  const handleDeleteBooking = async bookingId => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      const response = await deleteAdvanceBooking(bookingId, token);

      if (response.success) {
        Alert.alert('Success', 'Booking deleted successfully!');
        refreshBookings();
      } else {
        Alert.alert('Error', response.message || 'Failed to delete booking');
      }
    } catch (error) {
      console.error('❌ Error deleting booking:', error);
      Alert.alert('Error', 'Failed to delete booking. Please try again.');
    }
  };

  const handleDeleteConfirmation = bookingId => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this booking?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteBooking(bookingId),
        },
      ],
    );
  };

  const filteredBookings = useMemo(() => {
    let currentData = [...bookings];

    if (searchText) {
      currentData = currentData.filter(
        item =>
          (item.clientName || '')
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (item.phoneNumber || '')
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (item.clientId || '')
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (item.description || '')
            .toLowerCase()
            .includes(searchText.toLowerCase()),
      );
    }

    if (selectedFilterDate) {
      const formattedSelectedDate =
        moment(selectedFilterDate).format('YYYY-MM-DD');
      currentData = currentData.filter(item => {
        const itemDate = moment(item.date).format('YYYY-MM-DD');
        return itemDate === formattedSelectedDate;
      });
    }

    return currentData;
  }, [bookings, searchText, selectedFilterDate]);

  const handleOpenAddBookingModal = () => {
    setIsAddBookingModalVisible(true);
  };

  const handleCloseAddBookingModal = () => {
    setIsAddBookingModalVisible(false);
  };

  const handleSaveNewBooking = newBooking => {
    handleAddBooking(newBooking);
  };

  const handleOpenViewBookingModal = item => {
    setSelectedBooking(item);
    setIsViewBookingModalVisible(true);
  };

  const handleCloseViewBookingModal = () => {
    setIsViewBookingModalVisible(false);
    setSelectedBooking(null);
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
      ]}
      onPress={() => handleOpenViewBookingModal(item)}
    >
      <Text style={styles.clientNameCell}>{item.clientName || 'N/A'}</Text>
      <Text style={styles.dateTimeCell}>
        {moment(item.date).format('MMM DD, YYYY')} {item.time}
      </Text>
      <Text style={styles.phoneNumberCell}>{item.phoneNumber || 'N/A'}</Text>

      {/* FIXED: Proper reminder display */}
      <Text style={styles.reminderCell}>
        {(() => {
          if (!item.reminderDate) return 'N/A';

          // Try parsing as ISO string first
          let reminderMoment = moment(item.reminderDate);

          // If not valid, try parsing with custom format
          if (!reminderMoment.isValid()) {
            reminderMoment = moment(item.reminderDate, 'YYYY-MM-DD hh:mm A');
          }

          // Final fallback
          if (!reminderMoment.isValid()) {
            console.warn('❌ Invalid reminder date:', item.reminderDate);
            return 'Invalid Date';
          }

          return reminderMoment.format('MMM DD, YYYY hh:mm A');
        })()}
      </Text>

      <TouchableOpacity
        style={styles.deleteCell}
        onPress={() => handleDeleteConfirmation(item._id)}
      >
        <Ionicons name="trash-bin-outline" size={15} color="#FF4500" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search anything"
              placeholderTextColor="#A9A9A9"
              value={searchText}
              onChangeText={setSearchText}
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
          <NotificationBell containerStyle={styles.notificationButton} />
          <Image
            source={profileImageSource}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </View>
      </View>

      <View style={styles.controls}>
        <Text style={styles.screenTitle}>Advance Booking</Text>
        <View style={styles.filterActions}>
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleOpenAddBookingModal}
          >
            <Ionicons
              name="add-circle-outline"
              size={16}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.addText}>Add Booking</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- HORIZONTAL SCROLLING WRAPPER --- */}
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        style={styles.tableScrollView}
      >
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.clientNameHeader}>Client Name</Text>
            <Text style={styles.dateTimeHeader}>Date & Time</Text>
            <Text style={styles.phoneNumberHeader}>Phone Number</Text>
            <Text style={styles.reminderHeader}>Reminder</Text>
            <Text style={styles.actionHeader}>Action</Text>
          </View>

          {/* Table Rows */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#A98C27" />
              <Text style={styles.loadingText}>
                Loading advance bookings...
              </Text>
            </View>
          ) : filteredBookings.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No advance bookings found.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredBookings}
              renderItem={renderItem}
              keyExtractor={(item, index) =>
                item._id || item.id || index.toString()
              }
              style={styles.table}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
      {/* --- END HORIZONTAL SCROLLING WRAPPER --- */}

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedFilterDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      <AddBookingModal
        isVisible={isAddBookingModalVisible}
        onClose={handleCloseAddBookingModal}
        onSave={handleSaveNewBooking}
      />

      <ViewBookingModal
        isVisible={isViewBookingModalVisible}
        onClose={handleCloseViewBookingModal}
        bookingDetails={selectedBooking}
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
  screenTitle: {
    color: '#fff',
    fontSize: width * 0.029,
    fontWeight: '600',
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
  tableScrollView: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableContainer: {
    minWidth: screenWidth * 1.08, // ✅ Ensure minimum width for all columns
    backgroundColor: '#1F1F1F',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: height * 0.015,
    backgroundColor: '#2B2B2B',
    borderBottomWidth: 2,
    borderBottomColor: '#3C3C3C',
    alignItems: 'center',
  },
  // ✅ PERFECTLY ALIGNED COLUMN WIDTHS - Each column has exact positioning
  clientNameHeader: {
    width: screenWidth * 0.15, // 22% of screen width
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'center',
    paddingHorizontal: width * 0.005,
    borderRightWidth: 1,
    borderRightColor: '#3C3C3C',
  },
  dateTimeHeader: {
    width: screenWidth * 0.25, // 25% of screen width
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'center',
    paddingHorizontal: width * 0.005,
    borderRightWidth: 1,
    borderRightColor: '#3C3C3C',
  },
  phoneNumberHeader: {
    width: screenWidth * 0.2, // 22% of screen width
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'center',
    paddingHorizontal: width * 0.005,
    borderRightWidth: 1,
    borderRightColor: '#3C3C3C',
  },
  reminderHeader: {
    width: screenWidth * 0.3, // 35% of screen width - wider for reminder details
    color: '#FF9800',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'center',
    paddingHorizontal: width * 0.005,
    borderRightWidth: 1,
    borderRightColor: '#3C3C3C',
  },
  actionHeader: {
    width: screenWidth * 0.1, // 16% of screen width
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'center',
    paddingHorizontal: width * 0.005,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: height * 0.018,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  // ✅ PERFECTLY ALIGNED CELL WIDTHS - Matching header widths exactly
  clientNameCell: {
    width: screenWidth * 0.15, // Exact match with header
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'center',
    paddingHorizontal: width * 0.005,
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  dateTimeCell: {
    width: screenWidth * 0.25, // Exact match with header
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'center',
    paddingHorizontal: width * 0.005,
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  phoneNumberCell: {
    width: screenWidth * 0.2, // Exact match with header
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'center',
    paddingHorizontal: width * 0.005,
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  reminderCell: {
    width: screenWidth * 0.3, // Exact match with header
    color: '#FF9800',
    fontSize: width * 0.013,
    textAlign: 'center',
    paddingHorizontal: width * 0.002,
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  deleteCell: {
    width: screenWidth * 0.1, // Exact match with header
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.002,
  },
  table: {
    flex: 1,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.3,
  },
  noDataText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.3,
  },
  loadingText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default AdvanceBookingScreen;
