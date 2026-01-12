import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  PixelRatio,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../../context/UserContext';
import Sidebar from '../../../components/ManagerSidebar';
import { useNavigation, useRoute } from '@react-navigation/native';
import StandardHeader from '../../../components/StandardHeader';

import userProfileImage from '../../../assets/images/kit.jpeg';
import womanBluntCutImage from '../../../assets/images/coconut.jpeg';
import bobLobCutImage from '../../../assets/images/growth.jpeg';
import mediumLengthLayerImage from '../../../assets/images/onion.jpeg';
import vShapedCutImage from '../../../assets/images/oil.jpeg';
import layerCutImage from '../../../assets/images/growth.jpeg';

const { width, height } = Dimensions.get('window');

const scale = width / 1280;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

// Helper function to get image source
const getDisplayImageSource = image => {
  if (typeof image === 'string' && (image.startsWith('http') || image.startsWith('file') || image.startsWith('data'))) {
    return { uri: image };
  } else if (typeof image === 'number') {
    return image;
  }
  return null;
};

const getSubServiceImage = subServiceName => {
  switch (subServiceName) {
    case 'Standard Haircut':
    case 'Standard Haircut Kit':
      return womanBluntCutImage;
    case 'Layered Cut':
    case 'Layered Cut Scissors Set':
      return layerCutImage;
    case 'Kids Haircut':
    case 'Kids Hair Clipper':
      return bobLobCutImage;
    default:
      return userProfileImage;
  }
};

// Updated SubServiceCard to match Admin "Row" Style
const SubServiceCard = ({ subService, onAddToCartPress }) => {
  const serviceName = subService?.name || subService?.subServiceName || 'N/A';
  const servicePrice = subService?.price != null ? String(subService.price) : 'N/A';

  // Logic to get image source matches admin exactly
  let imageSource = getDisplayImageSource(subService?.image || subService?.productDetailImage);
  if (!imageSource) {
    imageSource = getSubServiceImage(serviceName);
  }

  return (
    <View style={styles.cardContainer}>
      <View style={styles.imageWrapper}>
        <Image source={imageSource} style={styles.cardImage} />
        <Text style={styles.overlayName} numberOfLines={1} ellipsizeMode="tail">
          {serviceName}
        </Text>
        <Text style={styles.overlayPrice}>{`PKR ${servicePrice}`}</Text>
      </View>
      
      <View style={styles.cardInfo}>
        {/* Placeholder for center content if needed, matches Admin structure */}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => onAddToCartPress(subService)}
          style={styles.iconButton}
        >
          <Ionicons 
            name="add-circle-outline" 
            size={normalize(34)} 
            color="#FFD700" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Submarket = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const product = route.params?.product || route.params?.service || {};
  const { userName, isLoading } = useUser();
  const [subServices, setSubServices] = useState([]);

  useEffect(() => {
    if (product && Array.isArray(product.subProducts)) {
      setSubServices(product.subProducts);
    } else if (product && Array.isArray(product.subServices)) {
      setSubServices(product.subServices);
    } else {
      setSubServices([]);
    }
  }, [product]);

  const onAddToCart = subService => {
    navigation.navigate('Cartproduct', {
      productToAdd: subService,
      sourcePanel: 'manager',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Sidebar
        navigation={navigation}
        userName={userName}
        activeTab="Marketplaces"
      />
      <View style={styles.mainContent}>
        <StandardHeader
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.subServicesGridContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.subServicesGrid}>
            <Text style={styles.headerTitleText}>
                {product.name || 'Sub Products'}
            </Text>
            {subServices && subServices.length > 0 ? (
              subServices.map((subService, index) => (
                <View 
                  key={subService._id || subService.id || index}
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
    backgroundColor: '#1e1f20ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1f20ff',
  },
  loadingText: {
    color: '#fff',
    fontSize: normalize(20),
  },
  mainContent: {
    flex: 1,
    paddingTop: height * 0.03,
    paddingRight: width * 0.03,
    paddingLeft: 0,
  },
  headerTitleText: {
    fontSize: width * 0.025,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: height * 0.02,
    marginLeft: normalize(10),
  },
  scrollView: {
    flex: 1,
  },
  subServicesGridContainer: {
    paddingBottom: height * 0.05,
  },
  subServicesGrid: {
    flexDirection: 'column',
    paddingHorizontal: width * 0.02,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: height * 0.02,
  },
  cardContainer: {
    backgroundColor: '#1f1f1f',
    borderRadius: normalize(6),
    paddingHorizontal: normalize(14),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
    height: height * 0.08, // Same height as Admin
  },
  imageWrapper: {
    position: 'relative',
    marginRight: normalize(12),
    height: '100%',
    justifyContent: 'center',
  },
  cardImage: {
    width: normalize(160), // Same width as Admin
    height: '100%',
    borderRadius: normalize(8),
    resizeMode: 'cover',
  },
  overlayName: {
    position: 'absolute',
    top: normalize(8),
    left: normalize(180),
    color: '#fff',
    fontWeight: 'bold',
    fontSize: normalize(20),
  },
  overlayPrice: {
    position: 'absolute',
    bottom: normalize(22),
    left: normalize(180),
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: normalize(18),
  },
  cardInfo: {
    flex: 1,
    height: '100%',
  },
  cardActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  iconButton: {
    padding: normalize(8),
  },
  noSubServicesText: {
    color: '#A9A9A9',
    fontSize: width * 0.025,
    textAlign: 'center',
    marginTop: height * 0.05,
  },
});

export default Submarket;