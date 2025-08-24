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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../../context/UserContext';
import Sidebar from '../../../components/ManagerSidebar'; // Ensure this path is correct
import { useNavigation, useRoute } from '@react-navigation/native';

import userProfileImage from '../../../assets/images/kit.jpeg';
import womanBluntCutImage from '../../../assets/images/coconut.jpeg';
import bobLobCutImage from '../../../assets/images/growth.jpeg';
import mediumLengthLayerImage from '../../../assets/images/onion.jpeg';
import vShapedCutImage from '../../../assets/images/oil.jpeg';
import layerCutImage from '../../../assets/images/growth.jpeg';

const { width } = Dimensions.get('window');

const scale = width / 1280;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

// Helper function to get image source (local asset or URI)
const getDisplayImageSource = image => {
  if (typeof image === 'string' && image.startsWith('http')) {
    return { uri: image };
  } else if (typeof image === 'number') {
    return image;
  }
  // Fallback to local image if no valid image source
  return userProfileImage;
};

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
  // Handle both backend structure (name) and frontend structure (subServiceName)
  const serviceName = subService?.name || subService?.subServiceName || 'N/A';
  const serviceTime = subService?.time || 'N/A';
  const servicePrice =
    subService?.price != null ? String(subService.price) : 'N/A';

  // Use backend image if available, otherwise fallback to local mapping
  const imageSource =
    getDisplayImageSource(subService?.image) || getSubServiceImage(serviceName);

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
        <Text style={styles.cardPrice}>{`$${servicePrice}`}</Text>
      </View>
      {/* This is the + button that navigates to Cartproduct */}
      <TouchableOpacity
        onPress={() => onAddToCartPress(subService)}
        style={styles.addButton}
      >
        <Ionicons name="add-circle" size={normalize(45)} color="#FFD700" />
      </TouchableOpacity>
    </View>
  );
};

const Submarket = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Handle both 'service' and 'product' route params for backward compatibility
  const product = route.params?.product || route.params?.service || {};

  const { userName, isLoading } = useUser();
  const [subServices, setSubServices] = useState([]);

  useEffect(() => {
    // Handle both backend structure (subProducts) and frontend structure (subServices)
    if (product && Array.isArray(product.subProducts)) {
      setSubServices(product.subProducts);
    } else if (product && Array.isArray(product.subServices)) {
      setSubServices(product.subServices);
    } else {
      setSubServices([]);
    }
  }, [product]);

  // This function is correctly set up to navigate to Cartproduct
  const onAddToCart = subService => {
    navigation.navigate('Cartproduct', { productToAdd: subService });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sidebar is correctly positioned on the left */}
      <Sidebar
        navigation={navigation}
        userName={userName}
        activeTab="Marketplaces"
      />
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <View style={styles.userInfoContainer}>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.userName}>{userName || 'Guest'}</Text>
          </View>
          <View style={styles.searchBarContainer}>
            <Ionicons
              name="search"
              size={normalize(33)}
              color="#A9A9A9"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search anything"
              placeholderTextColor="#A9A9A9"
            />
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons
              name="notifications-outline"
              size={normalize(28)}
              color="#fff"
            />
          </TouchableOpacity>
          <Image
            source={userProfileImage}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </View>

        <ScrollView contentContainerStyle={styles.subServicesGridContainer}>
          <View style={styles.subServicesGrid}>
            {subServices && subServices.length > 0 ? (
              subServices.map((subService, index) => (
                <View // Removed TouchableOpacity wrapper here
                  key={subService._id || subService.id || index}
                  style={styles.cardWrapper}
                >
                  <SubServiceCard
                    subService={subService}
                    onAddToCartPress={onAddToCart} // This is the correct prop for the + button
                  />
                </View>
              ))
            ) : (
              <Text style={styles.noSubServicesText}>
                No sub-products available for this product.
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
  },
  mainContent: {
    flex: 1,
    paddingTop: normalize(50),
    paddingRight: normalize(40),
    paddingLeft: normalize(30),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: normalize(50),
    marginRight: normalize(20),
  },
  userInfoContainer: {
    flex: 0.25,
  },
  greeting: {
    fontSize: normalize(28),
    color: '#A9A9A9',
  },
  userName: {
    fontSize: normalize(30),
    fontWeight: 'bold',
    color: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    borderRadius: normalize(10),
    paddingHorizontal: normalize(30),
    flex: 0.5,
    height: normalize(150),
  },
  searchIcon: {
    marginRight: normalize(10),
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: normalize(25),
  },
  notificationButton: {
    backgroundColor: '#161719',
    borderRadius: normalize(10),
    padding: normalize(12),
    marginLeft: normalize(20),
  },
  profileImage: {
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(70) / 2,
    marginLeft: normalize(20),
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
    width: '48%', // Adjusted for two columns with gap
    marginBottom: normalize(25),
  },
  cardContainer: {
    flex: 1,
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
  addButton: {
    alignSelf: 'flex-end',
    marginTop: 'auto',
  },
  noSubServicesText: {
    color: '#A9A9A9',
    fontSize: normalize(28),
    textAlign: 'center',
    marginTop: normalize(90),
    width: '100%',
  },
});

export default Submarket;
