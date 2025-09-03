import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import moment from 'moment';

const { width, height } = Dimensions.get('window');

const AddBookingModal = ({ isVisible, onClose, onSave }) => {
  // Separate state for each field
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('10:00');
  const [advancePayment, setAdvancePayment] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [image, setImage] = useState(null);

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const resetForm = () => {
    setClientId('');
    setClientName('');
    setDate(new Date());
    setTime('10:00');
    setAdvancePayment('');
    setDescription('');
    setPhoneNumber('');
    setImage(null);
  };

  const handleSave = () => {
    // Validate all required fields
    if (!clientId.trim()) {
      Alert.alert('Error', 'Client ID is required');
      return;
    }
    if (!clientName.trim()) {
      Alert.alert('Error', 'Client Name is required');
      return;
    }
    if (!date) {
      Alert.alert('Error', 'Date is required');
      return;
    }
    if (!time.trim()) {
      Alert.alert('Error', 'Time is required');
      return;
    }
    if (!advancePayment.trim()) {
      Alert.alert('Error', 'Advance Payment is required');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Phone Number is required');
      return;
    }

    // Validate advance payment is a number.
    if (isNaN(parseFloat(advancePayment))) {
      Alert.alert('Error', 'Advance Payment must be a valid number');
      return;
    }

    // Clean phone number (remove spaces, dashes, parentheses) but don't validate format
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

    const bookingData = {
      clientId: clientId.trim(),
      clientName: clientName.trim(),
      date: moment(date).format('YYYY-MM-DD'),
      time: time.trim(),
      advancePayment: parseFloat(advancePayment),
      description: description.trim(),
      phoneNumber: cleanPhoneNumber,
      image: image,
    };

    console.log('🔍 Sending booking data:', bookingData);
    onSave(bookingData);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log(
          'ImagePicker Error: ',
          response.errorCode,
          response.errorMessage,
        );
        Alert.alert('Image Picker Error', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0];
        setImage(selectedImage);
      }
    });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(moment(selectedTime).format('HH:mm'));
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Advance Booking</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons
                    name="close-circle-outline"
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Client ID */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Client ID *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Client ID"
                    placeholderTextColor="#A9A9A9"
                    value={clientId}
                    onChangeText={setClientId}
                  />
                </View>

                {/* Client Name */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Client Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Client Name"
                    placeholderTextColor="#A9A9A9"
                    value={clientName}
                    onChangeText={setClientName}
                  />
                </View>

                {/* Date */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Date *</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {moment(date).format('DD/MM/YYYY')}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#A9A9A9"
                    />
                  </TouchableOpacity>
                </View>

                {/* Time */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Time *</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.dateText}>{time}</Text>
                    <Ionicons name="time-outline" size={20} color="#A9A9A9" />
                  </TouchableOpacity>
                </View>

                {/* Advance Payment */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Advance Payment (PKR) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Amount"
                    placeholderTextColor="#A9A9A9"
                    value={advancePayment}
                    onChangeText={setAdvancePayment}
                    keyboardType="numeric"
                  />
                </View>

                {/* Description */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Description *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter Description"
                    placeholderTextColor="#A9A9A9"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>

                {/* Phone Number */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="phone number format+923001234650"
                    placeholderTextColor="#A9A9A9"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Image Upload */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Client Image (Optional)</Text>
                  <TouchableOpacity
                    style={styles.imageUploadContainer}
                    onPress={handleImagePicker}
                  >
                    {image ? (
                      <View style={styles.imagePreviewContainer}>
                        <Image
                          source={{ uri: image.uri }}
                          style={styles.imagePreview}
                        />
                        <Text style={styles.imageName}>
                          {image.fileName || 'Selected Image'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={40}
                          color="#A98C27"
                        />
                        <Text style={styles.uploadText}>
                          Tap to select image
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save Booking</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={moment(`2000-01-01 ${time}`).toDate()}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F1F1F',
    borderRadius: 15,
    width: width * 0.9,
    maxHeight: height * 0.8,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    maxHeight: height * 0.6,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  imageUploadContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    color: '#A9A9A9',
    fontSize: 14,
    marginTop: 8,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageName: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    backgroundColor: '#444',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#A98C27',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddBookingModal;
