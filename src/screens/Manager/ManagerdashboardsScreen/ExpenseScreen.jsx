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
  Alert,
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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the new modal components..
import AddExpenseModal from './modals/AddExpenseModal';
import ViewExpenseModal from './modals/ViewExpenseModal';

// Import expense API service
import {
  getAllExpenses,
  addExpense,
  testBackendConnection,
} from '../../../api/expenseService';

const { width, height } = Dimensions.get('window');

// Reuse the same placeholder image
const userProfileImagePlaceholder = require('../../../assets/images/foundation.jpeg');
const dummyScreenshotImage = require('../../../assets/images/ss.jpg');

const ExpenseScreen = () => {
  const { userName, salonName, authToken } = useUser();
  const [searchText, setSearchText] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filtering states
  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // States for modals
  const [isAddExpenseModalVisible, setIsAddExpenseModalVisible] =
    useState(false);
  const [isViewExpenseModalVisible, setIsViewExpenseModalVisible] =
    useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

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
    setShowDatePicker(Platform.OS === 'ios');

    if (date) {
      setSelectedFilterDate(date);
    } else {
      setSelectedFilterDate(null);
    }
  };

  // Handler to open the date picker
  const handleOpenDatePicker = () => {
    setShowDatePicker(true);
  };

  // Fetch expenses from API (only approved expenses for manager)
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token available');
        return;
      }

      console.log(
        'Fetching expenses with token:',
        token.substring(0, 20) + '...',
      );
      const response = await getAllExpenses(token);
      console.log('API Response:', response);

      if (response.success && Array.isArray(response.data)) {
        const transformedExpenses = response.data.map(expense => ({
          id: expense._id || expense.id,
          name: expense.name || 'N/A',
          amount: expense.price ? `${expense.price} PKR` : 'N/A',
          description: expense.description || 'N/A',
          date: expense.createdAt
            ? moment(expense.createdAt).format('MMMM DD, YYYY')
            : 'N/A',
          image: expense.image ? { uri: expense.image } : dummyScreenshotImage,
        }));
        console.log('Transformed Expenses:', transformedExpenses);
        setExpenses(transformedExpenses);
      } else {
        console.log('API response not in expected format:', response);
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      Alert.alert('Error', 'Failed to load expenses. Please try again.');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  // Load expenses on component mount
  useEffect(() => {
    // Test backend connection first
    testBackendConnection().then(result => {
      console.log('Backend connection test result:', result);
      if (result.success) {
        fetchExpenses();
      } else {
        console.error('Backend connection failed:', result.error);
        Alert.alert(
          'Connection Error',
          'Cannot connect to server. Please check your internet connection.',
        );
      }
    });
  }, []);

  // Refresh expenses after adding new one
  const refreshExpenses = () => {
    fetchExpenses();
  };

  // Filter expenses based on search text AND selected date
  const filteredExpenses = useMemo(() => {
    let currentData = [...expenses];

    // Apply text search filter
    if (searchText) {
      currentData = currentData.filter(
        item =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.description.toLowerCase().includes(searchText.toLowerCase()) ||
          item.id.toLowerCase().includes(searchText.toLowerCase()) ||
          item.date.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Apply date filter if a date is selected.
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

    return currentData;
  }, [expenses, searchText, selectedFilterDate]);

  // Handlers for Add Expense Modal
  const handleOpenAddExpenseModal = () => {
    setIsAddExpenseModalVisible(true);
  };

  const handleCloseAddExpenseModal = () => {
    setIsAddExpenseModalVisible(false);
  };

  const handleSaveNewExpense = async newExpensePayload => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      console.log('Adding expense with payload:', newExpensePayload);
      const response = await addExpense(newExpensePayload, token);
      console.log('Add expense response:', response);

      if (response.success) {
        // Close modal first
        handleCloseAddExpenseModal();

        // Show success alert for manager (pending approval)
        Alert.alert('Success', 'Expense submitted for approval!', '', [
          {
            text: 'OK',
            onPress: () => {
              console.log('Expense submitted for approval successfully');
              // Expense will appear in admin panel for approval
            },
          },
        ]);
      } else {
        // Show specific error message
        const errorMessage = response.message || 'Failed to submit expense';
        console.error('Expense submission failed:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert(
        'Error',
        'Network error. Please check your connection and try again.',
      );
    }
  };

  // Handlers for View Expense Modal
  const handleOpenViewExpenseModal = item => {
    setSelectedExpense(item);
    setIsViewExpenseModalVisible(true);
  };

  const handleCloseViewExpenseModal = () => {
    setIsViewExpenseModalVisible(false);
    setSelectedExpense(null);
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
      ]}
      onPress={() => handleOpenViewExpenseModal(item)}
    >
      <Text style={styles.nameCell}>{item.name}</Text>
      <Text style={styles.amountCell}>{item.amount}</Text>
      <Text style={styles.descriptionCell}>{item.description}</Text>
      <Text style={styles.dateCell}>{item.date}</Text>
    </TouchableOpacity>
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
              onChangeText={setSearchText}
              value={searchText}
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
        <Text style={styles.screenTitle}>Expense</Text>

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
            onPress={handleOpenAddExpenseModal}
          >
            <Ionicons
              name="add-circle-outline"
              size={16}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.addText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.nameHeader}>Name</Text>
        <Text style={styles.amountHeader}>Amount</Text>
        <Text style={styles.descriptionHeader}>Description</Text>
        <Text style={styles.dateHeader}>Date</Text>
      </View>

      {/* Table Rows */}
      <FlatList
        data={filteredExpenses}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || index.toString()}
        style={styles.table}
        refreshing={loading}
        onRefresh={refreshExpenses}
        ListEmptyComponent={() => (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              {loading ? 'Loading expenses...' : 'No expenses found.'}
            </Text>
          </View>
        )}
      />

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

      {/* Render the AddExpenseModal */}
      <AddExpenseModal
        isVisible={isAddExpenseModalVisible}
        onClose={handleCloseAddExpenseModal}
        onSave={handleSaveNewExpense}
      />

      {/* Render the ViewExpenseModal */}
      <ViewExpenseModal
        isVisible={isViewExpenseModalVisible}
        onClose={handleCloseViewExpenseModal}
        expenseDetails={selectedExpense}
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
  // Header Styles
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
    borderRadius: 8,
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
  // Controls Section Styles
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
  // Table Styles
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: height * 0.01,
    paddingVertical: height * 0.02,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: width * 0.005,
    borderRadius: 5,
  },
  nameHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  amountHeader: {
    flex: 1,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  descriptionHeader: {
    flex: 2,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  dateHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: height * 0.017,
    paddingHorizontal: width * 0.005,
    alignItems: 'center',
  },
  nameCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.016,
    textAlign: 'left',
    fontWeight: '400',
  },
  amountCell: {
    flex: 1,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  descriptionCell: {
    flex: 2,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  dateCell: {
    flex: 1.5,
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
});

export default ExpenseScreen;
