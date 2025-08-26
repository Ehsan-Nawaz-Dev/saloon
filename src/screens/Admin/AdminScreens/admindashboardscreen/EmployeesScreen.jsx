// src/screens/admin/EmployeesScreen.jsx
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../../../../context/UserContext';
import moment from 'moment';
// AsyncStorage ab import nahi kiya gaya hai

import AddEmployeeModal from './modals/AddEmployeeModal';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const userProfileImagePlaceholder = require('../../../../assets/images/foundation.jpeg');

// Initial dummy data with 'Employee' type.
const initialEmployeesData = [
  {
    id: 'EMP001',
    name: 'Ali Ahmed',
    phoneNumber: '03XX-XXXXXXX',
    idCardNumber: '35202-XXXXXXX-X',
    salary: '75,000',
    joiningDate: 'June 18, 2025',
    faceImage: null,
    type: 'Employee', // Default type set
  },
  {
    id: 'EMP002',
    name: 'Zainab Malik',
    phoneNumber: '03XX-XXXXXXX',
    idCardNumber: '35202-XXXXXXX-X',
    salary: '62,000',
    joiningDate: 'June 18, 2025',
    faceImage: null,
    type: 'Employee', // Default type set
  },
  {
    id: 'EMP003',
    name: 'Ayesha Malik',
    phoneNumber: '03XX-XXXXXXX',
    idCardNumber: '35202-XXXXXXX-X',
    salary: '82,000',
    joiningDate: 'June 10, 2024',
    faceImage: null,
    type: 'Head-girl', // Default type set
  },
];

const EmployeesScreen = () => {
  const { userName, salonName } = useUser();
  const navigation = useNavigation();
  const route = useRoute();
  const [searchText, setSearchText] = useState('');
  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [employeesData, setEmployeesData] = useState(initialEmployeesData); // Data ko state mein rakha gaya hai
  const [isAddEmployeeModalVisible, setIsAddEmployeeModalVisible] =
    useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const filteredEmployees = useMemo(() => {
    let currentData = [...employeesData];

    if (searchText) {
      currentData = currentData.filter(
        employee =>
          employee.name.toLowerCase().includes(searchText.toLowerCase()) ||
          employee.id.toLowerCase().includes(searchText.toLowerCase()) ||
          employee.phoneNumber
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          employee.idCardNumber
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          employee.salary.toLowerCase().includes(searchText.toLowerCase()) ||
          employee.type.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    if (selectedFilterDate) {
      const formattedSelectedDate =
        moment(selectedFilterDate).format('MMMM DD, YYYY');
      currentData = currentData.filter(employee => {
        const employeeJoiningDateFormatted = moment(
          employee.joiningDate,
          'MMMM DD, YYYY',
        ).format('MMMM DD, YYYY');
        return employeeJoiningDateFormatted === formattedSelectedDate;
      });
    }
    return currentData;
  }, [employeesData, searchText, selectedFilterDate]);

  // Fetch employees from API when screen loads
  useEffect(() => {
    fetchEmployeesFromAPI();
  }, []);

  // Handle new employee data from FaceRecognitionScreen
  useEffect(() => {
    if (route.params?.newEmployee) {
      const newEmployee = route.params.newEmployee;

      // Check if employee was successfully registered with API
      if (newEmployee.apiResponse) {
        // Handle different possible API response structures
        const apiResponse = newEmployee.apiResponse;
        const apiEmployee =
          apiResponse.employee || apiResponse.data || apiResponse;

        const employeeToAdd = {
          id: apiEmployee.employeeId || apiEmployee._id || newEmployee.id,
          name: apiEmployee.name,
          phoneNumber: apiEmployee.phoneNumber,
          idCardNumber: apiEmployee.idCardNumber,
          salary: apiEmployee.monthlySalary || apiEmployee.salary, // Fix: Use monthlySalary from API
          joiningDate: moment().format('MMMM DD, YYYY'),
          faceImage: apiEmployee.livePicture || newEmployee.faceImage,
          type:
            apiEmployee.role === 'manager'
              ? 'Manager'
              : apiEmployee.role === 'admin'
              ? 'Admin'
              : 'Employee',
          faceRecognized: true,
        };

        console.log('Adding new employee from API:', employeeToAdd);
        setEmployeesData(prevData => [...prevData, employeeToAdd]);
      } else {
        // Fallback to original data if API response is not available
        console.log('Adding new employee from local data:', newEmployee);
        setEmployeesData(prevData => [...prevData, newEmployee]);
      }

      // Clear the route params to prevent duplicate additions
      navigation.setParams({ newEmployee: undefined });
    }
  }, [route.params?.newEmployee, navigation]);

  // Use focus effect to refresh data when coming back from face recognition
  useFocusEffect(
    useCallback(() => {
      // Refresh employee data when screen comes into focus
      fetchEmployeesFromAPI();
    }, []),
  );

  // Function to fetch employees from API
  const fetchEmployeesFromAPI = async () => {
    try {
      setIsLoadingEmployees(true);
      console.log('Fetching employees from API...');

      const response = await axios.get(
        'http://192.168.18.16:5000/api/employees/all',
      );

      console.log('API Response:', response.data);

      if (response.status === 200 && response.data.data) {
        // Combine managers and employees from the API response
        const managers = response.data.data.managers || [];
        const employees = response.data.data.employees || [];
        const allEmployees = [...managers, ...employees];

        const apiEmployees = allEmployees.map(emp => ({
          id: emp.employeeId || emp._id,
          name: emp.name,
          phoneNumber: emp.phoneNumber,
          idCardNumber: emp.idCardNumber,
          salary: emp.monthlySalary || emp.salary, // Fix: Use monthlySalary from API
          joiningDate: moment(emp.createdAt).format('MMMM DD, YYYY'),
          faceImage: emp.livePicture,
          type:
            emp.role === 'manager'
              ? 'Manager'
              : emp.role === 'admin'
              ? 'Admin'
              : 'Employee',
          faceRecognized: !!emp.livePicture,
        }));

        console.log('Employees fetched from API:', apiEmployees);
        setEmployeesData(apiEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Keep existing data if API fails
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleOpenAddEmployeeModal = () => {
    setIsAddEmployeeModalVisible(true);
  };

  const handleCloseAddEmployeeModal = () => {
    setIsAddEmployeeModalVisible(false);
  };

  const handleSaveEmployee = () => {
    // Yeh function ab zaruri nahi hai kyunki useEffect data handle kar raha hai
    // Lekin isko props mein pass karna zaroori hai
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && date) {
      setSelectedFilterDate(date);
    }
  };

  const handleOpenDatePicker = () => {
    setShowDatePicker(true);
  };

  const handleClearDateFilter = () => {
    setSelectedFilterDate(null);
  };

  const renderEmployeeItem = ({ item, index }) => (
    <View
      style={[
        styles.row,
        { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
      ]}
    >
      <Text style={styles.employeeIdCell}>{item.id}</Text>
      <Text style={styles.employeeNameCell}>{item.name}</Text>
      <Text style={styles.employeeTypeCell}>{item.type}</Text>
      <Text style={styles.employeePhoneCell}>{item.phoneNumber}</Text>
      <Text style={styles.employeeIdCardCell}>{item.idCardNumber}</Text>
      <Text style={styles.employeeSalaryCell}>{item.salary}</Text>
      <Text style={styles.employeeJoiningDateCell}>{item.joiningDate}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ... Header Section ... */}
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

      {/* Content Area */}
      <View style={styles.contentArea}>
        {/* Employees Header and Buttons Section */}
        <View style={styles.employeesHeaderSection}>
          <Text style={styles.screenTitle}>Employees</Text>

          <View style={styles.buttonsGroup}>
            {/* Date Picker Button */}
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={handleOpenDatePicker}
            >
              <Ionicons
                name="calendar-outline"
                size={width * 0.02}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.datePickerButtonText}>
                {selectedFilterDate
                  ? moment(selectedFilterDate).format('MMM DD, YYYY')
                  : 'Select Date'}
              </Text>
              {selectedFilterDate && (
                <TouchableOpacity
                  onPress={handleClearDateFilter}
                  style={{ marginLeft: 5 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={width * 0.018}
                    color="#fff"
                  />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Refresh Button */}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchEmployeesFromAPI}
              disabled={isLoadingEmployees}
            >
              <Ionicons
                name="refresh"
                size={width * 0.02}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.refreshButtonText}>
                {isLoadingEmployees ? 'Loading...' : 'Refresh'}
              </Text>
            </TouchableOpacity>

            {/* Add New Employee Button */}
            <TouchableOpacity
              style={styles.addEmployeeButton}
              onPress={handleOpenAddEmployeeModal}
            >
              <Ionicons
                name="add-circle-outline"
                size={width * 0.02}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.addEmployeeButtonText}>Add New Employee</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Employees Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.employeeIdHeader}>Employee ID</Text>
            <Text style={styles.employeeNameHeader}>Name</Text>
            <Text style={styles.employeeTypeHeader}>Type</Text>
            <Text style={styles.employeePhoneHeader}>Phone Number</Text>
            <Text style={styles.employeeIdCardHeader}>ID Card</Text>
            <Text style={styles.employeeSalaryHeader}>Salary</Text>
            <Text style={styles.employeeJoiningDateHeader}>Joining Date</Text>
          </View>

          <FlatList
            data={filteredEmployees}
            renderItem={renderEmployeeItem}
            keyExtractor={item => item.id}
            style={styles.table}
            ListEmptyComponent={() => (
              <View style={styles.noDataContainer}>
                {isLoadingEmployees ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#A98C27" />
                    <Text style={styles.loadingText}>Loading employees...</Text>
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No employees found.</Text>
                )}
              </View>
            )}
          />
        </View>
      </View>

      {/* DateTimePicker for native platforms */}
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedFilterDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {/* Add Employee Modal Component */}
      <AddEmployeeModal
        isVisible={isAddEmployeeModalVisible}
        onClose={handleCloseAddEmployeeModal}
        onSave={handleSaveEmployee} // Yeh prop ab bhi zaruri hai, lekin iska function empty hai
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
  contentArea: {
    flex: 1,
    backgroundColor: '#161719',
    padding: width * 0.02,
    borderRadius: 10,
  },
  screenTitle: {
    color: '#fff',
    fontSize: width * 0.029,
    fontWeight: '600',
    marginRight: width * 0.01,
  },
  employeesHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
    marginTop: height * -0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    paddingBottom: height * 0.03,
  },
  buttonsGroup: {
    flexDirection: 'row',
    gap: width * 0.02,
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.025,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
  },
  addEmployeeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A98C27',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.025,
    borderRadius: 8,
  },
  addEmployeeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.025,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  datePickerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: height * 0.018,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: width * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
  },
  // Flex values adjusted for the new column
  employeeIdHeader: {
    flex: 1.1,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.015,
    textAlign: 'left',
  },
  employeeNameHeader: {
    flex: 1.2,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.015,
    textAlign: 'left',
  },
  employeeTypeHeader: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.015,
    textAlign: 'left',
  },
  employeePhoneHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.015,
    textAlign: 'left',
  },
  employeeIdCardHeader: {
    flex: 1.8,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.015,
    textAlign: 'left',
  },
  employeeSalaryHeader: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
  },
  employeeJoiningDateHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: height * 0.019,
    paddingHorizontal: width * 0.01,
    alignItems: 'center',
  },
  // Flex values adjusted for the new column
  employeeIdCell: {
    flex: 1.1,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  employeeNameCell: {
    flex: 1.2,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  employeeTypeCell: {
    flex: 1,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  employeePhoneCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.015,
    marginRight: width * 0.02,
  },
  employeeIdCardCell: {
    flex: 1.8,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  employeeSalaryCell: {
    flex: 1,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  employeeJoiningDateCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  table: {
    flex: 1,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
    marginTop: 10,
  },
  noDataText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
  },
});

export default EmployeesScreen;
