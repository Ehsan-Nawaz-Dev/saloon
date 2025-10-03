// src/screens/Admin/AdminScreens/admindashboardscreen/AdvanceSalary.jsx

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
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NotificationBell from '../../../../components/NotificationBell';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddAdvanceSalaryModal from './modals/AddAdvanceSalaryModal';
import ViewAdvanceSalaryModal from './modals/ViewAdvanceSalaryModal';
import { getAllAdminAdvanceSalary } from '../../../../api/adminAdvanceSalaryService';

const { width, height } = Dimensions.get('window');
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

// ====================================================================
// ✅ NEW HELPER FUNCTION TO GENERATE FRONTEND ID
// This function determines the ID to be displayed in the table.
// ====================================================================
const generateDisplayId = (employeeId, role, index) => {
  // 1. Prioritize a clear, short ID if available and prefixed
  if (
    employeeId &&
    (employeeId.startsWith('ADM') ||
      employeeId.startsWith('MGR') ||
      employeeId.startsWith('EMP'))
  ) {
    // If it's a short, prefixed ID (e.g., ADM1234), use it as is.
    // Assuming backend IDs are longer (like UUID or MongoDB Object ID)
    if (employeeId.length < 15) {
      return employeeId.toUpperCase();
    }
  }

  // 2. Fallback: Create a new ID using the role prefix and index
  const prefix = role.substring(0, 3).toUpperCase();
  // Use a fallback number if employeeId is long or missing
  const numberPart = String(index + 1).padStart(3, '0');

  return prefix + numberPart;
};
// ====================================================================

const AdvanceSalary = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { authenticatedAdmin } = route.params || {};
  const userName = authenticatedAdmin?.name || 'Guest';
  const userProfileImage =
    authenticatedAdmin?.profilePicture || authenticatedAdmin?.livePicture;
  const profileImageSource = getDisplayImageSource(userProfileImage);

  const [searchText, setSearchText] = useState('');
  const [advanceSalaries, setAdvanceSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isAddAdvanceSalaryModalVisible, setIsAddAdvanceSalaryModalVisible] =
    useState(false);
  const [isViewAdvanceSalaryModalVisible, setIsViewAdvanceSalaryModalVisible] =
    useState(false);
  const [selectedAdvanceSalary, setSelectedAdvanceSalary] = useState(null);

  // ✅ Define missing modal handlers
  const handleOpenAddAdvanceSalaryModal = () => {
    setIsAddAdvanceSalaryModalVisible(true);
  };

  const handleCloseAddAdvanceSalaryModal = () => {
    setIsAddAdvanceSalaryModalVisible(false);
  };

  const handleSaveNewAdvanceSalary = newSalary => {
    // Example: Add new salary to top of list (you can customize)
    // Note: The ID here is temporary until a proper ID is assigned from the backend upon creation.
    const tempId = `TEMP${Date.now()}`;

    // Attempt to infer role from employeeId if present
    let role = newSalary.role || 'Employee';
    if (newSalary.employeeId?.startsWith('ADM')) role = 'Admin';
    else if (newSalary.employeeId?.startsWith('MGR')) role = 'Manager';

    const transformedNewSalary = {
      id: generateDisplayId(newSalary.employeeId, role, advanceSalaries.length), // Use the new ID logic
      name: newSalary.employeeName || 'Unknown',
      amount: parseFloat(newSalary.amount) || 0,
      date: moment(newSalary.createdAt || new Date()).format('MMMM DD, YYYY'),
      image: newSalary.image || null,
      role: role,
      originalData: newSalary,
    };
    setAdvanceSalaries(prev => [transformedNewSalary, ...prev]);
    setIsAddAdvanceSalaryModalVisible(false);
  };

  const handleCloseViewAdvanceSalaryModal = () => {
    setIsViewAdvanceSalaryModalVisible(false);
    setSelectedAdvanceSalary(null);
  };

  const getAuthToken = useCallback(async () => {
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
      console.error('❌ [AdvanceSalary] Failed to get auth token:', error);
      return null;
    }
  }, []);

  const fetchAdvanceSalaryData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert(
          'Authentication Error',
          'No valid token found. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('AdminLogin'),
            },
          ]
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('✅ [Admin AdvanceSalary] Authentication verified');
      const response = await getAllAdminAdvanceSalary(token);
      console.log('✅ [Admin AdvanceSalary] API Response:', response);

      // ✅ Handle both { data: [...] } and direct array responses
      const salaryData = Array.isArray(response)
        ? response
        : response?.data || [];

      if (Array.isArray(salaryData)) {
        const transformedData = salaryData.map((item, index) => {
          let role = 'Employee';

          // 1. Determine the Role (using existing logic, added MGR check)
          if (item.role) {
            role =
              item.role.charAt(0).toUpperCase() +
              item.role.slice(1).toLowerCase();
          } else if (item.employeeId?.startsWith('ADM')) {
            role = 'Admin';
          } else if (item.employeeId?.startsWith('MGR')) {
            // Added MGR check
            role = 'Manager';
          } else if (item.employeeId?.startsWith('EMP')) {
            role = 'Employee';
          }

          // 2. ✅ CRITICAL CHANGE: Generate the display-friendly ID
          const displayId = generateDisplayId(item.employeeId, role, index);

          const amount = parseFloat(item.amount) || 0;
          return {
            // Use the calculated displayId for the table column
            id: displayId,
            name: item.employeeName || item.submittedByName || 'Unknown',
            amount: amount,
            date: moment(item.createdAt).format('MMMM DD, YYYY'),
            image: item.image || null,
            role: role,
            originalData: item,
          };
        });

        console.log(
          '📊 [Admin AdvanceSalary] Transformed data:',
          transformedData,
        );
        setAdvanceSalaries(transformedData);
      } else {
        console.log('⚠️ API response not in expected format:', response);
        setAdvanceSalaries([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch advance salary data:', error);
      Alert.alert(
        'Error',
        'Failed to load advance salary data. Please try again.',
      );
      setAdvanceSalaries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchAdvanceSalaryData();
  }, [fetchAdvanceSalaryData]);

  const onDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedFilterDate(date || null);
  };

  const filteredAdvanceSalaries = useMemo(() => {
    let currentData = [...advanceSalaries];
    if (searchText) {
      currentData = currentData.filter(
        item =>
          item.id.toLowerCase().includes(searchText.toLowerCase()) ||
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.amount.toString().includes(searchText),
      );
    }
    if (selectedFilterDate) {
      const selectedDateString =
        moment(selectedFilterDate).format('MMMM DD, YYYY');
      currentData = currentData.filter(
        item => item.date === selectedDateString,
      );
    }
    return currentData;
  }, [advanceSalaries, searchText, selectedFilterDate]);

  const handleOpenViewAdvanceSalaryModal = item => {
    setSelectedAdvanceSalary(item);
    setIsViewAdvanceSalaryModalVisible(true);
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
        <Text style={styles.screenTitle}>Advance Salary</Text>
        <View style={styles.filterActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowDatePicker(true)}
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

      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              <Text style={styles.employeeIdHeader}>Employee ID</Text>
              <Text style={styles.nameHeader}>Name</Text>
              <Text style={styles.roleHeader}>Role</Text>
              <Text style={styles.amountHeader}>Amount</Text>
              <Text style={styles.dateHeader}>Date</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A98C27" />
                <Text style={styles.loadingText}>
                  Loading advance salary data...
                </Text>
              </View>
            ) : (
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
                      No advance salary records found.
                    </Text>
                  </View>
                )}
              />
            )}
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

      <AddAdvanceSalaryModal
        isVisible={isAddAdvanceSalaryModalVisible}
        onClose={handleCloseAddAdvanceSalaryModal}
        onSave={handleSaveNewAdvanceSalary}
      />
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
  userInfo: { marginRight: width * 0.08 },
  greeting: { fontSize: width * 0.019, color: '#A9A9A9' },
  userName: { fontSize: width * 0.03, fontWeight: 'bold', color: '#fff' },
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
  searchIcon: { marginRight: width * 0.01 },
  searchInput: { flex: 1, color: '#fff', fontSize: width * 0.021 },
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
  screenTitle: { color: '#fff', fontSize: width * 0.029, fontWeight: '600' },
  filterActions: { flexDirection: 'row', alignItems: 'center' },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.015,
    borderRadius: 6,
    marginRight: width * 0.01,
  },
  filterText: { color: '#fff', fontSize: width * 0.019 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A98C27',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.015,
    borderRadius: 6,
  },
  addText: { color: '#fff', fontWeight: '600', fontSize: width * 0.014 },
  tableContainer: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableWrapper: { backgroundColor: '#111', minWidth: 600 },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: height * 0.02,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: width * 0.01,
    minWidth: 500,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    minWidth: 400,
  },
  employeeIdHeader: {
    width: 50,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  employeeIdCell: {
    width: 50,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  nameHeader: {
    width: 50,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  nameCell: {
    width: 50,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  roleHeader: {
    width: 50,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  roleCell: {
    width: 50,
    fontSize: width * 0.013,
    textAlign: 'left',
    fontWeight: '500',
  },
  amountHeader: {
    width: 80,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  amountCell: {
    width: 80,
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
  table: { marginTop: height * 0.005, borderRadius: 5, overflow: 'hidden' },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: { color: '#A9A9A9', fontSize: width * 0.02 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: { color: '#A9A9A9', fontSize: width * 0.02, marginTop: 10 },
});

export default AdvanceSalary;
