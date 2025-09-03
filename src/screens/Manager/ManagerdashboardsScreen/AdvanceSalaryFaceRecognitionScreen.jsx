import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../api/config';
import { getManagerToken } from '../../../utils/authUtils';

const { width, height } = Dimensions.get('window');

const AdvanceSalaryFaceRecognitionScreen = () => {
  const navigation = useNavigation();

  // VisionCamera permission hook
  const { hasPermission, requestPermission } = useCameraPermission();

  const [status, setStatus] = useState('Initializing camera...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);

  // State for custom alert modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState(null);

  // Refs & animations
  const cameraRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Get camera devices - prefer front camera for face recognition
  const frontDevice = useCameraDevice('front');
  const backDevice = useCameraDevice('back');
  const device = frontDevice ?? backDevice ?? null;

  // Show custom alert modal
  const showCustomAlert = useCallback((message, callback = null) => {
    setAlertMessage(message);
    setAlertCallback(() => callback);
    setShowAlertModal(true);
  }, []);

  const hideCustomAlert = useCallback(() => {
    setShowAlertModal(false);
    setAlertMessage('');
    if (alertCallback) {
      alertCallback();
      setAlertCallback(null);
    }
  }, [alertCallback]);

  // Camera permission check
  useEffect(() => {
    const ensurePermission = async () => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          setStatus('Camera permission denied.');
          showCustomAlert(
            'Camera permission is required for face recognition. Please enable it in your app settings.',
            () => navigation.goBack(),
          );
        }
      }
    };
    ensurePermission();
  }, [hasPermission, requestPermission, navigation, showCustomAlert]);

  // Camera initialized
  const handleCameraInitialized = () => {
    setCameraInitialized(true);
    setStatus('Camera ready. Position your face in the frame.');
  };

  // Get all registered employees and managers from backend
  const getRegisteredUsers = async () => {
    try {
      const token = await getManagerToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Get employees
      const employeesResponse = await axios.get(
        `${BASE_URL}/employees/all`,
        config,
      );

      // Get managers (from admin panel with manager role)
      const managersResponse = await axios.get(`${BASE_URL}/admin/all`, config);

      const employees =
        employeesResponse.data?.data || employeesResponse.data || [];
      const managers =
        managersResponse.data?.data || managersResponse.data || [];

      // Filter managers only
      const filteredManagers =
        managers.filter(admin => admin.role === 'manager') || [];

      return { employees, managers: filteredManagers };
    } catch (error) {
      console.error('Error fetching registered users:', error);
      throw new Error('Failed to fetch registered users');
    }
  };

  // Compare faces using AWS Rekognition
  const compareFaces = async (sourceImagePath, targetImageUrl) => {
    try {
      console.log('🔍 [Face Comparison] Starting face comparison...');
      console.log('🔍 [Face Comparison] Source image path:', sourceImagePath);
      console.log('🔍 [Face Comparison] Target image URL:', targetImageUrl);

      const token = await getManagerToken();
      if (!token) {
        console.error('❌ [Face Comparison] No authentication token found');
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('sourceImage', {
        uri: `file://${sourceImagePath}`,
        type: 'image/jpeg',
        name: 'source.jpg',
      });
      formData.append('targetImageUrl', targetImageUrl);

      console.log(
        '📡 [Face Comparison] Sending request to:',
        `${BASE_URL}/employees/compare-faces`,
      );

      const response = await axios.post(
        `${BASE_URL}/employees/compare-faces`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('✅ [Face Comparison] Response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [Face Comparison] Face comparison error:', error);
      console.error('❌ [Face Comparison] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 401) {
        throw new Error('Authentication failed during face comparison.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid image data provided.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error during face comparison.');
      } else {
        throw new Error(`Face comparison failed: ${error.message}`);
      }
    }
  };

  // Handle face recognition process
  const handleFaceRecognition = async () => {
    if (!cameraInitialized || isProcessing) return;

    setIsProcessing(true);
    setStatus('Capturing photo...');

    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
      });

      setStatus('Fetching user data...');
      const { employees, managers } = await getRegisteredUsers();

      console.log('Fetched employees:', employees.length);
      console.log('Fetched managers:', managers.length);

      if (employees.length === 0 && managers.length === 0) {
        throw new Error(
          'No registered employees or managers found. Please register users in Admin Panel.',
        );
      }

      setStatus('Comparing faces...');
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      // Check employees first
      for (const employee of employees) {
        try {
          const result = await compareFaces(photo.path, employee.livePicture);
          if (result.match && result.confidence >= 80) {
            // Employee found - show request modal
            setStatus('Employee recognized!');
            setTimeout(() => {
              navigation.navigate('AdvanceSalaryRequestModal', {
                employee: {
                  id: employee.employeeId,
                  name: employee.name,
                  role: 'Employee',
                  livePicture: employee.livePicture,
                },
                capturedImagePath: photo.path,
              });
            }, 1000);
            return;
          }
        } catch (error) {
          console.error('Error comparing with employee:', error);
        }
      }

      // Check managers
      for (const manager of managers) {
        try {
          const result = await compareFaces(photo.path, manager.livePicture);
          if (result.match && result.confidence >= 80) {
            // Manager found - show request modal
            setStatus('Manager recognized!');
            setTimeout(() => {
              navigation.navigate('AdvanceSalaryRequestModal', {
                employee: {
                  id: manager.adminId,
                  name: manager.name,
                  role: 'Manager',
                  livePicture: manager.livePicture,
                },
                capturedImagePath: photo.path,
              });
            }, 1000);
            return;
          }
        } catch (error) {
          console.error('Error comparing with manager:', error);
        }
      }

      // No match found
      setStatus('No matching user found');
      showCustomAlert(
        'No registered employee or manager found with this face. Please ensure you are registered in the system.',
        () => {
          setIsProcessing(false);
          setStatus('Camera ready. Position your face in the frame.');
        },
      );
    } catch (error) {
      console.error('Face recognition error:', error);
      setStatus('Face recognition failed');
      showCustomAlert(`Face recognition failed: ${error.message}`, () => {
        setIsProcessing(false);
        setStatus('Camera ready. Position your face in the frame.');
      });
    }
  };

  // Handle go back
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Initial animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  // No permission
  if (!hasPermission) {
    return (
      <View style={styles.centeredView}>
        <Text style={styles.statusText}>Camera permission required</Text>
        <TouchableOpacity
          style={[styles.permissionButton, styles.backButton]}
          onPress={handleGoBack}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No camera device
  if (!device) {
    return (
      <View style={styles.centeredView}>
        <Text style={styles.statusText}>No camera device found</Text>
        <TouchableOpacity
          style={[styles.permissionButton, styles.backButton]}
          onPress={handleGoBack}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advance Salary Face Recognition</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <Animated.View
          style={[
            styles.cameraWrapper,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={cameraInitialized && hasPermission}
            photo={true}
            enableZoomGesture={false}
            enableHighQualityPhotos={true}
            onInitialized={handleCameraInitialized}
          />

          {/* Face detection overlay */}
          <View style={styles.overlay}>
            <View style={styles.faceFrame} />
          </View>
        </Animated.View>
      </View>

      {/* Status and Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.instructionText}>
          Position employee/manager face in the frame
        </Text>
        <Text style={styles.statusText}>{status}</Text>

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#A98C27" />
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}
      </View>

      {/* Capture Button */}
      <View style={styles.captureContainer}>
        <TouchableOpacity
          style={[
            styles.captureButton,
            (!cameraInitialized || isProcessing) &&
              styles.captureButtonDisabled,
          ]}
          onPress={handleFaceRecognition}
          disabled={!cameraInitialized || isProcessing}
        >
          <Ionicons
            name="camera"
            size={32}
            color={!cameraInitialized || isProcessing ? '#666' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAlertModal}
        onRequestClose={hideCustomAlert}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertModal}>
            <Text style={styles.alertTitle}>Notice</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
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
    backgroundColor: '#1F1F22',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2D2D31',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cameraWrapper: {
    width: '100%',
    height: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 300,
    height: 300,
    borderWidth: 3,
    borderColor: '#A98C27',
    borderRadius: 150,
    backgroundColor: 'transparent',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#A98C27',
    textAlign: 'center',
    marginBottom: 10,
  },
  processingContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#A98C27',
    borderRadius: 2,
    marginTop: 10,
    width: '100%',
  },
  captureContainer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#A98C27',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  captureButtonDisabled: {
    backgroundColor: '#666',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F1F22',
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: '#A98C27',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#A98C27',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertModal: {
    backgroundColor: '#2D2D31',
    borderRadius: 15,
    padding: 30,
    marginHorizontal: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  alertMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  alertButton: {
    backgroundColor: '#A98C27',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdvanceSalaryFaceRecognitionScreen;
