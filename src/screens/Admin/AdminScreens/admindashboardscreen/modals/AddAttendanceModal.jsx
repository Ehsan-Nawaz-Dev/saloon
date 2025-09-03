// src/screens/Admin/AddAttendanceModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../../../../context/UserContext';

const { width, height } = Dimensions.get('window');

const AddAttendanceModal = ({ isVisible, onClose, onSave }) => {
  const navigation = useNavigation();
  const { userName } = useUser();
  const [adminId, setAdminId] = useState('');
  const [adminName, setAdminName] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [showAttendanceStatusPicker, setShowAttendanceStatusPicker] =
    useState(false);
  const [livePicture, setLivePicture] = useState(null); // File URI
  const [isUploading, setIsUploading] = useState(false);

  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');

  useEffect(() => {
    if (isVisible) {
      console.log('🟢 [AddAttendanceModal] Modal opened');
      // Auto-populate admin information from logged-in user
      loadCurrentAdminInfo();
    } else {
      console.log('🔴 [AddAttendanceModal] Modal closed');
    }
  }, [isVisible]);

  // Load current admin information
  const loadCurrentAdminInfo = async () => {
    try {
      const adminAuthData = await AsyncStorage.getItem('adminAuth');
      if (adminAuthData) {
        const { admin } = JSON.parse(adminAuthData);
        if (admin) {
          console.log('👤 [Admin Info] Loaded admin data:', admin);
          console.log('👤 [Admin Info] Admin structure:', {
            _id: admin._id,
            adminId: admin.adminId,
            employeeId: admin.employeeId,
            name: admin.name,
            role: admin.role,
          });

          // Use MongoDB _id as the primary identifier (works for both collections)
          const adminIdentifier = admin._id;
          setAdminId(adminIdentifier);
          setAdminName(admin.name || userName);

          console.log('✅ [Admin Info] Using identifier:', adminIdentifier);
        }
      }
    } catch (error) {
      console.error('❌ [Admin Info] Failed to load admin data:', error);
      // Fallback to user context
      if (userName) {
        setAdminName(userName);
      }
    }
  };

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

  const resetForm = () => {
    console.log('🔄 [Form] Resetting form fields');
    setAdminId('');
    setAdminName('');
    setAttendanceStatus('');
    setAttendanceDate(new Date());
    setLivePicture(null);
    setShowAttendanceStatusPicker(false);
  };

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
      console.error('❌ [Auth] Failed to read token from storage:', error);
      return null;
    }
  };

  // 📸 Navigate to face recognition screen
  const navigateToFaceRecognition = () => {
    const trimmedAdminId = adminId.trim();
    const trimmedAdminName = adminName.trim();
    const trimmedAttendanceStatus = attendanceStatus.trim();

    // Validate required fields before navigation
    if (!trimmedAdminId || !trimmedAdminName || !trimmedAttendanceStatus) {
      showCustomAlert('Please fill all required fields before taking photo.');
      return;
    }

    if (!['Check-In', 'Check-Out'].includes(trimmedAttendanceStatus)) {
      showCustomAlert(
        'Invalid Attendance Status: Must be "Check-In" or "Check-Out".',
      );
      return;
    }

    // Close modal and navigate to face recognition
    onClose();
    navigation.navigate('AdminAttendanceFaceRecognition', {
      adminId: trimmedAdminId,
      adminName: trimmedAdminName,
      attendanceStatus: trimmedAttendanceStatus,
      attendanceDate: attendanceDate,
      onSuccess: attendanceData => {
        // Call parent's onSave when attendance is successfully recorded
        onSave(attendanceData);
      },
    });
  };

  const handleClose = () => {
    console.log('🚪 [Modal] Close button pressed');
    resetForm();
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Admin Attendance</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons
                    name="close-circle-outline"
                    size={width * 0.025}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalInputReadOnly}>
                <Text style={styles.modalInputLabel}>Admin ID:</Text>
                <Text style={styles.modalInputText}>
                  {adminId || 'Loading...'}
                </Text>
              </View>

              <View style={styles.modalInputReadOnly}>
                <Text style={styles.modalInputLabel}>Admin Name:</Text>
                <Text style={styles.modalInputText}>
                  {adminName || 'Loading...'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalInputTouchable}
                onPress={() =>
                  setShowAttendanceStatusPicker(!showAttendanceStatusPicker)
                }
              >
                <Text
                  style={
                    attendanceStatus
                      ? styles.modalInputText
                      : styles.modalInputPlaceholderText
                  }
                >
                  {attendanceStatus || 'Select Attendance Status'}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={width * 0.018}
                  color="#A9A9A9"
                />
              </TouchableOpacity>

              {showAttendanceStatusPicker && (
                <View style={styles.pickerOptionsContainer}>
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => {
                      console.log('🖱️ [Picker] Selected: Check-In');
                      setAttendanceStatus('Check-In');
                      setShowAttendanceStatusPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>Check-In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => {
                      console.log('🖱️ [Picker] Selected: Check-Out');
                      setAttendanceStatus('Check-Out');
                      setShowAttendanceStatusPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>Check-Out</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.modalInputTouchable}
                onPress={() => {
                  console.log('📅 [Date] Date picker opened');
                  setOpenDatePicker(true);
                }}
              >
                <Text style={styles.modalInputText}>
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
                  console.log('✅ [Date] Date confirmed:', date.toISOString());
                  setOpenDatePicker(false);
                  setAttendanceDate(date);
                }}
                onCancel={() => {
                  console.log('❌ [Date] Date picker canceled');
                  setOpenDatePicker(false);
                }}
              />

              {/* Face Recognition Navigation */}
              <TouchableOpacity
                style={styles.modalInputTouchable}
                onPress={navigateToFaceRecognition}
              >
                <Text style={styles.modalInputText}>
                  Take Live Picture for Face Recognition
                </Text>
                <Ionicons
                  name="camera-outline"
                  size={width * 0.018}
                  color="#A9A9A9"
                />
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={navigateToFaceRecognition}
                >
                  <Text style={styles.saveButtonText}>
                    Proceed to Face Recognition
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={customAlertVisible}
        onRequestClose={hideCustomAlert}
      >
        <View style={styles.customAlertCenteredView}>
          <View style={styles.customAlertModalView}>
            <Text style={styles.customAlertModalText}>
              {customAlertMessage}
            </Text>
            <TouchableOpacity
              style={styles.customAlertCloseButton}
              onPress={hideCustomAlert}
            >
              <Text style={styles.customAlertCloseButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

// ✅ Styles (Unchanged — already correct)
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: width * 0.6,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: width * 0.02,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
    paddingBottom: height * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
  },
  modalTitle: {
    color: '#fff',
    fontSize: width * 0.02,
    fontWeight: 'bold',
  },
  modalInput: {
    backgroundColor: '#2A2D32',
    color: '#fff',
    fontSize: width * 0.018,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.015,
    borderRadius: 8,
    marginBottom: height * 0.015,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  modalInputTouchable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.015,
    borderRadius: 8,
    marginBottom: height * 0.015,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  modalInputText: {
    color: '#fff',
    fontSize: width * 0.018,
  },
  modalInputPlaceholderText: {
    color: '#A9A9A9',
    fontSize: width * 0.018,
  },
  modalInputReadOnly: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.015,
    borderRadius: 8,
    marginBottom: height * 0.015,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  modalInputLabel: {
    color: '#A98C27',
    fontSize: width * 0.016,
    fontWeight: '600',
  },
  pickerOptionsContainer: {
    backgroundColor: '#2A2D32',
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: height * 0.02,
  },
  closeButton: {
    backgroundColor: '#3C3C3C',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.12,
    borderRadius: 8,
    marginRight: width * 0.01,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: width * 0.016,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#A98C27',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.12,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: width * 0.016,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    marginTop: height * 0.01,
    alignItems: 'center',
  },
  imagePreview: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: 8,
  },
  customAlertCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  customAlertModalView: {
    margin: 20,
    backgroundColor: '#1F1F1F',
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    elevation: 5,
  },
  customAlertModalText: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff',
    fontSize: width * 0.02,
  },
  customAlertCloseButton: {
    backgroundColor: '#A98C27',
    borderRadius: 5,
    padding: 10,
    elevation: 2,
  },
  customAlertCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AddAttendanceModal;
