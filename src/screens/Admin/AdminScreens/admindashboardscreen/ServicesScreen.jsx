// src/screens/AdminPanel/ServicesScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
// Icon libraries
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// Assuming these are your local context and components
import { useUser } from '../../../../context/UserContext';
import AddServiceModal from './modals/AddServiceModal';
import ServiceOptionsModal from './modals/ServiceOptionsModal';
import ServiceDetailModal from './modals/ServiceDetailModal';
import ConfirmationModal from './modals/ConfirmationModal';
import StandardHeader from '../../../../components/StandardHeader';
// Navigation and API library
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import your API functions from the centralized API folder
import {
  addService,
  getServices,
  updateService,
  deleteService,
} from '../../../../api';

const { width, height } = Dimensions.get('window');

// Helper function to get auth token from AsyncStorage
const getAuthToken = async () => {
  try {
    const authData = await AsyncStorage.getItem('adminAuth');
    if (authData) {
      const { token } = JSON.parse(authData);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Failed to get token from storage:', error);
    return null;
  }
};

// Local images (These should be dynamic from your API in a real app)
import haircutImage from '../../../../assets/images/haircut.jpeg';
import manicureImage from '../../../../assets/images/manicure.jpeg';
import pedicureImage from '../../../../assets/images/pedicure.jpeg';
import hairColoringImage from '../../../../assets/images/color.jpeg';
const userProfileImagePlaceholder = require('../../../../assets/images/foundation.jpeg');

/**
 * Helper function to handle different image sources (local asset or URI).
 * @param {string|number} image - The source of the image.
 * @returns {object|null} - The image source object for React Native.
 */
const getDisplayImageSource = image => {
  if (typeof image === 'string' && image.startsWith('http')) {
    return { uri: image };
  } else if (typeof image === 'number') {
    // Assuming local assets are numbers
    return image;
  }
  // Fallback for cases where image might be a broken URI or not present
  return haircutImage;
};

/**
 * ServiceCard component to display an individual service with options.
 * @param {object} props - Component props.
 * @param {object} props.service - The service data object.
 * @param {function} props.onOptionsPress - Function to handle the options button press.
 * @param {function} props.onPress - Function to handle the card press (e.g., for navigation).
 */
const ServiceCard = ({ service, onOptionsPress, onPress }) => {
  // Determine if the image source is a local asset or a URI
  const imageSource = getDisplayImageSource(service.image);

  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => onPress(service)}
    >
      <Image
        source={imageSource}
        style={styles.serviceImage}
        resizeMode="cover"
      />
      <Text style={styles.serviceName}>{service.title || service.name}</Text>
      {service.isHiddenFromEmployee && (
        <View style={styles.hiddenBadge}>
          <Text style={styles.hiddenBadgeText}>Hidden</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.cardOptionsButton}
        onPress={event => onOptionsPress(event, service)}
      >
        <Ionicons name="ellipsis-vertical" size={width * 0.022} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

/**
 * The main ServicesScreen component for the Admin Panel.
 * Manages fetching, adding, editing, and deleting services.
 */
const ServicesScreen = () => {
  const navigation = useNavigation();
  const { userName } = useUser();

  // State for services data and loading status
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [optionsModalPosition, setOptionsModalPosition] = useState({
    top: 0,
    left: 0,
  });
  const [selectedService, setSelectedService] = useState(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  // Function to fetch all services from the backend API
  const fetchServices = async () => {
    setLoading(true);
    try {
      // Get token from AsyncStorage
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      const data = await getServices(token);
      setServices(data);
      setError(null);
    } catch (e) {
      console.error('Error fetching services:', e);
      setError(
        e.message ||
          'Failed to load services. Please ensure your backend server is running and the IP address is correct.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Load services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Function to handle saving a new service or updating an existing one
  const handleSaveService = async serviceData => {
    try {
      console.log('Saving service data:', serviceData);

      // Get token from AsyncStorage
      const token = await getAuthToken();
      if (!token) {
        Alert.alert(
          'Error',
          'Authentication token not found. Please login again.',
        );
        return;
      }

      if (serviceToEdit) {
        // It's an edit operation - use the id from the mapped data
        console.log('Editing service with ID:', serviceToEdit.id);
        await updateService(serviceToEdit.id, serviceData, token);
        Alert.alert('Success', 'Service updated successfully!');
      } else {
        // It's an add operation
        console.log('Adding new service');
        await addService(serviceData, token);
        Alert.alert('Success', 'Service added successfully!');
      }
      fetchServices(); // Refresh the services list
    } catch (e) {
      console.error('Error saving service:', e);
      console.error('Error details:', {
        message: e.message,
        response: e.response?.data,
        status: e.response?.status,
      });
      Alert.alert('Error', e.message || 'Failed to save the service.');
    }
    setAddEditModalVisible(false);
    setServiceToEdit(null);
  };

  // Function to handle opening the ServiceOptionsModal
  const handleCardOptionsPress = (event, service) => {
    const buttonX = event.nativeEvent.pageX;
    const buttonY = event.nativeEvent.pageY;

    const modalWidth = width * 0.15;
    const modalHeight = height * 0.2;

    let left = buttonX - modalWidth + 20;
    let top = buttonY - 10;

    // Basic boundary checks
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left + modalWidth > width) left = width - modalWidth - 10;
    if (top + modalHeight > height) top = height - modalHeight - 10;

    setOptionsModalPosition({ top, left });
    setSelectedService(service);
    setOptionsModalVisible(true);
  };

  // Function to handle selection of an option from ServiceOptionsModal
  const handleOptionSelect = option => {
    setOptionsModalVisible(false); // Always close options modal
    if (!selectedService) return;

    switch (option) {
      case 'view':
        // Set the service to be viewed and open the ServiceDetailModal
        setDetailModalVisible(true);
        break;
      case 'edit':
        // Map the backend data structure to match what AddServiceModal expects
        const mappedServiceData = {
          id: selectedService._id,
          serviceName: selectedService.title || selectedService.name, // Backend returns 'title'
          serviceImage: selectedService.image,
          subServices: selectedService.subServices
            ? selectedService.subServices.map((sub, index) => ({
                id:
                  sub._id ||
                  sub.id ||
                  `sub_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 15)}_${index}`, // Ensure unique ID with index
                name: sub.name || sub.subServiceName, // Use 'name' for backend compatibility
                price: sub.price,
                time: sub.time,
                description: sub.description,
                image: sub.image || sub.subServiceImage, // Use 'image' for backend compatibility
              }))
            : [],
          isHiddenFromEmployee: selectedService.isHiddenFromEmployee || false,
        };
        console.log('Mapped service data for editing:', mappedServiceData);
        setServiceToEdit(mappedServiceData);
        setAddEditModalVisible(true);
        break;
      case 'delete':
        setServiceToDelete(selectedService);
        setConfirmModalVisible(true);
        break;
      case 'hide':
        // Note: This functionality would need to be implemented in the backend
        Alert.alert(
          'Info',
          'Hide/Show functionality needs backend implementation',
        );
        break;
      default:
        break;
    }
  };

  // Function to confirm deletion
  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      // Get token from AsyncStorage
      const token = await getAuthToken();
      if (!token) {
        Alert.alert(
          'Error',
          'Authentication token not found. Please login again.',
        );
        return;
      }

      await deleteService(serviceToDelete._id, token);
      Alert.alert('Success', 'Service deleted successfully!');
      fetchServices(); // Refresh the services list
    } catch (e) {
      console.error('Error deleting service:', e);
      Alert.alert('Error', e.message || 'Failed to delete the service.');
    }
    setServiceToDelete(null);
    setConfirmModalVisible(false);
  };

  // Function to handle navigation to SubServicesScreen
  const handleServiceCardPress = service => {
    navigation.navigate('SubServices', { service: service });
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A99226" />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header Section */}
        <StandardHeader />
        {/* Services Title and Add New Services Button */}
        <View style={styles.servicesHeader}>
          <Text style={styles.servicesTitle}>Services</Text>
          <TouchableOpacity
            style={styles.addNewServicesButton}
            onPress={() => {
              setServiceToEdit(null);
              setAddEditModalVisible(true);
            }}
          >
            <Text style={styles.addNewServicesButtonText}>
              Add New Services
            </Text>
          </TouchableOpacity>
        </View>

        {/* Services Grid */}
        <ScrollView contentContainerStyle={styles.servicesGridContainer}>
          <View style={styles.servicesGrid}>
            {services.map(service => (
              <ServiceCard
                key={service._id}
                service={service}
                onOptionsPress={handleCardOptionsPress}
                onPress={handleServiceCardPress}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Modals */}
      <AddServiceModal
        visible={addEditModalVisible}
        onClose={() => setAddEditModalVisible(false)}
        onSave={handleSaveService}
        initialServiceData={serviceToEdit}
      />
      <ServiceOptionsModal
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        onSelectOption={handleOptionSelect}
        position={optionsModalPosition}
      />
      <ServiceDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        service={selectedService}
      />
      <ConfirmationModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={confirmDeleteService}
        message={`Are you sure you want to delete "${
          serviceToDelete?.name || serviceToDelete?.title
        }"? This action cannot be undone.`}
      />
    </View>
  );
};

export default ServicesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1f20ff',
    paddingTop: height * 0.03,
    paddingHorizontal: width * 0.03,
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1f20ff',
  },
  loadingText: {
    color: '#fff',
    fontSize: width * 0.03,
    marginTop: height * 0.02,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: width * 0.025,
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  retryButton: {
    backgroundColor: '#A99226',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.035,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: width * 0.018,
    fontWeight: '600',
  },

  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.03,
    marginHorizontal: width * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    paddingBottom: height * 0.03,
  },
  servicesTitle: {
    fontSize: width * 0.035,
    fontWeight: 'bold',
    color: '#fff',
  },
  addNewServicesButton: {
    backgroundColor: '#A99226',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.035,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addNewServicesButtonText: {
    color: '#fff',
    fontSize: width * 0.018,
    fontWeight: '600',
  },
  servicesGridContainer: {
    paddingBottom: height * 0.05,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  serviceCard: {
    backgroundColor: '#3C3C3C',
    borderRadius: 3,
    width: 122,
    height: 250,
    marginRight: width * 0.01,
    marginBottom: height * 0.025,
    overflow: 'hidden',
    paddingBottom: height * 0.01,
    position: 'relative',
  },
  serviceImage: {
    width: 122,
    height: 190,
    borderRadius: 4.9,
    marginBottom: height * 0.01,
  },
  serviceName: {
    color: '#fff',
    fontSize: width * 0.018,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: width * 0.01,
  },
  cardOptionsButton: {
    position: 'absolute',
    top: height * 0.002,
    right: width * 0.002,
    backgroundColor: '#424040ff',
    borderRadius: (width * 0.02 + width * 0.01) / 2,
    padding: width * 0.0015,
  },
  hiddenBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 1,
  },
  hiddenBadgeText: {
    color: '#fff',
    fontSize: width * 0.015,
    fontWeight: 'bold',
  },
});
