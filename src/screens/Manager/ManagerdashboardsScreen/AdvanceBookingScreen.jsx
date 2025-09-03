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
  Platform, // Import Platform for OS-specific logic.
  Alert,
  ActivityIndicator,
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
// Import the DatePicker component
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment'; // For easier date parsing and formatting
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the new modal components
import AddBookingModal from './modals/AddBookingModal';
import ViewBookingModal from './modals/ViewBookingModal';

// Import API service
import {
  getAllAdvanceBookings,
  addAdvanceBooking,
  updateAdvanceBookingStatus,
  deleteAdvanceBooking,
  getAdvanceBookingStats,
} from '../../../api/advanceBookingService';

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

// Reuse the same placeholder image for user profile
const userProfileImagePlaceholder = require('../../../assets/images/foundation.jpeg');

const AdvanceBookingScreen = () => {
  const { userName, salonName } = useUser();
  const [searchText, setSearchText] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // New state for date filtering
  const [selectedFilterDate, setSelectedFilterDate] = useState(null); // Stores the selected date object
  const [showDatePicker, setShowDatePicker] = useState(false); // Controls date picker visibility

  // States for modals
  const [isAddBookingModalVisible, setIsAddBookingModalVisible] =
    useState(false);
  const [isViewBookingModalVisible, setIsViewBookingModalVisible] =
    useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalAdvanceAmount: 0,
    upcomingBookings: 0,
  });

  // Function to get auth token from AsyncStorage
  const getAuthToken = async () => {
    try {
      const authData = await AsyncStorage.getItem('adminAuth');
      if (authData) {
        const { token } = JSON.parse(authData);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Failed to get auth token from storage:', error);
      return null;
    }
  };

  // Handler for date selection
  const onDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Hide picker only on iOS after selection

    if (date) {
      // A date was selected (not cancelled)
      setSelectedFilterDate(date);
    } else {
      // Picker was cancelled
      setSelectedFilterDate(null); // Clear selected date if cancelled
    }
  };

  // Handler to open the date picker
  const handleOpenDatePicker = () => {
    setShowDatePicker(true);
  };

  // Fetch all advance bookings from API
  const fetchAdvanceBookings = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        console.log('❌ No auth token available');
        return;
      }

      console.log('🔍 Fetching advance bookings...');
      const response = await getAllAdvanceBookings(token);

      if (response.success && response.data) {
        console.log('✅ Advance bookings fetched:', response.data);
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
  };

  // Fetch booking statistics
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

  // Load data on component mount
  useEffect(() => {
    fetchAdvanceBookings();
    fetchBookingStats();
  }, []);

  // Refresh bookings
  const refreshBookings = () => {
    fetchAdvanceBookings();
    fetchBookingStats();
  };

  // Handle adding new booking
  const handleAddBooking = async bookingData => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      console.log('🔍 Adding new booking:', bookingData);
      const response = await addAdvanceBooking(bookingData, token);

      if (response.success) {
        Alert.alert('Success', 'Advance booking added successfully!');
        setIsAddBookingModalVisible(false);
        refreshBookings(); // Refresh the list
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

  // Handle updating booking status
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
        refreshBookings(); // Refresh the list
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

  // Handle deleting booking
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
        refreshBookings(); // Refresh the list
      } else {
        Alert.alert('Error', response.message || 'Failed to delete booking');
      }
    } catch (error) {
      console.error('❌ Error deleting booking:', error);
      Alert.alert('Error', 'Failed to delete booking. Please try again.');
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = async bookingId => {
    try {
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
    } catch (error) {
      console.error('❌ Error in delete confirmation:', error);
    }
  };

  // Filter bookings based on search text AND selected date
  const filteredBookings = useMemo(() => {
    let currentData = [...bookings];

    // Apply text search filter
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

    // Apply date filter if a date is selected
    if (selectedFilterDate) {
      const formattedSelectedDate =
        moment(selectedFilterDate).format('YYYY-MM-DD');
      currentData = currentData.filter(item => {
        const itemDate = moment(item.date).format('YYYY-MM-DD');
        return itemDate === formattedSelectedDate;
      });
    }

    return currentData;
  }, [bookings, searchText, selectedFilterDate]); // Add selectedFilterDate to dependencies

  // Handlers for Add Booking Modal
  const handleOpenAddBookingModal = () => {
    setIsAddBookingModalVisible(true);
  };

  const handleCloseAddBookingModal = () => {
    setIsAddBookingModalVisible(false);
  };

  const handleSaveNewBooking = newBooking => {
    handleAddBooking(newBooking);
  };

  // Handlers for View Booking Modal
  const handleOpenViewBookingModal = item => {
    setSelectedBooking(item);
    setIsViewBookingModalVisible(true);
  };

  const handleCloseViewBookingModal = () => {
    setIsViewBookingModalVisible(false);
    setSelectedBooking(null);
  };

  const renderItem = ({ item, index }) => (
    // Make the entire row TouchableOpacity to trigger View Modal
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
      <Text style={styles.reminderCell}>
        {moment(item.reminderDate).format('MMM DD, YYYY hh:mm A')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Section (Reused from previous screens) */}
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

      {/* Controls Section */}
      <View style={styles.controls}>
        <Text style={styles.screenTitle}>Advance Booking</Text>

        <View style={styles.filterActions}>
          {/* Date Filter - Attach onPress to open date picker */}
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
            {/* Add a clear button if a date is selected */}
            {selectedFilterDate && (
              <TouchableOpacity
                onPress={() => setSelectedFilterDate(null)}
                style={{ marginLeft: 5 }}
              >
                <Ionicons name="close-circle" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Add Booking Button - MODIFIED to open modal */}
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

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.clientNameHeader}>Client Name</Text>
        <Text style={styles.dateTimeHeader}>Date & Time</Text>
        <Text style={styles.phoneNumberHeader}>Phone Number</Text>
        <Text style={styles.reminderHeader}>Reminder</Text>
      </View>

      {/* Table Rows */}
      <FlatList
        data={filteredBookings}
        renderItem={renderItem}
        keyExtractor={(item, index) => item._id || item.id || index.toString()}
        style={styles.table}
        refreshing={loading}
        onRefresh={refreshBookings}
        ListEmptyComponent={() => (
          <View style={styles.noDataContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A98C27" />
                <Text style={styles.loadingText}>
                  Loading advance bookings...
                </Text>
              </View>
            ) : (
              <Text style={styles.noDataText}>No advance bookings found.</Text>
            )}
          </View>
        )}
      />

      {/* Render the DateTimePicker conditionally */}
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedFilterDate || new Date()} // Use selected date or current date
          mode="date" // Only date mode
          display={Platform.OS === 'ios' ? 'spinner' : 'default'} // 'spinner' for iOS, 'default' for Android
          onChange={onDateChange}
        />
      )}

      {/* Render the AddBookingModal */}
      <AddBookingModal
        isVisible={isAddBookingModalVisible}
        onClose={handleCloseAddBookingModal}
        onSave={handleSaveNewBooking}
      />

      {/* Render the ViewBookingModal */}
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
  // --- Header Styles (Reused from previous screens) ---
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
  // --- End Header Styles ---

  // --- Controls Section Styles ---
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
  // --- End Controls Section Styles ---

  // --- Table Styles (Adapted for Advance Booking with Flex for Columns) ---
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: height * 0.01,
    paddingVertical: height * 0.02,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: width * 0.005,
    borderRadius: 5,
  },
  // Header cells with flex distribution (adjusted for 4 columns)
  clientNameHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  dateTimeHeader: {
    flex: 2,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  phoneNumberHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  reminderHeader: {
    flex: 2,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.013,
    textAlign: 'left',
  },

  row: {
    flexDirection: 'row',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.005,
    alignItems: 'center',
  },
  // Data cells with flex distribution matching headers
  clientNameCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  dateTimeCell: {
    flex: 2,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  phoneNumberCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  reminderCell: {
    flex: 2,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  table: {
    marginTop: height * 0.005,
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
    marginTop: 10,
  },
});

export default AdvanceBookingScreen;
