import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  PixelRatio,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

const { width } = Dimensions.get('window');
const scale = width / 1280;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

const AdminCheckInOutModal = ({
  isVisible,
  onClose,
  onSubmit,
  selectType,
  slectType,
  isLoading = false,
  adminInfo = null,
}) => {
  const [employId, setEmployId] = useState('');
  const [employeName, setEmployeName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    if (isVisible) {
      if (adminInfo) {
        setEmployId(adminInfo.adminId || 'EMP001');
        setEmployeName(adminInfo.name || 'Employee User');
      } else {
        setEmployId('EMP001');
        setEmployeName('Employee User');
      }
      setSelectedDate(new Date());
      setErrors({});
      setImageUri(null);
    }
  }, [isVisible, adminInfo]);

  const validateForm = () => {
    const newErrors = {};
    if (!employId.trim()) newErrors.employId = 'Employee ID is required';
    if (!employeName.trim())
      newErrors.employeName = 'Employee Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePick = async () => {
    console.log(
      'Image picker button pressed. Implement your image selection logic here.',
    );
    // setImageUri('https://placehold.co/150x150');
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const normalizedType = (slectType || selectType || '').toLowerCase();
    const attendanceData = {
      employId: (employId || adminInfo?.adminId || '').toString().trim(),
      date: moment(selectedDate).format('YYYY-MM-DD'),
      slectType: normalizedType,
      employeName: (employeName || adminInfo?.name || '').toString().trim(),
      imageUri: imageUri,
    };

    console.log(
      '📤 [AdminCheckInOutModal] Submitting data to parent:',
      attendanceData,
    );
    onSubmit(attendanceData);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const getTitle = () => {
    const type = (slectType || selectType || '').toLowerCase();
    return type === 'checkin' ? 'Employee Check-In' : 'Employee Check-Out';
  };

  const getButtonText = () => {
    const type = (slectType || selectType || '').toLowerCase();
    if (isLoading)
      return type === 'checkin' ? 'Checking In...' : 'Checking Out...';
    return type === 'checkin' ? 'Check In' : 'Check Out';
  };

  const getButtonColor = () => {
    const type = (slectType || selectType || '').toLowerCase();
    return type === 'checkin' ? '#A98C27' : '#dc3545';
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={normalize(24)} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Employee ID - Read Only */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Employee ID *</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{employId}</Text>
                <Ionicons
                  name="checkmark-circle"
                  size={normalize(30)}
                  color="#A98C27"
                />
              </View>
              {errors.employId && (
                <Text style={styles.errorText}>{errors.employId}</Text>
              )}
            </View>

            {/* Employee Name - Read Only */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Employee Name *</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{employeName}</Text>
                <Ionicons
                  name="checkmark-circle"
                  size={normalize(30)}
                  color="#A98C27"
                />
              </View>
              {errors.employeName && (
                <Text style={styles.errorText}>{errors.employeName}</Text>
              )}
            </View>

            {/* Date Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={normalize(35)}
                  color="#A9A9A9"
                />
                <Text style={styles.dateText}>
                  {moment(selectedDate).format('MMMM DD, YYYY')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Image Upload */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Image (Optional)</Text>
              {imageUri ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImageUri(null)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={normalize(24)}
                      color="#FF6347"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={handleImagePick}
                >
                  <Ionicons
                    name="camera-outline"
                    size={normalize(50)}
                    color="#A9A9A9"
                  />
                  <Text style={styles.imagePickerText}>Select Image</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Type Display */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Type</Text>
              <View
                style={[
                  styles.typeDisplay,
                  { backgroundColor: getButtonColor() },
                ]}
              >
                <Ionicons
                  name={
                    (slectType || selectType || '').toLowerCase() === 'checkin'
                      ? 'log-in-outline'
                      : 'log-out-outline'
                  }
                  size={normalize(30)}
                  color="#fff"
                />
                <Text style={styles.typeText}>
                  {(slectType || selectType || '').toLowerCase() === 'checkin'
                    ? 'Check-In'
                    : 'Check-Out'}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: getButtonColor() },
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Ionicons
                name={
                  (slectType || selectType || '').toLowerCase() === 'checkin'
                    ? 'log-in-outline'
                    : 'log-out-outline'
                }
                size={normalize(30)}
                color="#fff"
              />
              <Text style={styles.submitButtonText}>{getButtonText()}</Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalize(20),
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: normalize(10),
    width: '75%',
    maxWidth: width * 0.9,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: normalize(20),
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    backgroundColor: '#161719',
    borderTopLeftRadius: normalize(10),
    borderTopRightRadius: normalize(10),
  },
  modalTitle: {
    fontSize: normalize(24),
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: normalize(5),
    borderRadius: normalize(5),
    backgroundColor: '#3C3C3C',
  },
  modalContent: {
    padding: normalize(25),
  },
  inputContainer: {
    marginBottom: normalize(25),
  },
  inputLabel: {
    fontSize: normalize(23),
    color: '#faf9f6',
    marginBottom: normalize(10),
    fontWeight: '600',
  },
  readOnlyInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    borderColor: '#2A2D32',
    borderWidth: 1,
    borderRadius: normalize(8),
    padding: normalize(30),
  },
  readOnlyText: {
    color: '#faf9f6',
    fontSize: normalize(22),
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6347',
    fontSize: normalize(14),
    marginTop: normalize(5),
  },
  dateButton: {
    backgroundColor: '#424449',
    borderRadius: normalize(8),
    padding: normalize(28),
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#fff',
    fontSize: normalize(22),
    marginLeft: normalize(10),
  },
  imagePickerButton: {
    backgroundColor: '#424449',
    borderRadius: normalize(8),
    padding: normalize(45),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    color: '#fff',
    fontSize: normalize(35),
    marginLeft: normalize(10),
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  previewImage: {
    width: normalize(150),
    height: normalize(150),
    borderRadius: normalize(10),
    borderWidth: 2,
    borderColor: '#A9A9A9',
  },
  removeImageButton: {
    position: 'absolute',
    top: -normalize(10),
    right: -normalize(10),
    backgroundColor: '#2A2D32',
    borderRadius: normalize(15),
  },
  typeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: normalize(25),
    borderRadius: normalize(8),
    marginHorizontal: normalize(100),
  },
  typeText: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
    marginLeft: normalize(10),
  },
  // infoContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'flex-start',
  //   backgroundColor: '#424449',
  //   padding: normalize(15),
  //   borderRadius: normalize(8),
  //   marginTop: normalize(10),
  // },
  // infoText: {
  //   color: '#A9A9A9',
  //   fontSize: normalize(14),
  //   marginLeft: normalize(10),
  //   flex: 1,
  //   lineHeight: normalize(20),
  // },
  modalFooter: {
    flexDirection: 'row',
    padding: normalize(20),
    borderTopWidth: 1,
    borderTopColor: '#3C3C3C',
    backgroundColor: '#161719',
    borderBottomLeftRadius: normalize(10),
    borderBottomRightRadius: normalize(10),
    gap: normalize(15),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: normalize(38),
    borderRadius: normalize(8),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: normalize(12),
    backgroundColor: '#28a745',
    borderRadius: normalize(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
    marginLeft: normalize(8),
  },
});

export default AdminCheckInOutModal;
