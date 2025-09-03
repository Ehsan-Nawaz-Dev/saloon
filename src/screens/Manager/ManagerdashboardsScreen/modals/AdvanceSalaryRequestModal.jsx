import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../../api/config';

const { width, height } = Dimensions.get('window');

// 🔐 Get authentication token (simple like other screens)
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

const AdvanceSalaryRequestModal = ({ isVisible, onClose, route }) => {
  const navigation = useNavigation();
  const { employee, capturedImagePath } = route?.params || {};

  const [amount, setAmount] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill employee data (read-only)
  const employeeId = employee?.id || '';
  const employeeName = employee?.name || '';
  const employeeRole = employee?.role || '';

  const handlePickImage = () => {
    Alert.alert(
      'Attach Proof Picture',
      'Choose a picture to attach as proof for advance salary request.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose from Gallery', onPress: () => chooseImage('gallery') },
        { text: 'Take Photo', onPress: () => chooseImage('camera') },
      ],
      { cancelable: true },
    );
  };

  const chooseImage = source => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    };

    if (source === 'camera') {
      ImagePicker.launchCamera(options, response => {
        if (!response.didCancel && !response.error) {
          setProofImage(response.assets[0]);
        }
      });
    } else {
      ImagePicker.launchImageLibrary(options, response => {
        if (!response.didCancel && !response.error) {
          setProofImage(response.assets[0]);
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter the advance salary amount.');
      return;
    }

    if (!proofImage) {
      Alert.alert('Error', 'Please attach a proof picture.');
      return;
    }

    if (isNaN(parseFloat(amount.trim()))) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('employeeName', employeeName);
      formData.append('amount', amount.trim());
      formData.append('employeeLivePicture', {
        uri: `file://${capturedImagePath}`,
        type: 'image/jpeg',
        name: 'employee_live.jpg',
      });
      formData.append('image', {
        uri: proofImage.uri,
        type: 'image/jpeg',
        name: 'proof.jpg',
      });

      // Get token and convert if needed
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log(
        '🔑 [AdvanceSalaryRequestModal] Using token:',
        token.substring(0, 20) + '...',
      );

      // Make direct API call
      const response = await fetch(`${BASE_URL}/advance-salary/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const responseData = await response.json();

      Alert.alert(
        'Success',
        'Your advance salary request has been sent to admin for approval.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back 2 screens (skip face recognition screen)
              navigation.pop(2);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Submit advance salary request error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      Alert.alert('Error', `Failed to submit request: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Advance Salary Request</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#A9A9A9" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Employee Information (Read-only) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Employee Information</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Employee ID</Text>
                <TextInput
                  style={[styles.textInput, styles.readOnlyInput]}
                  value={employeeId}
                  editable={false}
                  placeholder="Employee ID"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={[styles.textInput, styles.readOnlyInput]}
                  value={employeeName}
                  editable={false}
                  placeholder="Employee Name"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Role</Text>
                <TextInput
                  style={[styles.textInput, styles.readOnlyInput]}
                  value={employeeRole}
                  editable={false}
                  placeholder="Role"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            {/* Request Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Request Details</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Amount (PKR) *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="#A9A9A9"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Proof Picture *</Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={handlePickImage}
                >
                  {proofImage ? (
                    <Image
                      source={{ uri: proofImage.uri }}
                      style={styles.selectedImage}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera" size={32} color="#A98C27" />
                      <Text style={styles.imagePlaceholderText}>
                        Attach Proof Picture
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Captured Face Image */}
            {capturedImagePath && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Captured Face</Text>
                <Image
                  source={{ uri: `file://${capturedImagePath}` }}
                  style={styles.capturedImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#2D2D31',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    width: '100%',
    maxHeight: height * 0.6,
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A98C27',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1F1F22',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#444',
  },
  readOnlyInput: {
    backgroundColor: '#333',
    color: '#999',
  },
  imagePickerButton: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F1F22',
  },
  imagePlaceholderText: {
    color: '#A98C27',
    fontSize: 14,
    marginTop: 8,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  capturedImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#A98C27',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdvanceSalaryRequestModal;
