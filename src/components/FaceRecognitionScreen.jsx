// src/screens/admin/FaceRecognitionScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Modal,
  Linking, // For opening app settings
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import useFaceRecognition from '../hooks/useFaceRecognition';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook
import axios from 'axios';
import { BASE_URL } from '../api/config';
import RNFS from 'react-native-fs';

const { width, height } = Dimensions.get('window');

const FaceRecognitionScreen = ({ route }) => {
  // Remove navigation from props
  const navigation = useNavigation(); // Use the hook to get navigation object

  // Employee data from the previous screen (AddEmployeeModal)
  const { employee } = route.params || {};

  // Face recognition hook
  const {
    isLoading: isRecognitionLoading,
    error: recognitionError,
    lastResult: recognitionResult,
    registerEmployeeFace,
    clearError,
    clearResult,
  } = useFaceRecognition();

  // VisionCamera permission hook
  const { hasPermission, requestPermission } = useCameraPermission();

  const [status, setStatus] = useState('Initializing camera...');
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [capturedFaceUri, setCapturedFaceUri] = useState(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);

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
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertAction, setAlertAction] = useState(null);

  const showCustomAlert = (message, action = null) => {
    setAlertMessage(message);
    setAlertAction(() => action);
    setShowAlertModal(true);
  };

  const hideCustomAlert = () => {
    setShowAlertModal(false);
    setAlertMessage('');
    if (alertAction) {
      alertAction();
      setAlertAction(null);
    }
  };

  // Initial animations
  useEffect(() => {
    progressAnim.setValue(0);
    opacityAnim.setValue(0);
    scaleAnim.setValue(0.8);

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Request camera permission on mount if needed
  useEffect(() => {
    const ensurePermission = async () => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          setStatus('Camera permission denied.');
          showCustomAlert(
            'Camera permission is required for face recognition. Please enable it in your app settings.',
            () => Linking.openSettings(),
          );
        }
      }
    };
    ensurePermission();
  }, [hasPermission, requestPermission]);

  // Update status as devices/permission change
  useEffect(() => {
    if (!hasPermission) {
      setStatus('Waiting for camera permission...');
      return;
    }
    if (!device) {
      setStatus(
        'No camera device found. If you are on an emulator, enable a virtual camera in AVD settings.',
      );
      return;
    }
    setStatus('Camera ready. Please align your face in the center.');
  }, [hasPermission, device]);

  // Trigger recognition only after camera initialized
  useEffect(() => {
    if (hasPermission && device && cameraInitialized && !isRecognitionActive) {
      setIsRecognitionActive(true);
    }
  }, [hasPermission, device, cameraInitialized, isRecognitionActive]);

  // Generate face encoding/code from image
  const generateFaceCode = async imagePath => {
    try {
      console.log('🔢 Generating face code from image...');

      // Read image as base64
      const imageData = await RNFS.readFile(imagePath, 'base64');

      // Create a simple hash/code from image data
      // In production, you'd use proper face encoding algorithms
      let hash = 0;
      const str = imageData.substring(0, 1000); // Use first 1000 chars for speed

      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      // Create face features array (simulated face encoding)
      const faceCode = {
        hash: Math.abs(hash),
        features: [],
        timestamp: Date.now(),
      };

      // Generate 128 features (simulated face landmarks/features)
      for (let i = 0; i < 128; i++) {
        // Use image data to generate consistent features
        const seed = imageData.charCodeAt(i % imageData.length) || 0;
        faceCode.features.push((seed + i * 7) % 255);
      }

      console.log('✅ Face code generated:', faceCode.hash);
      return faceCode;
    } catch (error) {
      console.error('Error generating face code:', error);
      throw error;
    }
  };

  // New function to register employee with face image and encoding
  const registerEmployeeWithFace = async (imagePath, employeeData) => {
    try {
      setStatus('Processing face data...');

      // Step 1: Generate face code from captured image
      const faceCode = await generateFaceCode(imagePath);
      console.log('📸 Face code generated for employee registration');

      setStatus('Uploading employee data with face image...');

      // Create FormData for multipart/form-data request
      const formData = new FormData();

      // Add employee data
      formData.append('name', employeeData.name);
      formData.append('phoneNumber', employeeData.phoneNumber);
      formData.append('idCardNumber', employeeData.idCardNumber);
      formData.append('monthlySalary', employeeData.monthlySalary);
      formData.append('role', employeeData.role);

      // Add face encoding as JSON string
      formData.append('faceCode', JSON.stringify(faceCode));

      // Add face image
      formData.append('livePicture', {
        uri: `file://${imagePath}`,
        type: 'image/jpeg',
        name: 'employee_face.jpg',
      });

      // Get authentication token
      const getAuthToken = async () => {
        try {
          const adminAuth = await AsyncStorage.getItem('adminAuth');
          if (adminAuth) {
            return adminAuth;
          }
          throw new Error('No authentication token found');
        } catch (error) {
          console.error('Error getting auth token:', error);
          throw new Error('Authentication failed');
        }
      };

      // Make API call to add employee with face
      console.log('Making API call to:', `${BASE_URL}/employees/add`);
      console.log('FormData contents:', {
        name: employeeData.name,
        phoneNumber: employeeData.phoneNumber,
        idCardNumber: employeeData.idCardNumber,
        monthlySalary: employeeData.monthlySalary,
        role: employeeData.role,
        hasFaceCode: true,
        hasImage: true,
      });

      const token = await getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/employees/add`, // ✅ Ab har jagah BASE_URL use hoga
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Employee registration response status:', response.status);
      console.log('Employee registration response data:', response.data);

      if (response.status === 201) {
        setStatus('Employee registered successfully with face!');

        // Update employee object with API response data
        const updatedEmployee = {
          ...employee,
          faceRecognized: true,
          faceImage: `file://${imagePath}`,
          faceCode: faceCode,
          apiResponse: response.data,
          id: response.data.employee?.employeeId || employee.id,
        };

        // Success animation
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        // Show success alert based on employee type and navigate back
        setTimeout(() => {
          const getSuccessMessage = role => {
            switch (role) {
              case 'admin':
                return 'Admin has been added successfully!';
              case 'manager':
                return 'Manager has been added successfully!';
              case 'employee':
              default:
                return 'Employee has been added successfully!';
            }
          };

          console.log('🎉 Success! Showing alert for role:', employeeData.role);
          console.log('📊 Updated employee data:', updatedEmployee);

          showCustomAlert(getSuccessMessage(employeeData.role), () => {
            console.log('✅ Going back to previous screen...');
            // Go back to previous screen (Employees screen)
            navigation.goBack();
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Employee registration failed:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setStatus('Registration failed: ' + errorMessage);
      showCustomAlert('Employee registration failed: ' + errorMessage);
    }
  };

  // Face registration process with face encoding
  const startFaceRecognitionProcess = async () => {
    if (!isRecognitionActive || !cameraInitialized) return;

    setStatus('Scanning for face...');
    clearError();
    clearResult();

    try {
      if (!cameraRef.current) {
        throw new Error('Camera not available');
      }

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
        skipMetadata: true,
      });

      const imagePath = photo.path;
      setCapturedFaceUri(`file://${imagePath}`);
      setStatus('Processing face recognition...');

      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      console.log('🔍 Debug: Employee data received:', employee);
      console.log('🔍 Debug: Has apiData?', !!employee?.apiData);
      console.log('🔍 Debug: ApiData content:', employee?.apiData);

      // Check if this is for employee registration with API
      if (employee && employee.apiData) {
        console.log('✅ Using new API registration system');
        // Employee registration with face image and encoding
        await registerEmployeeWithFace(imagePath, employee.apiData);
      } else {
        console.log('⚠️ Falling back to legacy system');
        // Legacy face recognition (for other purposes)
        const result = await registerEmployeeFace(
          imagePath,
          employee?.id || `emp_${Date.now()}`,
          employee?.name || 'Unknown Employee',
        );

        if (result.success) {
          setStatus('Face registered successfully!');

          // Update the employee object with face data
          const updatedEmployee = {
            ...employee,
            faceRecognized: true,
            faceImage: `file://${imagePath}`,
            faceId: result.faceId,
          };

          // Success animation
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();

          // Navigate back after success
          setTimeout(() => {
            showCustomAlert('Face registered successfully!', () => {
              navigation.goBack();
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Face recognition failed:', error);
      setStatus('Recognition failed: ' + error.message);
      showCustomAlert('Face recognition failed: ' + error.message);
    }
  };

  // Render logic based on camera readiness
  if (!hasPermission || !device) {
    return (
      <View style={styles.centeredView}>
        <Text style={styles.statusText}>{status}</Text>
        <TouchableOpacity
          style={styles.cancelRecognitionButton}
          onPress={() => requestPermission()}
        >
          <Text style={styles.cancelRecognitionButtonText}>
            Grant Permission
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelRecognitionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelRecognitionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.centeredView}>
      <Animated.View
        style={[
          styles.modalView,
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <Ionicons
              name="close-circle-outline"
              size={width * 0.05}
              color="#fff"
            />
          </TouchableOpacity>
          <View style={styles.headerContainer}>
            <Text style={styles.faceRecognitionTitle}>Face Recognition</Text>
          </View>
          <View style={styles.instructionContainer}>
            <Text style={styles.faceRecognitionInstruction}>
              please look into the camera and hold still..
            </Text>
          </View>
        </View>

        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            device={device}
            isActive={true}
            photo={true}
            onInitialized={() => setCameraInitialized(true)}
          />
          <View style={styles.faceOutline}></View>
        </View>

        <Text style={styles.statusText}>{status}</Text>

        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          <Text style={styles.progressText}>
            {Math.round(progressAnim.__getValue())}%
          </Text>
        </View>

        <TouchableOpacity
          disabled={!cameraInitialized}
          style={styles.cancelRecognitionButton}
          onPress={startFaceRecognitionProcess}
        >
          <Text style={styles.cancelRecognitionButtonText}>
            {cameraInitialized
              ? employee?.apiData
                ? 'Register Employee with Face'
                : 'Register Face'
              : 'Initializing Camera...'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showAlertModal}
        onRequestClose={hideCustomAlert}
      >
        <View style={styles.alertCenteredView}>
          <View style={styles.alertModalView}>
            <Text style={styles.alertModalText}>{alertMessage}</Text>
            <TouchableOpacity
              style={styles.alertCloseButton}
              onPress={hideCustomAlert}
            >
              <Text style={styles.alertCloseButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
  },

  modalView: {
    width: '100%',
    maxWidth: 650,
    backgroundColor: '#1F1F1F',
    borderRadius: 15,
    padding: width * 0.03,
    alignItems: 'center',
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: height * 0.02,
  },
  closeButton: {
    padding: width * -0.0000008,
    padding: height * -0.0000008,

    borderRadius: 150,
    elevation: 15,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: height * 0.01,
  },
  faceRecognitionTitle: {
    color: '#fff',
    fontSize: width * 0.03,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: height * 0.0000005,
    marginBottom: height * 0.01,
  },
  faceRecognitionInstruction: {
    color: '#fff',
    fontSize: width * 0.018,
    textAlign: 'center',
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 5 / 6,
    backgroundColor: '#000',
    borderRadius: 90,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.02,
    position: 'relative',
  },
  faceOutline: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  statusText: {
    fontSize: width * 0.018,
    color: '#fff',
    marginBottom: height * 0.015,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBarBackground: {
    width: '80%',
    height: height * 0.015,
    backgroundColor: '#2A2D32',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: height * 0.02,
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#A98C27',
    borderRadius: 5,
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontSize: width * 0.012,
    fontWeight: 'bold',
  },
  cancelRecognitionButton: {
    backgroundColor: '#2A2D32',
    borderRadius: 10,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.03,
    width: '80%',
    alignItems: 'center',
    marginTop: height * 0.01,
  },
  cancelRecognitionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.018,
  },
  alertCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertModalView: {
    margin: 20,
    backgroundColor: '#1F1F1F',
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    elevation: 5,
  },
  alertModalText: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff',
    fontSize: width * 0.02,
  },
  alertCloseButton: {
    backgroundColor: '#A98C27',
    borderRadius: 5,
    padding: 10,
    elevation: 2,
  },
  alertCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default FaceRecognitionScreen;
