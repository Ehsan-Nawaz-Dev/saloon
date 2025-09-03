// src/screens/admin/SubServicesScreen.js

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
  PixelRatio,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../../../context/UserContext';
import Sidebar from '../../../../components/Sidebar';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import API functions
import { updateService } from '../../../../api';

import AddSubServiceModal from './modals/AddSubServiceModal';

// Import all necessary local images
import userProfileImage from '../../../../assets/images/kit.jpeg';
import womanBluntCutImage from '../../../../assets/images/coconut.jpeg';
import bobLobCutImage from '../../../../assets/images/growth.jpeg';
import mediumLengthLayerImage from '../../../../assets/images/onion.jpeg';
import vShapedCutImage from '../../../../assets/images/oil.jpeg';
import layerCutImage from '../../../../assets/images/growth.jpeg';
import haircutImage from '../../../../assets/images/makeup.jpeg';
import manicureImage from '../../../../assets/images/hair.jpeg';
import pedicureImage from '../../../../assets/images/product.jpeg';
import hairColoringImage from '../../../../assets/images/eyeshadow.jpeg';

const { width, height } = Dimensions.get('window');

const scale = width / 1280;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

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

// Helper function to get image source (local asset or URI)
const getDisplayImageSource = image => {
  console.log('getDisplayImageSource called with:', image);

  // If image is a valid HTTP/HTTPS URL, return it
  if (
    typeof image === 'string' &&
    (image.startsWith('http://') || image.startsWith('https://'))
  ) {
    console.log('Using HTTP image:', image);
    return { uri: image };
  }

  // If image is a local file path (starts with file://)
  if (typeof image === 'string' && image.startsWith('file://')) {
    console.log('Using local file image:', image);
    return { uri: image };
  }

  // If image is a number (local asset), return it directly
  if (typeof image === 'number') {
    console.log('Using local asset image:', image);
    return image;
  }

  // If image is null, undefined, or empty string, return null
  if (!image || image === '') {
    console.log('No image provided, returning null');
    return null;
  }

  // For any other case, log and return null
  console.log('Unknown image format:', image, 'returning null');
  return null;
};

// Get service detail image based on name
const getServiceDetailImage = serviceDetailName => {
  switch (serviceDetailName) {
    case 'Standard Haircut':
      return womanBluntCutImage;
    case 'Layered Cut':
      return layerCutImage;
    case 'Kids Haircut':
      return bobLobCutImage;
    case 'Classic Manicure':
      return mediumLengthLayerImage;
    case 'Gel Manicure':
      return vShapedCutImage;
    case 'French Manicure':
      return womanBluntCutImage;
    case 'Spa Pedicure':
      return bobLobCutImage;
    case 'Express Pedicure':
      return mediumLengthLayerImage;
    case 'Full Color':
      return vShapedCutImage;
    case 'Highlights':
      return layerCutImage;
    case 'Root Touch-up':
      return womanBluntCutImage;
    case 'Strong Hold Gel':
      return haircutImage;
    case 'Professional Nail File':
      return manicureImage;
    case 'Deep Moisturizing Cream':
      return pedicureImage;
    case 'Hair Bleaching Powder':
      return hairColoringImage;
    case 'Cordless Beard Trimmer':
      return haircutImage;
    case 'Nourishing Cuticle Oil':
      return manicureImage;
    case 'Effective Callus Remover':
      return pedicureImage;
    case 'Color Lock Shampoo':
      return hairColoringImage;
    case 'Extra Hold Hair Spray':
      return hairColoringImage;
    case 'Professional Brush Set':
      return haircutImage;
    case 'Exfoliating Foot Scrub':
      return pedicureImage;
    case 'Stainless Steel Nail Clippers':
      return manicureImage;
    default:
      return userProfileImage;
  }
};

// Service Detail Card Component
const ServiceDetailCard = ({ serviceDetail, onOptionsPress, onAddPress }) => {
  const detailName =
    serviceDetail?.name || serviceDetail?.subServiceName || 'N/A';
  const detailTime = serviceDetail?.time || 'N/A';
  const detailPrice =
    serviceDetail?.price != null ? String(serviceDetail.price) : 'N/A';

  // Get image source with proper fallback logic
  let imageSource = null;

  // First try to get the actual image from serviceDetail
  if (serviceDetail?.image) {
    imageSource = getDisplayImageSource(serviceDetail.image);
  }

  // If no valid image found, try to get from local mapping
  if (!imageSource) {
    imageSource = getServiceDetailImage(detailName);
  }

  // If still no image, use a default fallback
  if (!imageSource) {
    imageSource = userProfileImage;
  }

  console.log(
    'ServiceDetailCard image source for',
    detailName,
    ':',
    imageSource,
  );

  return (
    <View style={styles.cardContainer}>
      <Image source={imageSource} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
          {detailName}
        </Text>
        <Text
          style={styles.cardDescription}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {detailTime}
        </Text>
        <Text style={styles.cardPrice}>{`$${detailPrice}`}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => onOptionsPress('edit', serviceDetail)}
          style={styles.iconButton}
        >
          <Ionicons
            name="create-outline"
            size={normalize(30)}
            color="#FFD700"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onOptionsPress('delete', serviceDetail)}
          style={styles.iconButton}
        >
          <Ionicons name="trash-outline" size={normalize(30)} color="#FFD700" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onAddPress(serviceDetail)}
          style={styles.iconButton}
        >
          <Ionicons
            name="add-circle-outline"
            size={normalize(30)}
            color="#FFD700"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Main SubServicesScreen Component
const SubServicesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userName } = useUser();

  // Get service from route params
  const service = route.params?.service || {};

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize with service.subServices
  const [serviceDetails, setServiceDetails] = useState(
    service.subServices || [],
  );

  // Update serviceDetails when service changes
  useEffect(() => {
    console.log('Service data received:', service);
    console.log('SubServices from service:', service.subServices);

    const subServices = service.subServices || [];
    console.log('Setting service details:', subServices);
    setServiceDetails(subServices);
  }, [service.subServices]);

  // Function to save service details to backend
  const saveServiceDetailsToBackend = async updatedServiceDetails => {
    // Get service ID from different possible sources
    const serviceId = service._id || service.id;

    if (!serviceId) {
      Alert.alert('Error', 'Service ID not found. Cannot save changes.');
      return;
    }

    setLoading(true);
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

      console.log('Saving service details with ID:', serviceId);
      console.log('Updated service details:', updatedServiceDetails);

      // Prepare the service data for backend update
      const serviceData = {
        title: service.name || service.title || service.serviceName,
        image: service.image,
        subServices: updatedServiceDetails.map(detail => ({
          name: detail.name || detail.subServiceName,
          price: parseFloat(detail.price) || 0,
          time: detail.time,
          description: detail.description,
          image: detail.image || detail.subServiceImage,
        })),
      };

      console.log('Service data being sent to backend:', serviceData);

      await updateService(serviceId, serviceData, token);
      Alert.alert('Success', 'Service details updated successfully!');

      // Update local state
      setServiceDetails(updatedServiceDetails);
    } catch (error) {
      console.error('Error saving service details:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert('Error', error.message || 'Failed to save service details.');
    } finally {
      setLoading(false);
    }
  };

  // Handle option selection (edit/delete)
  const handleOptionSelect = (option, serviceDetail) => {
    setSelectedServiceDetail(serviceDetail);

    if (option === 'edit') {
      setIsEditing(true);
      setAddModalVisible(true);
    } else if (option === 'delete') {
      Alert.alert(
        'Confirm Deletion',
        `Are you sure you want to delete "${
          serviceDetail?.name ||
          serviceDetail?.subServiceName ||
          'this service detail'
        }"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('Delete cancelled'),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDeleteServiceDetail(serviceDetail),
          },
        ],
        { cancelable: true },
      );
    }
  };

  // Handle delete service detail
  const handleDeleteServiceDetail = serviceDetailToDelete => {
    console.log('=== Deleting service detail ===');
    console.log('Service detail to delete:', serviceDetailToDelete);

    const detailName =
      serviceDetailToDelete?.name ||
      serviceDetailToDelete?.subServiceName ||
      'Unknown';

    Alert.alert(
      'Delete Service Detail',
      `Are you sure you want to delete "${detailName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Delete confirmed for:', detailName);
            console.log(
              'Current service details before deletion:',
              serviceDetails.map(detail => ({
                id: detail.id,
                _id: detail._id,
                name: detail.name || detail.subServiceName,
              })),
            );

            // Create a unique identifier for comparison
            const targetId =
              serviceDetailToDelete._id || serviceDetailToDelete.id;

            if (!targetId) {
              console.error('No valid ID found for deletion');
              Alert.alert('Error', 'Cannot delete item: No valid ID found');
              return;
            }

            const updatedServiceDetails = serviceDetails.filter(detail => {
              const detailId = detail._id || detail.id;
              const shouldKeep = detailId !== targetId;
              console.log(
                `Comparing ${detailId} with ${targetId}: ${
                  shouldKeep ? 'KEEP' : 'DELETE'
                }`,
              );
              return shouldKeep;
            });

            console.log(
              'Service details after deletion:',
              updatedServiceDetails.map(detail => ({
                id: detail.id,
                _id: detail._id,
                name: detail.name || detail.subServiceName,
              })),
            );

            saveServiceDetailsToBackend(updatedServiceDetails);
          },
        },
      ],
    );
  };

  // Handle add to cart
  const handleAddPress = serviceDetail => {
    navigation.navigate('CartService', {
      selectedService: serviceDetail,
      sourcePanel: 'admin',
    });
  };

  // Handle adding new service detail
  const handleAddServiceDetail = newServiceDetail => {
    console.log('Adding new service detail:', newServiceDetail);
    const updatedServiceDetails = [...serviceDetails, newServiceDetail];
    console.log('Updated service details after adding:', updatedServiceDetails);
    saveServiceDetailsToBackend(updatedServiceDetails);
  };

  // Handle updating existing service detail
  const handleUpdateServiceDetail = updatedServiceDetail => {
    console.log('=== Updating service detail ===');
    console.log('Updated service detail:', updatedServiceDetail);

    const targetId = updatedServiceDetail._id || updatedServiceDetail.id;

    if (!targetId) {
      console.error('No valid ID found for update');
      Alert.alert('Error', 'Cannot update item: No valid ID found');
      return;
    }

    const updatedServiceDetails = serviceDetails.map(detail => {
      const detailId = detail._id || detail.id;

      if (detailId === targetId) {
        console.log(`Updating item with ID: ${detailId}`);
        return {
          ...detail,
          name:
            updatedServiceDetail.subServiceName || updatedServiceDetail.name,
          price: updatedServiceDetail.price,
          time: updatedServiceDetail.time,
          description: updatedServiceDetail.description,
          image: updatedServiceDetail.image,
        };
      }
      return detail;
    });

    console.log(
      'Service details after update:',
      updatedServiceDetails.map(detail => ({
        id: detail.id,
        _id: detail._id,
        name: detail.name || detail.subServiceName,
      })),
    );

    saveServiceDetailsToBackend(updatedServiceDetails);
  };

  // Function to refresh service data
  const refreshServiceData = () => {
    console.log('Refreshing service data...');
    const subServices = service.subServices || [];
    console.log('Refreshed subServices:', subServices);
    setServiceDetails(subServices);
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A98C27" />
        <Text style={styles.loadingText}>Saving changes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Sidebar
        activeTab="Services"
        navigation={navigation}
        onSelect={tabName => {
          // Navigate to the appropriate screen based on tab name
          switch (tabName) {
            case 'Services':
              navigation.navigate('Services');
              break;
            case 'Marketplace':
              navigation.navigate('Marketplace');
              break;
            case 'Deals':
              navigation.navigate('Deals');
              break;
            case 'Attendance':
              navigation.navigate('Attendance');
              break;
            case 'PendingApprovals':
              navigation.navigate('PendingApprovals');
              break;
            case 'Expense':
              navigation.navigate('Expense');
              break;
            case 'AdvanceSalary':
              navigation.navigate('AdvanceSalary');
              break;
            case 'AdvanceBooking':
              navigation.navigate('AdvanceBooking');
              break;
            case 'Employees':
              navigation.navigate('Employees');
              break;
            case 'Clients':
              navigation.navigate('Clients');
              break;
            default:
              break;
          }
        }}
      />
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {service.name || service.title || 'Service'} Details
          </Text>
          <TouchableOpacity
            onPress={() => setAddModalVisible(true)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.subServicesGridContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.subServicesGrid}>
            {serviceDetails && serviceDetails.length > 0 ? (
              serviceDetails.map((serviceDetail, index) => (
                <View
                  key={serviceDetail._id || serviceDetail.id || index}
                  style={styles.cardWrapper}
                >
                  <ServiceDetailCard
                    serviceDetail={serviceDetail}
                    onOptionsPress={handleOptionSelect}
                    onAddPress={handleAddPress}
                  />
                </View>
              ))
            ) : (
              <Text style={styles.noSubServicesText}>
                No sub-services available for this service.
              </Text>
            )}
          </View>
        </ScrollView>

        <AddSubServiceModal
          visible={addModalVisible}
          onClose={() => {
            setAddModalVisible(false);
            setIsEditing(false);
            setSelectedServiceDetail(null);
          }}
          onAddSubService={handleAddServiceDetail}
          onUpdateSubService={handleUpdateServiceDetail}
          initialSubServiceData={isEditing ? selectedServiceDetail : null}
        />
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1e1f20ff',
  },
  mainContent: {
    flex: 1,
    paddingTop: height * 0.03,
    paddingRight: width * 0.03,
    paddingLeft: 0,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    marginBottom: height * 0.02,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: width * 0.035,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 10,
  },
  scrollView: {
    flex: 1,
  },
  subServicesGridContainer: {
    paddingBottom: height * 0.05,
  },
  subServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.02,
  },
  cardWrapper: {
    width: '48%',
    marginBottom: height * 0.02,
  },
  noSubServicesText: {
    color: '#A9A9A9',
    fontSize: width * 0.025,
    textAlign: 'center',
    marginTop: height * 0.05,
  },
  cardContainer: {
    backgroundColor: '#1f1f1f',
    height: normalize(190),
    borderRadius: normalize(6),
    padding: normalize(20),
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  cardImage: {
    width: normalize(120),
    height: normalize(120),
    borderRadius: normalize(8),
    marginRight: normalize(8),
    resizeMode: 'cover',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
  },
  cardTitle: {
    fontSize: normalize(19),
    fontWeight: 'bold',
    color: '#fff',
  },
  cardDescription: {
    color: '#ccc',
    fontSize: normalize(19),
  },
  cardPrice: {
    color: '#FFD700',
    fontSize: normalize(19),
    fontWeight: 'bold',
    marginTop: 'auto',
  },
  cardActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  iconButton: {
    padding: normalize(5),
  },
});

export default SubServicesScreen;
