import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../../../../context/UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the new modal components
import AddAdvanceSalaryModal from './modals/AddAdvanceSalaryModal';
import ViewAdvanceSalaryModal from './modals/ViewAdvanceSalaryModal';

// Import API service
import { getAllAdminAdvanceSalary } from '../../../../api/adminAdvanceSalaryService';

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

const userProfileImagePlaceholder = require('../../../../assets/images/foundation.jpeg');

// 🔐 Check authentication status
const checkAuthStatus = async () => {
  try {
    console.log('🔑 [AdvanceSalary] Checking auth status...');
    const adminAuthData = await AsyncStorage.getItem('adminAuth');
    console.log('🔑 [AdvanceSalary] Auth data exists:', !!adminAuthData);

    if (adminAuthData) {
      const { token, admin, isAuthenticated } = JSON.parse(adminAuthData);
      console.log('🔑 [AdvanceSalary] Auth status:', {
        tokenExists: !!token,
        adminExists: !!admin,
        isAuthenticated,
        adminName: admin?.name,
      });
      return { token, admin, isAuthenticated };
    }

    console.log('❌ [AdvanceSalary] No auth data found');
    return null;
  } catch (error) {
    console.error('❌ [AdvanceSalary] Auth check failed:', error);
    return null;
  }
};

const AdvanceSalary = () => {
  const { userName, salonName } = useUser();
  const [searchText, setSearchText] = useState('');
  const [advanceSalaries, setAdvanceSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // States for modals
  const [isAddAdvanceSalaryModalVisible, setIsAddAdvanceSalaryModalVisible] =
    useState(false);
  const [isViewAdvanceSalaryModalVisible, setIsViewAdvanceSalaryModalVisible] =
    useState(false);
  const [selectedAdvanceSalary, setSelectedAdvanceSalary] = useState(null);

  // Fetch advance salary data from backend
  const fetchAdvanceSalaryData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 [Admin AdvanceSalary] Fetching data...');

      // Check authentication first
      const authStatus = await checkAuthStatus();
      console.log('🔍 [Admin AdvanceSalary] Auth status:', authStatus);

      if (!authStatus || !authStatus.token) {
        console.error('❌ [Admin AdvanceSalary] No authentication token found');
        throw new Error('No authentication token found. Please login again.');
      }

      // Check if token is a face auth token (needs conversion)
      if (authStatus.token.startsWith('face_auth_')) {
        console.log(
          '⚠️ [Admin AdvanceSalary] Face auth token detected, attempting conversion...',
        );
        try {
          // Try to convert face auth token to JWT
          const parts = authStatus.token.split('_');
          if (parts.length >= 3) {
            const adminId = parts[2];
            const admin = authStatus.admin;

            if (admin) {
              console.log(
                '🔄 [Admin AdvanceSalary] Converting face auth token to JWT...',
              );
              const tokenResponse = await fetch(`${BASE_URL}/auth/face-login`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  adminId: adminId,
                  name: admin.name,
                  faceVerified: true,
                }),
              });

              if (tokenResponse.ok) {
                const data = await tokenResponse.json();
                const jwtToken = data.data?.token || data.token;

                if (jwtToken) {
                  console.log(
                    '✅ [Admin AdvanceSalary] Successfully converted to JWT token',
                  );
                  // Update stored token
                  await AsyncStorage.setItem(
                    'adminAuth',
                    JSON.stringify({
                      token: jwtToken,
                      admin: admin,
                      isAuthenticated: true,
                    }),
                  );
                  authStatus.token = jwtToken;
                }
              }
            }
          }
        } catch (conversionError) {
          console.error(
            '❌ [Admin AdvanceSalary] Token conversion failed:',
            conversionError,
          );
          throw new Error(
            'Authentication token is invalid. Please login again.',
          );
        }
      }

      console.log('✅ [Admin AdvanceSalary] Authentication verified');
      console.log(
        '✅ [Admin AdvanceSalary] Token preview:',
        authStatus.token.substring(0, 20) + '...',
      );

      const response = await getAllAdminAdvanceSalary();

      console.log('✅ [Admin AdvanceSalary] API Response:', response);

      // Transform backend data to match frontend format
      const transformedData = response.map((item, index) => {
        console.log('🔍 [Admin AdvanceSalary] Processing item:', item);

        // Fix role detection
        let role = 'Employee';
        if (item.role) {
          role =
            item.role.charAt(0).toUpperCase() +
            item.role.slice(1).toLowerCase();
        } else if (item.employeeId && item.employeeId.startsWith('ADM')) {
          role = 'Admin';
        } else if (item.employeeId && item.employeeId.startsWith('EMP')) {
          role = 'Employee';
        }

        // Fix amount formatting
        let amount = 0;
        if (item.amount !== undefined && item.amount !== null) {
          amount = parseFloat(item.amount) || 0;
        }

        return {
          id:
            item.employeeId ||
            item._id ||
            `EMP${String(index + 1).padStart(3, '0')}`,
          name: item.employeeName || item.submittedByName || 'Unknown',
          amount: amount, // Store as number for proper formatting
          date: moment(item.createdAt).format('MMMM DD, YYYY'),
          image: item.image || null,
          role: role,
          originalData: item, // Keep original data for reference
        };
      });

      console.log(
        '📊 [Admin AdvanceSalary] Transformed data:',
        transformedData,
      );
      setAdvanceSalaries(transformedData);
    } catch (error) {
      console.error('Failed to fetch advance salary data:', error);
      // Keep existing data if fetch fails
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Check authentication on component mount
  useEffect(() => {
    const verifyAuth = async () => {
      const authStatus = await checkAuthStatus();
      if (!authStatus || !authStatus.token) {
        console.log('⚠️ [AdvanceSalary] No valid authentication found');
      } else {
        console.log('✅ [AdvanceSalary] Authentication verified');
      }
    };

    verifyAuth();
  }, []);

  // Use useFocusEffect to refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAdvanceSalaryData();
    }, [fetchAdvanceSalaryData]),
  );

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

  // Filter advance salaries based on search text AND selected date
  const filteredAdvanceSalaries = useMemo(() => {
    let currentData = [...advanceSalaries];

    // Apply text search filter
    if (searchText) {
      currentData = currentData.filter(
        item =>
          item.id.toLowerCase().includes(searchText.toLowerCase()) ||
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.amount.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Apply date filter
    if (selectedFilterDate) {
      const selectedDateString =
        moment(selectedFilterDate).format('MMMM DD, YYYY');
      currentData = currentData.filter(
        item => item.date === selectedDateString,
      );
    }

    return currentData;
  }, [advanceSalaries, searchText, selectedFilterDate]);

  // Handlers for Add Advance Salary Modal
  const handleOpenAddAdvanceSalaryModal = () => {
    setIsAddAdvanceSalaryModalVisible(true);
  };

  const handleCloseAddAdvanceSalaryModal = () => {
    setIsAddAdvanceSalaryModalVisible(false);
  };

  const handleSaveNewAdvanceSalary = newSalary => {
    // Refresh the data after adding new advance salary
    fetchAdvanceSalaryData();
  };

  // Handlers for View Advance Salary Modal
  const handleOpenViewAdvanceSalaryModal = item => {
    setSelectedAdvanceSalary(item);
    setIsViewAdvanceSalaryModalVisible(true);
  };

  const handleCloseViewAdvanceSalaryModal = () => {
    setIsViewAdvanceSalaryModalVisible(false);
    setSelectedAdvanceSalary(null);
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
      ]}
      onPress={() => handleOpenViewAdvanceSalaryModal(item)}
    >
      <Text style={styles.employeeIdCell}>{item.id}</Text>
      <Text style={styles.nameCell}>{item.name}</Text>
      <Text
        style={[
          styles.roleCell,
          {
            color:
              item.role === 'Admin'
                ? '#A98C27'
                : item.role === 'Manager'
                ? '#4CAF50'
                : '#FF9800',
          },
        ]}
      >
        {item.role}
      </Text>
      <Text style={styles.amountCell}>
        {typeof item.amount === 'number' && !isNaN(item.amount)
          ? `${item.amount.toLocaleString()} PKR`
          : '0 PKR'}
      </Text>
      <Text style={styles.dateCell}>{item.date}</Text>
    </TouchableOpacity>
  );

  if (loading && advanceSalaries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={userProfileImagePlaceholder}
              style={styles.userImage}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.salonName}>{salonName}</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A98C27" />
          <Text style={styles.loadingText}>Loading advance salary data...</Text>
        </View>
      </View>
    );
  }

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

      <View style={styles.controls}>
        <Text style={styles.screenTitle}>Advance Salary</Text>

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
            onPress={handleOpenAddAdvanceSalaryModal}
          >
            <Ionicons
              name="add-circle-outline"
              size={16}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.addText}>Add Advance Salary</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table with Horizontal Scrolling */}
      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              <Text style={styles.employeeIdHeader}>Record ID</Text>
              <Text style={styles.nameHeader}>Name</Text>
              <Text style={styles.roleHeader}>Role</Text>
              <Text style={styles.amountHeader}>Amount</Text>
              <Text style={styles.dateHeader}>Date</Text>
            </View>

            {/* Table Rows */}
            <FlatList
              data={filteredAdvanceSalaries}
              renderItem={renderItem}
              keyExtractor={(item, index) =>
                item.id + item.date + index.toString()
              }
              style={styles.table}
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAdvanceSalaryData();
              }}
              ListEmptyComponent={() => (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                    {loading
                      ? 'Loading...'
                      : 'No advance salary records found.'}
                  </Text>
                </View>
              )}
            />
          </View>
        </ScrollView>
      </View>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedFilterDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {/* Render the AddAdvanceSalaryModal */}
      <AddAdvanceSalaryModal
        isVisible={isAddAdvanceSalaryModalVisible}
        onClose={handleCloseAddAdvanceSalaryModal}
        onSave={handleSaveNewAdvanceSalary}
      />

      {/* Render the ViewAdvanceSalaryModal */}
      <ViewAdvanceSalaryModal
        isVisible={isViewAdvanceSalaryModalVisible}
        onClose={handleCloseViewAdvanceSalaryModal}
        salaryDetails={selectedAdvanceSalary}
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
    marginRight: width * 0.08, // Reduced to give more space to search bar
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

  // --- Table Styles (Adapted for Advance Salary with Fixed Column Widths) ---
  tableContainer: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableWrapper: {
    backgroundColor: '#111',
    minWidth: 800, // Minimum width for all columns
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: height * 0.02,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: width * 0.02,
    minWidth: 800,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    minWidth: 800,
  },
  employeeIdHeader: {
    width: 120,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  employeeIdCell: {
    width: 120,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  nameHeader: {
    width: 150,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  nameCell: {
    width: 150,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  roleHeader: {
    width: 100,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  roleCell: {
    width: 100,
    fontSize: width * 0.013,
    textAlign: 'left',
    fontWeight: '500',
  },
  amountHeader: {
    width: 150,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  amountCell: {
    width: 150,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  dateHeader: {
    width: 150,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  dateCell: {
    width: 150,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
    marginTop: 10,
  },
  userImage: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: (width * 0.1) / 2,
    marginRight: 10,
  },
  userDetails: {
    flex: 1,
  },
  salonName: {
    color: '#A9A9A9',
    fontSize: width * 0.018,
  },
});

export default AdvanceSalary;
