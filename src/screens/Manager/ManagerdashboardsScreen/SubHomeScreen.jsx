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
  PixelRatio,
  Alert, // Alert import for error handling
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../../context/UserContext';
import Sidebar from '../../../components/ManagerSidebar';
import { useNavigation, useRoute } from '@react-navigation/native';
import StandardHeader from '../../../components/StandardHeader';
// Import centralized API functions
import { getServiceById } from '../../../api';

import userProfileImage from '../../../assets/images/cut.jpeg';
import womanBluntCutImage from '../../../assets/images/cut.jpeg';
import bobLobCutImage from '../../../assets/images/color.jpeg';
import mediumLengthLayerImage from '../../../assets/images/haircut.jpeg';
import vShapedCutImage from '../../../assets/images/manicure.jpeg';
import layerCutImage from '../../../assets/images/pedicure.jpeg';

const { width } = Dimensions.get('window');

const scale = width / 1280;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

const getSubServiceImage = subServiceName => {
  switch (subServiceName) {
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
    default:
      return userProfileImage;
  }
};

const SubServiceCard = ({ subService, onAddToCartPress }) => {
  // Get sub-service name from different possible fields
  const getSubServiceName = () => {
    return subService?.subServiceName || subService?.name || 'N/A';
  };

  // Get sub-service time
  const getSubServiceTime = () => {
    return subService?.time || 'N/A';
  };

  // Get sub-service price
  const getSubServicePrice = () => {
    return subService?.price != null ? String(subService.price) : 'N/A';
  };

  // Get image source
  const getImageSource = () => {
    // Check for subServiceImage field first (from AddServiceModal)
    if (subService?.subServiceImage) {
      return { uri: subService.subServiceImage };
    }
    // Check for image field
    if (subService?.image) {
      return { uri: subService.image };
    }
    // Fallback to default image based on service name
    return getSubServiceImage(getSubServiceName());
  };

  const serviceName = getSubServiceName();
  const serviceTime = getSubServiceTime();
  const servicePrice = getSubServicePrice();
  const imageSource = getImageSource();

  return (
    <View style={styles.cardContainer}>
      <Image source={imageSource} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
          {serviceName}
        </Text>
        <Text
          style={styles.cardDescription}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {serviceTime}
        </Text>
        <Text style={styles.cardPrice}>{`PKR ${servicePrice}`}</Text>
      </View>
      <TouchableOpacity
        onPress={() => onAddToCartPress(subService)}
        style={styles.addButton}
      >
        <Ionicons name="add-circle" size={normalize(45)} color="#FFD700" />
      </TouchableOpacity>
    </View>
  );
};

const SubHome = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const service = route.params?.service || {};

  const { userName, isLoading } = useUser();
  const [subServices, setSubServices] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (service && Array.isArray(service.subServices)) {
      setSubServices(service.subServices);
      setFetchLoading(false);
      setError(null);
      return;
    }
    const fetchById = async () => {
      try {
        if (!service || !service.id) {
          setFetchLoading(false);
          setError('No service selected');
          return;
        }
        const data = await getServiceById(service.id);
        const list = data?.service?.subServices || data?.subServices || [];
        setSubServices(list);
        setError(null);
      } catch (e) {
        console.error('Error fetching sub-services:', e);
        setSubServices([]);
        setError('Failed to fetch sub-services. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchById();
  }, [service]);

  const onAddToCart = subService => {
    navigation.navigate('CartService', {
      selectedService: subService,
      sourcePanel: 'manager',
    });
  };

  if (isLoading || fetchLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A98C27" />
        <Text style={styles.loadingText}>Loading sub-services...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setFetchLoading(true);
            setError(null);
            // Re-fetch the data
            if (service && service.id) {
              getServiceById(service.id)
                .then(data => {
                  const list =
                    data?.service?.subServices || data?.subServices || [];
                  setSubServices(list);
                  setFetchLoading(false);
                })
                .catch(e => {
                  setError('Failed to fetch sub-services. Please try again.');
                  setFetchLoading(false);
                });
            }
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Sidebar
        navigation={navigation}
        userName={userName}
        activeTab="Services"
      />
      <View style={styles.mainContent}>
        <StandardHeader
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.subServicesGridContainer}>
          <View style={styles.subServicesGrid}>
            {subServices && subServices.length > 0 ? (
              subServices.map((subService, index) => (
                <View
                  key={subService.id || subService._id || index}
                  style={styles.cardWrapper}
                >
                  <SubServiceCard
                    subService={subService}
                    onAddToCartPress={onAddToCart}
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2A2D32',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
  },
  loadingText: {
    color: '#fff',
    fontSize: normalize(20),
    marginTop: normalize(10),
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: normalize(18),
    textAlign: 'center',
    marginBottom: normalize(20),
  },
  retryButton: {
    backgroundColor: '#A98C27',
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(24),
    borderRadius: normalize(8),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    paddingTop: normalize(50),
    paddingRight: normalize(40),
    paddingLeft: normalize(30),
    backgroundColor: '#161719',
  },

  subServicesGridContainer: {
    paddingBottom: normalize(60),
  },
  subServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(30),
    gap: normalize(25),
  },
  cardWrapper: {
    width: '48%',
    marginBottom: normalize(25),
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    height: normalize(130),
    borderRadius: normalize(6),
    padding: normalize(20),
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
    alignItems: 'center',
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
  addButton: {
    position: 'absolute',
    bottom: normalize(10),
    right: normalize(10),
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: normalize(30),
    padding: normalize(4),
  },
  noSubServicesText: {
    color: '#A9A9A9',
    fontSize: normalize(28),
    textAlign: 'center',
    marginTop: normalize(90),
    width: '100%',
  },
});

export default SubHome;
