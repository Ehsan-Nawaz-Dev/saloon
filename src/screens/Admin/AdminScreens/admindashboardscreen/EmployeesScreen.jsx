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
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useUser } from '../../../../context/UserContext';
import moment from 'moment';
import axios from 'axios';
import { ActivityIndicator } from 'react-native';
import { BASE_URL } from '../../../../api/config';
import AddEmployeeModal from './modals/AddEmployeeModal';
import StandardHeader from '../../../../components/StandardHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const userProfileImagePlaceholder = require('../../../../assets/images/foundation.jpeg');

// Initial dummy data (will be replaced by API)
const initialEmployeesData = [];

// 🔐 Retrieve token from AsyncStorage
const getAuthToken = async () => {
  try {
    const data = await AsyncStorage.getItem('adminAuth');
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

const EmployeesScreen = () => {
  const { userName, salonName } = useUser();
  const navigation = useNavigation();
  const route = useRoute();

  const [searchText, setSearchText] = useState('');
  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [employeesData, setEmployeesData] = useState(initialEmployeesData);
  const [isAddEmployeeModalVisible, setIsAddEmployeeModalVisible] =
    useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter employees based on search and date
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

  // Fetch employees from API
  const fetchEmployeesFromAPI = async () => {
    try {
      setIsLoadingEmployees(true);
      console.log('📡 Fetching employees from API...');

      // Get authentication token for consistency
      const token = await getAuthToken();
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        : {};

      // Fixed endpoint: /api/employees/all
      const response = await axios.get(`${BASE_URL}/employees/all`, {
        headers,
      });

      console.log('✅ API Response:', response.data);

      if (response.status === 200 && response.data.data) {
        // Use grouped data if available
        const admins = response.data.grouped?.admins || [];
        const managers = response.data.grouped?.managers || [];
        const employees = response.data.grouped?.employees || [];
        const allEmployees = [...admins, ...managers, ...employees];

        const mappedEmployees = allEmployees.map(emp => {
          // Safely extract and clean fields
          const idCardNumber = (emp.idCardNumber || emp.idCard || 'N/A').trim();
          const salary = emp.monthlySalary || emp.salary || 'N/A';
          const livePicture = emp.livePicture?.trim(); // Trim extra spaces

          // Format employee ID (use provided one)
          const formattedId = emp.employeeId || `EMP${emp._id?.slice(-4)}`;

          return {
            id: formattedId,
            _id: emp._id, // Add MongoDB ObjectId for API operations
            name: emp.name.trim(),
            phoneNumber: emp.phoneNumber,
            idCardNumber,
            salary:
              typeof salary === 'number'
                ? salary.toLocaleString()
                : String(salary),
            joiningDate: moment(emp.createdAt).format('MMMM DD, YYYY'),
            faceImage: livePicture || null,
            type:
              emp.role === 'manager'
                ? 'Manager'
                : emp.role === 'admin'
                ? 'Admin'
                : 'Employee',
            faceRecognized: !!livePicture,
          };
        });

        console.log('📊 Mapped Employees:', mappedEmployees);
        setEmployeesData(mappedEmployees);
      } else {
        Alert.alert('Error', 'Failed to load employee data.');
      }
    } catch (error) {
      console.error('🚨 Error fetching employees:', error.message);
      Alert.alert(
        'Network Error',
        'Could not connect to server. Please check your connection.',
      );
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEmployeesFromAPI();
  }, []);

  // Listen for new employee from FaceRecognitionScreen
  useEffect(() => {
    if (route.params?.newEmployee) {
      const newEmp = route.params.newEmployee;

      if (newEmp.apiResponse) {
        const apiData = newEmp.apiResponse.data || newEmp.apiResponse;

        const employeeToAdd = {
          id: apiData.employeeId || `EMP${apiData._id?.slice(-4)}`,
          name: apiData.name.trim(),
          phoneNumber: apiData.phoneNumber,
          idCardNumber: apiData.idCardNumber || 'N/A',
          salary: apiData.monthlySalary?.toString() || 'N/A',
          joiningDate: moment().format('MMMM DD, YYYY'),
          faceImage: apiData.livePicture?.trim() || null,
          type:
            apiData.role === 'admin'
              ? 'Admin'
              : apiData.role === 'manager'
              ? 'Manager'
              : 'Employee',
          faceRecognized: true,
        };

        console.log('🆕 Adding new employee:', employeeToAdd);
        setEmployeesData(prev => [employeeToAdd, ...prev]); // Add to top
      }

      // Clear param
      navigation.setParams({ newEmployee: undefined });
    }
  }, [route.params?.newEmployee, navigation]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchEmployeesFromAPI();
    }, []),
  );

  // Modal handlers
  const handleOpenAddEmployeeModal = () => {
    setIsAddEmployeeModalVisible(true);
  };

  const handleCloseAddEmployeeModal = (shouldRefresh = false) => {
    setIsAddEmployeeModalVisible(false);
    if (shouldRefresh) {
      fetchEmployeesFromAPI(); // Refresh after adding
    }
  };

  // Date picker
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

  // Handle delete employee
  const handleDeleteEmployee = employee => {
    setSelectedEmployee(employee);
    setIsDeleteModalVisible(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setSelectedEmployee(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;

    try {
      setIsDeleting(true);

      // Get authentication token
      const token = await getAuthToken();
      if (!token) {
        Alert.alert(
          'Error',
          'Authentication token not found. Please login again.',
        );
        handleCloseDeleteModal();
        return;
      }

      console.log('🗑️ Deleting employee:', selectedEmployee.name);
      console.log('🔑 Using token:', token ? 'Token available' : 'No token');
      console.log('🆔 Employee ID:', selectedEmployee._id);

      // Fixed endpoint: /api/employees/:id
      const response = await axios.delete(
        `${BASE_URL}/employees/${selectedEmployee._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('✅ Delete response:', response.status);

      if (response.status === 200) {
        // Remove employee from local state
        setEmployeesData(prevData =>
          prevData.filter(emp => emp._id !== selectedEmployee._id),
        );

        Alert.alert(
          'Success',
          `Employee ${selectedEmployee.name} has been deleted successfully.`,
        );
        handleCloseDeleteModal();
      }
    } catch (error) {
      console.error('❌ Delete employee error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);

      let errorMessage = 'Failed to delete employee. Please try again.';

      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Employee not found. It may have been already deleted.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Render employee row
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
      <View style={styles.employeeActionCell}>
        <TouchableOpacity
          onPress={() => handleDeleteEmployee(item)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={width * 0.018} color="#ff5555" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <StandardHeader
        searchPlaceholder="Search employees..."
        onSearchChange={setSearchText}
        searchValue={searchText}
      />

      {/* Content */}
      <ScrollView
        style={styles.contentArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Employees Header */}
        <View style={styles.employeesHeaderSection}>
          <Text style={styles.screenTitle}>Employees</Text>

          <View style={styles.buttonsGroup}>
            {/* Date Filter */}
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

            {/* Refresh */}
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

            {/* Add Employee */}
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

            {/* Debug Button */}
            <TouchableOpacity
              style={[styles.addEmployeeButton, { backgroundColor: '#4A90E2' }]}
              onPress={() => {
                console.log('🔍 Current Employees:', employeesData);
                Alert.alert(
                  'Debug Info',
                  `Total: ${employeesData.length}\nFiltered: ${filteredEmployees.length}`,
                );
              }}
            >
              <Ionicons
                name="bug-outline"
                size={width * 0.02}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.addEmployeeButtonText}>Debug</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableWrapper}>
              <View style={styles.tableHeader}>
                <Text style={styles.employeeIdHeader}>Employee ID</Text>
                <Text style={styles.employeeNameHeader}>Name</Text>
                <Text style={styles.employeeTypeHeader}>Type</Text>
                <Text style={styles.employeePhoneHeader}>Phone</Text>
                <Text style={styles.employeeIdCardHeader}>ID Card</Text>
                <Text style={styles.employeeSalaryHeader}>Salary</Text>
                <Text style={styles.employeeJoiningDateHeader}>
                  Joining Date
                </Text>
                <Text style={styles.employeeActionHeader}>Actions</Text>
              </View>

              <FlatList
                data={filteredEmployees}
                renderItem={renderEmployeeItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ListEmptyComponent={() => (
                  <View style={styles.noDataContainer}>
                    {isLoadingEmployees ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#A98C27" />
                        <Text style={styles.loadingText}>
                          Loading employees...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.noDataText}>No employees found.</Text>
                    )}
                  </View>
                )}
              />
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedFilterDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isVisible={isAddEmployeeModalVisible}
        onClose={handleCloseAddEmployeeModal}
        onSave={() => fetchEmployeesFromAPI()} // Refresh after save
      />

      {/* Delete Employee Modal */}
      {isDeleteModalVisible && selectedEmployee && (
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalTitle}>Delete Employee</Text>
              <Text style={styles.deleteModalMessage}>
                Are you sure you want to delete this employee?
              </Text>
              <Text style={styles.deleteModalEmployeeInfo}>
                {selectedEmployee.name} ({selectedEmployee.type})
              </Text>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteModalCancelButton}
                  onPress={handleCloseDeleteModal}
                  disabled={isDeleting}
                >
                  <Text style={styles.deleteModalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteModalConfirmButton,
                    isDeleting && styles.deleteModalButtonDisabled,
                  ]}
                  onPress={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.deleteModalConfirmButtonText}>
                      Yes, Delete
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ✅ Styles (unchanged from your version)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingHorizontal: width * 0.02,
    paddingTop: height * 0.02,
  },

  contentArea: {
    flex: 1,
    backgroundColor: '#161719',
    borderRadius: 10,
  },
  scrollContent: {
    padding: width * 0.02,
    paddingBottom: height * 0.05,
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
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: height * 0.4,
  },
  tableWrapper: {
    minWidth: width * 1.3,
    flexDirection: 'column',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: height * 0.018,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: width * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    alignItems: 'center',
  },
  employeeIdHeader: {
    width: width * 0.15,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.015,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeNameHeader: {
    width: width * 0.12,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.015,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeTypeHeader: {
    width: width * 0.1,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.015,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeePhoneHeader: {
    width: width * 0.15,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.015,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeIdCardHeader: {
    width: width * 0.15,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.015,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeSalaryHeader: {
    width: width * 0.1,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeJoiningDateHeader: {
    width: width * 0.15,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeActionHeader: {
    width: width * 0.1,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'center',
    paddingHorizontal: width * 0.005,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: height * 0.019,
    paddingHorizontal: width * 0.01,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#3C3C3C',
    minHeight: height * 0.05,
  },
  employeeIdCell: {
    width: width * 0.15,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeNameCell: {
    width: width * 0.12,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeTypeCell: {
    width: width * 0.1,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeePhoneCell: {
    width: width * 0.15,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeIdCardCell: {
    width: width * 0.15,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeSalaryCell: {
    width: width * 0.1,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeJoiningDateCell: {
    width: width * 0.15,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
    paddingHorizontal: width * 0.005,
  },
  employeeActionCell: {
    width: width * 0.1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.005,
  },
  deleteButton: {
    padding: width * 0.008,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 85, 85, 0.1)',
  },
  table: {
    maxHeight: height * 0.5,
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
  // Delete Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  deleteModalContainer: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: width * 0.03,
    width: width * 0.5,
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  deleteModalContent: {
    alignItems: 'center',
  },
  deleteModalTitle: {
    color: '#fff',
    fontSize: width * 0.022,
    fontWeight: 'bold',
    marginBottom: height * 0.02,
    textAlign: 'center',
  },
  deleteModalMessage: {
    color: '#ccc',
    fontSize: width * 0.018,
    textAlign: 'center',
    marginBottom: height * 0.015,
  },
  deleteModalEmployeeInfo: {
    color: '#A98C27',
    fontSize: width * 0.02,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: height * 0.03,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  deleteModalCancelButton: {
    flex: 1,
    backgroundColor: '#3C3C3C',
    paddingVertical: height * 0.015,
    borderRadius: 8,
    marginRight: width * 0.01,
    alignItems: 'center',
  },
  deleteModalCancelButtonText: {
    color: '#fff',
    fontSize: width * 0.016,
    fontWeight: '600',
  },
  deleteModalConfirmButton: {
    flex: 1,
    backgroundColor: '#ff5555',
    paddingVertical: height * 0.015,
    borderRadius: 8,
    marginLeft: width * 0.01,
    alignItems: 'center',
  },
  deleteModalConfirmButtonText: {
    color: '#fff',
    fontSize: width * 0.016,
    fontWeight: '600',
  },
  deleteModalButtonDisabled: {
    backgroundColor: '#666',
  },
});

export default EmployeesScreen;
