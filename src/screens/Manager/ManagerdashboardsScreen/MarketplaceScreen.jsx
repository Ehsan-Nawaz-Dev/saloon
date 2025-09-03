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
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../../context/UserContext';

// Helper function to truncate username to 6 words maximum
const truncateUsername = username => {
  if (!username) return 'Guest';
  const words = username.split(' ');
  if (words.length <= 6) return username;
  return words.slice(0, 6).join(' ') + '...';
};
import AddServiceModal from './modals/AddServiceModal';
import ServiceDetailModal from './modals/ServiceDetailModal';
import ConfirmationModal from './modals/ConfirmationModal';
import { useNavigation } from '@react-navigation/native';
// Import Sidebar component
import Sidebar from '../../../components/ManagerSidebar';
// Import API functions
import { getProducts } from '../../../api';

const { width, height } = Dimensions.get('window');

// Import your local images
import haircutImage from '../../../assets/images/makeup.jpeg';
import manicureImage from '../../../assets/images/hair.jpeg';
import pedicureImage from '../../../assets/images/product.jpeg';
import hairColoringImage from '../../../assets/images/eyeshadow.jpeg';
const userProfileImagePlaceholder = require('../../../assets/images/logo.png');

// Helper function to get image source (local asset or URI)
const getDisplayImageSource = image => {
  if (typeof image === 'string' && image.startsWith('http')) {
    return { uri: image };
  } else if (typeof image === 'number') {
    return image;
  }
  // Fallback to local image if no valid image source
  return haircutImage;
};

// ProductCard component to display individual product (read-only for managers)
const ProductCard = ({ product, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onPress(product)}
    >
      {product.image ? (
        <Image
          source={getDisplayImageSource(product.image)}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.noProductImage}>
          <Ionicons name="image-outline" size={40} color="#999" />
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}
      <Text style={styles.productName}>{product.name}</Text>
      {product.isHiddenFromEmployee && (
        <View style={styles.hiddenBadge}>
          <Text style={styles.hiddenBadgeText}>Hidden</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const Marketplace = () => {
  const navigation = useNavigation();
  const { userName, userEmail, userPassword, isLoading } = useUser();

  // State for products data and loading status
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Function to fetch all products from the backend API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Get token from AsyncStorage
      const authData = await AsyncStorage.getItem('managerAuth');
      if (!authData) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      // Parse the auth data to get token (optional for products)
      let token = null;
      try {
        const parsedData = JSON.parse(authData);
        token = parsedData.token;
      } catch (error) {
        console.log('⚠️ Could not parse auth data, proceeding without token');
      }

      console.log(
        '🔍 Fetching products with token:',
        token ? 'Token available' : 'No token',
      );
      const data = await getProducts(token);
      console.log('✅ Products fetched successfully:', data);
      setProducts(data.data || data || []);
      setError(null);
    } catch (e) {
      console.error('Error fetching products:', e);
      setError(
        e.message ||
          'Failed to load products. Please ensure your backend server is running and the IP address is correct.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Function to handle navigation to Submarket screen
  const handleProductCardPress = product => {
    navigation.navigate('Submarket', { product: product });
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A99226" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Content Section - Placed on the right */}
      <View style={styles.mainContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Hello 👋</Text>
              <Text style={styles.userName}>{truncateUsername(userName)}</Text>
            </View>
            <View style={styles.searchBarContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search anything"
                placeholderTextColor="#A9A9A9"
              />
              <Ionicons
                name="search"
                size={width * 0.027}
                color="#A9A9A9"
                style={styles.searchIcon}
              />
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={width * 0.035}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialCommunityIcons
                name="alarm"
                size={width * 0.035}
                color="#fff"
              />
            </TouchableOpacity>
            <Image
              source={userProfileImagePlaceholder}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Products Grid */}
        <ScrollView contentContainerStyle={styles.productsGridContainer}>
          <View style={styles.productsGrid}>
            {products.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                onPress={handleProductCardPress}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Product Detail Modal Component */}
      <ServiceDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        service={selectedProduct}
      />
    </View>
  );
};
export default Marketplace;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row', // Added to arrange children horizontally
    backgroundColor: '#1e1f20ff',
    // Removed paddingTop, paddingRight, paddingLeft from here as they will be on mainContent
  },
  mainContent: {
    // New style for the right-side content
    flex: 1, // Takes up remaining space
    paddingTop: height * 0.03,
    paddingRight: width * 0.03,
    paddingLeft: 0, // This should align with the sidebar's right edge
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    marginBottom: height * 0.02,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: width * 0.02,
  },
  userInfo: {
    marginRight: width * 0.1,
  },
  greeting: {
    fontSize: width * 0.019,
    color: '#A9A9A9',
  },
  userName: {
    fontSize: width * 0.03,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    borderRadius: 10,
    paddingHorizontal: width * 0.001,
    flex: 1,
    height: height * 0.04,
    width: width * 0.5,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  searchIcon: {
    marginRight: width * 0.01,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: width * 0.021,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: width * 0.01,
  },
  notificationButton: {
    backgroundColor: '#2A2D32',
    borderRadius: 8,
    padding: width * 0.000001,
    marginRight: width * 0.015,
    height: width * 0.058,
    width: width * 0.058,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: width * 0.058,
    height: width * 0.058,
    borderRadius: (width * 0.058) / 2,
  },
  productsGridContainer: {
    paddingBottom: height * 0.05,
    paddingHorizontal: width * 0.01,
    flexGrow: 1,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  productCard: {
    backgroundColor: '#3C3C3C',
    borderRadius: 3,
    width: 121,
    height: 260,
    marginRight: width * 0.01,
    marginBottom: height * 0.015,
    overflow: 'hidden',
    paddingBottom: height * 0.01,
    position: 'relative',
  },
  productImage: {
    width: 120,
    height: 200,
    borderRadius: 4.9,
    marginBottom: height * 0.01,
  },
  noProductImage: {
    width: 102,
    height: 120,
    borderRadius: 4.9,
    marginBottom: height * 0.01,
    backgroundColor: '#2c2c2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: width * 0.015,
    marginTop: 5,
  },
  productName: {
    color: '#fff',
    fontSize: width * 0.018,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: width * 0.01,
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
