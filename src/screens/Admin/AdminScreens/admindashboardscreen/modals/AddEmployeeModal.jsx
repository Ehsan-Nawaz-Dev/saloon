// src/screens/admin/modals/AddEmployeeModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';

const { width, height } = Dimensions.get('window');

const AddEmployeeModal = ({ isVisible, onClose, onSave }) => {
  const navigation = useNavigation();

  const [employeeId, setEmployeeId] = useState(''); // Employee ID state
  const [employeeName, setEmployeeName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [employeeType, setEmployeeType] = useState('Employee');

  // Jab modal open ho to ek unique ID generate karein
  useEffect(() => {
    if (isVisible) {
      setEmployeeId(`EMP-${Date.now()}`);
    }
  }, [isVisible]);

  const handleSave = () => {
    if (
      !employeeId ||
      !employeeName ||
      !phoneNumber ||
      !idCardNumber ||
      !monthlySalary ||
      !employeeType
    ) {
      Alert.alert(
        'Missing Information',
        'Please fill in all employee details.',
      );
      return;
    }

    const newEmployee = {
      id: employeeId,
      name: employeeName,
      phoneNumber: phoneNumber,
      idCardNumber: idCardNumber,
      salary: monthlySalary,
      joiningDate: moment().format('MMMM DD, YYYY'),
      faceImage: null,
      type: employeeType,
    };

    onSave(newEmployee);

    // Reset fields
    setEmployeeId(''); // Reset ID
    setEmployeeName('');
    setPhoneNumber('');
    setIdCardNumber('');
    setMonthlySalary('');
    setEmployeeType('Employee'); // Reset employee type to default

    navigation.navigate('FaceRecognitionScreen', { employee: newEmployee });

    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Employee</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close-outline"
                size={width * 0.03}
                color="#A9A9A9"
              />
            </TouchableOpacity>
          </View>

          {/* Employee ID Display Field (read-only) */}
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>Employee ID: {employeeId}</Text>
          </View>

          {/* Input Fields */}
          <TextInput
            style={styles.input}
            placeholder="Employee Name"
            placeholderTextColor="#A9A9A9"
            value={employeeName}
            onChangeText={setEmployeeName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#A9A9A9"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="ID Card Number"
            placeholderTextColor="#A9A9A9"
            value={idCardNumber}
            onChangeText={setIdCardNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="Monthly Salary"
            placeholderTextColor="#A9A9A9"
            keyboardType="numeric"
            value={monthlySalary}
            onChangeText={setMonthlySalary}
          />

          {/* Employee Type Selection */}
          <View style={styles.typeSelectionContainer}>
            <Text style={styles.typeLabel}>Employee Type:</Text>
            <TextInput
              style={[styles.input, { marginBottom: height * 0.01 }]}
              placeholder="Type"
              placeholderTextColor="#A9A9A9"
              value={employeeType}
              onChangeText={setEmployeeType}
            />
            <View style={styles.typeButtonsRow}>
              {['Admin', 'Head-girl', 'Employee'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    employeeType === type && styles.selectedTypeButton,
                  ]}
                  onPress={() => setEmployeeType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      employeeType === type && styles.selectedTypeButtonText,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: width * 0.5,
    backgroundColor: '#1E2021',
    borderRadius: 10,
    padding: width * 0.03,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: height * 0.02,
  },
  modalTitle: {
    fontSize: width * 0.03,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: width * 0.005,
  },
  input: {
    width: '100%',
    backgroundColor: '#2A2D32',
    borderRadius: 8,
    padding: width * 0.025,
    marginBottom: height * 0.015,
    color: '#fff',
    fontSize: width * 0.014,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  readOnlyInput: {
    backgroundColor: '#383838', // Thora dark shade taake read-only lage
  },
  readOnlyText: {
    color: '#A9A9A9',
    fontSize: width * 0.014,
  },
  typeSelectionContainer: {
    width: '100%',
    marginBottom: height * 0.02,
  },
  typeLabel: {
    color: '#fff',
    fontSize: width * 0.015,
    marginBottom: height * 0.01,
  },
  typeButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  typeButton: {
    flex: 1,
    paddingVertical: height * 0.01,
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    borderRadius: 5,
    marginHorizontal: width * 0.005,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  selectedTypeButton: {
    backgroundColor: '#A98C27',
    borderColor: '#A98C27',
  },
  typeButtonText: {
    color: '#fff',
    fontSize: width * 0.014,
  },
  selectedTypeButtonText: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: height * 0.01,
  },
  closeModalButton: {
    backgroundColor: '#2A2D32',
    borderRadius: 8,
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.025,
    flex: 1,
    marginRight: width * 0.01,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: width * 0.015,
  },
  saveButton: {
    backgroundColor: '#A98C27',
    borderRadius: 8,
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.025,
    flex: 1,
    marginLeft: width * 0.01,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: width * 0.015,
  },
});

export default AddEmployeeModal;
