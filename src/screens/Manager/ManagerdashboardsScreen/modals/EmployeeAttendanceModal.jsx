import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../../api/config';

const { width, height } = Dimensions.get('window');

const EmployeeAttendanceModal = ({ route, navigation }) => {
  const { employee, capturedImage, confidence } = route.params || {};

  const [attendanceType, setAttendanceType] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [showAttendanceTypePicker, setShowAttendanceTypePicker] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');

  useEffect(() => {
    console.log(
      '🟢 [EmployeeAttendanceModal] Modal opened with employee:',
      employee,
    );
  }, []);

  const showCustomAlert = message => {
    console.log('🔔 [Alert] Showing alert:', message);
    setCustomAlertMessage(message);
    setCustomAlertVisible(true);
  };

  const hideCustomAlert = () => {
    console.log('🔕 [Alert] Dismissing alert');
    setCustomAlertVisible(false);
    setCustomAlertMessage('');
  };

  // 🔐 Retrieve token from AsyncStorage
  const getAuthToken = async () => {
    try {
      const data = await AsyncStorage.getItem('managerAuth');
      if (data) {
        const { token } = JSON.parse(data);
        return token;
      }
      return null;
    } catch (error) {
      console.error('❌ [Auth] Failed to read token from storage:', error);
      return null;
    }
  };

  const handleSubmitAttendance = async () => {
    console.log(
      '🔍 [EmployeeAttendanceModal] Starting handleSubmitAttendance...',
    );

    if (!attendanceType) {
      showCustomAlert('Please select attendance type (Check-In or Check-Out).');
      return;
    }

    if (!employee || !employee._id) {
      showCustomAlert('Employee data is missing. Please try again.');
      return;
    }

    const attendanceApiType =
      attendanceType === 'Check-In' ? 'checkin' : 'checkout';

    try {
      setIsSubmitting(true);

      // Get authentication token
      const token = await getAuthToken();
      if (!token) {
        showCustomAlert('Authentication token not found. Please login again.');
        return;
      }

      console.log('📡 [API] Submitting employee attendance:', {
        employeeId: employee.employeeId || employee._id, // Use custom employeeId first
        employeeName: employee.name,
        attendanceType: attendanceApiType,
        date: attendanceDate.toISOString(),
      });

      // Prepare form data
      const formData = new FormData();
      formData.append('employeeId', employee.employeeId || employee._id); // Use custom employeeId
      formData.append('attendanceType', attendanceApiType);

      // Add the captured face image
      if (capturedImage) {
        formData.append('livePicture', {
          uri: capturedImage,
          type: 'image/jpeg',
          name: `attendance_${Date.now()}.jpg`,
        });
      }

      const apiUrl = `${BASE_URL}/attendance/${attendanceApiType}`;
      console.log('📤 [API] Sending request to:', apiUrl);
      console.log('📤 [API] Employee data being sent:', {
        employeeId: employee.employeeId || employee._id,
        hasEmployeeId: !!employee.employeeId,
        hasMongoId: !!employee._id,
        employeeName: employee.name,
        employeeRole: employee.role,
      });

      // Test network connectivity first
      console.log('🌐 [Network Test] Testing connection to server...');
      console.log('🌐 [Network Test] Base URL:', BASE_URL);

      try {
        const testUrl = `${BASE_URL}/employees/all`;
        console.log('🌐 [Network Test] Testing URL:', testUrl);

        const testResponse = await axios.get(testUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Accept: 'application/json',
          },
          timeout: 5000,
        });
        console.log(
          '✅ [Network Test] Server is reachable:',
          testResponse.status,
        );
      } catch (testError) {
        console.log(
          '❌ [Network Test] Server connectivity issue:',
          testError.message,
        );
        console.log('❌ [Network Test] Error code:', testError.code);

        // If basic connectivity fails, show specific error
        if (
          testError.code === 'ENETUNREACH' ||
          testError.code === 'ECONNREFUSED'
        ) {
          showCustomAlert(
            '❌ Cannot connect to server. Please check:\n\n1. Ngrok server is running\n2. Internet connection\n3. Backend server is active',
          );
          return;
        }
      }

      console.log('📤 [API] Final request details:', {
        url: apiUrl,
        method: 'POST',
        hasFile: !!capturedImage,
        employeeId: employee.employeeId || employee._id,
        attendanceType: attendanceApiType,
        tokenExists: !!token,
      });

      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
        },
        timeout: 30000, // Increased timeout to 30 seconds
      });

      console.log('✅ [API Success] Attendance response:', response.data);

      if (response.status === 200 || response.status === 201) {
        showCustomAlert(
          `✅ ${attendanceType} successful!\n\nEmployee: ${
            employee.name
          }\nTime: ${moment().format('hh:mm A')}\nDate: ${moment(
            attendanceDate,
          ).format('MMM DD, YYYY')}`,
                     () => {
             // Navigate back 2 screens to attendance screen (skip face recognition screen)
             navigation.pop(2); // Go back 2 screens: Modal -> Face Recognition -> Attendance Screen
             // The useFocusEffect will automatically refresh the data
           },
        );
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error) {
      console.error('🚨 [API Error] Employee attendance failed:', error);
      console.error('🚨 [API Error] Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      });

      let errorMessage = 'Failed to submit attendance. ';

      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Employee not found in system.';
      } else if (error.response?.status === 400) {
        const responseMessage = error.response?.data?.message || '';
        errorMessage = responseMessage || 'Invalid attendance request.';
      } else if (
        error.code === 'ENETUNREACH' ||
        error.code === 'ECONNREFUSED'
      ) {
        errorMessage =
          'Network error. Cannot reach server. Please check your internet connection.';
      } else if (
        error.code === 'ECONNABORTED' ||
        error.message.includes('timeout')
      ) {
        errorMessage =
          'Request timed out. Server is taking too long to respond. Please try again.';
      } else if (
        error.message.includes('Network Error') ||
        error.message.includes('Network request failed')
      ) {
        errorMessage =
          'Network connection failed. Please check:\n\n1. Internet connection\n2. Ngrok server is running\n3. Backend server is active';
      } else if (!error.response && error.request) {
        errorMessage =
          'No response from server. Please check:\n\n1. Ngrok tunnel is active\n2. Backend server is running\n3. Internet connection is stable';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage =
          'Network error detected. Please verify:\n\n1. Ngrok tunnel is active\n2. Backend server is running\n3. Internet connection is stable';
      } else {
        errorMessage = `Attendance submission failed: ${error.message}`;
      }

      showCustomAlert(`❌ ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 [Modal] Close button pressed');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Employee Attendance</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Employee Info (Read-Only) */}
        <View style={styles.employeeInfoContainer}>
          <Text style={styles.sectionTitle}>Recognized Employee</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Employee ID:</Text>
            <Text style={styles.infoValue}>
              {employee?.employeeId || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{employee?.name || 'Unknown'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>
              {employee?.role === 'manager' ? 'Manager' : 'Employee'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Confidence:</Text>
            <Text style={styles.confidenceValue}>
              {confidence?.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Captured Image Preview */}
        {capturedImage && (
          <View style={styles.imageContainer}>
            <Text style={styles.sectionTitle}>Captured Face</Text>
            <Image
              source={{ uri: capturedImage }}
              style={styles.capturedImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Attendance Type Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.sectionTitle}>Attendance Details</Text>

          <TouchableOpacity
            style={styles.inputTouchable}
            onPress={() =>
              setShowAttendanceTypePicker(!showAttendanceTypePicker)
            }
          >
            <Text
              style={
                attendanceType ? styles.inputText : styles.inputPlaceholderText
              }
            >
              {attendanceType || 'Select Attendance Type'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={width * 0.018}
              color="#A9A9A9"
            />
          </TouchableOpacity>

          {showAttendanceTypePicker && (
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.pickerOption}
                onPress={() => {
                  setAttendanceType('Check-In');
                  setShowAttendanceTypePicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>Check-In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerOption}
                onPress={() => {
                  setAttendanceType('Check-Out');
                  setShowAttendanceTypePicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>Check-Out</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Date Selection */}
          <TouchableOpacity
            style={styles.inputTouchable}
            onPress={() => setOpenDatePicker(true)}
          >
            <Text style={styles.inputText}>
              {moment(attendanceDate).format('MMM DD, YYYY')}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={width * 0.018}
              color="#A9A9A9"
            />
          </TouchableOpacity>

          <DatePicker
            modal
            mode="date"
            open={openDatePicker}
            date={attendanceDate}
            onConfirm={date => {
              setOpenDatePicker(false);
              setAttendanceDate(date);
            }}
            onCancel={() => setOpenDatePicker(false)}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitAttendance}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save Attendance</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={customAlertVisible}
        onRequestClose={hideCustomAlert}
      >
        <View style={styles.alertCenteredView}>
          <View style={styles.alertModalView}>
            <Text style={styles.alertModalText}>{customAlertMessage}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={hideCustomAlert}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  employeeInfoContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#A98C27',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  confidenceValue: {
    color: '#A98C27',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  capturedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#A98C27',
  },
  inputContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  inputTouchable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.015,
    borderRadius: 8,
    marginBottom: height * 0.015,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  inputText: {
    color: '#fff',
    fontSize: width * 0.018,
  },
  inputPlaceholderText: {
    color: '#A9A9A9',
    fontSize: width * 0.018,
  },
  pickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    marginBottom: height * 0.015,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
  },
  pickerOptionText: {
    color: '#fff',
    fontSize: width * 0.018,
  },
  submitButton: {
    backgroundColor: '#A98C27',
    paddingVertical: height * 0.02,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: width * 0.02,
    fontWeight: 'bold',
  },
  alertCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  alertModalView: {
    margin: 20,
    backgroundColor: '#1F1F1F',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    maxWidth: width * 0.8,
  },
  alertModalText: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  alertButton: {
    backgroundColor: '#A98C27',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 2,
  },
  alertButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default EmployeeAttendanceModal;
