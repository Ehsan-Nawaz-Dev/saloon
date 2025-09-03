// src/screens/admin/MarketplaceScreen.js

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
import { useUser } from '../../../../context/UserContext';
import AddProductModal from './modals/AddProductModal';
import ProductOptionsModal from './modals/ProductOptionsModal';
import ProductDetailModal from './modals/ProductDetailModal'; // Your existing detail modal
import ConfirmationModal from './modals/ConfirmationModal';
import { useNavigation } from '@react-navigation/native';
import StandardHeader from '../../../../components/StandardHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import API functions
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
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

// Import your local images (paths remain same, as requested)
import haircutImage from '../../../../assets/images/makeup.jpeg';
import manicureImage from '../../../../assets/images/hair.jpeg';
import pedicureImage from '../../../../assets/images/product.jpeg';
import hairColoringImage from '../../../../assets/images/eyeshadow.jpeg';
import userProfileImage from '../../../../assets/images/foundation.jpeg';
const userProfileImagePlaceholder = require('../../../../assets/images/foundation.jpeg');

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

// ProductCard component to display individual product
const ProductCard = ({ product, onOptionsPress, onPress }) => {
  // Get image source with proper fallback logic
  let imageSource = null;

  // First try to get the actual image from product
  if (product?.image) {
    imageSource = getDisplayImageSource(product.image);
  }

  // If no valid image found, use a default fallback
  if (!imageSource) {
    imageSource = haircutImage; // Only as last resort
  }

  console.log('ProductCard image source for', product?.name, ':', imageSource);

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onPress(product)}
    >
      <Image
        source={imageSource}
        style={styles.productImage}
        resizeMode="cover"
      />
      <Text style={styles.productName}>{product.name}</Text>
      {product.isHiddenFromEmployee && (
        <View style={styles.hiddenBadge}>
          <Text style={styles.hiddenBadgeText}>Hidden</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.cardOptionsButton}
        onPress={event => onOptionsPress(event, product)}
      >
        <Ionicons name="ellipsis-vertical" size={width * 0.022} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const MarketplaceScreen = () => {
  const navigation = useNavigation();
  const { userName } = useUser();

  // State for products data and loading status
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [optionsModalPosition, setOptionsModalPosition] = useState({
    top: 0,
    left: 0,
  });
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false); // State for your ProductDetailModal

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Function to fetch all products from the backend API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Get token from AsyncStorage
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      const data = await getProducts(token);
      setProducts(data);
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

  // Function to handle saving a new product or updating an existing one
  const handleSaveProduct = async productData => {
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

      if (productToEdit) {
        // It's an edit operation - use the id from the mapped data
        console.log('Editing product with ID:', productToEdit.id);
        await updateProduct(productToEdit.id, productData, token);
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        // It's an add operation
        console.log('Adding new product');
        await addProduct(productData, token);
        Alert.alert('Success', 'Product added successfully!');
      }
      fetchProducts(); // Refresh the products list
    } catch (e) {
      console.error('Error saving product:', e);
      console.error('Error details:', {
        message: e.message,
        response: e.response?.data,
        status: e.response?.status,
      });
      Alert.alert('Error', e.message || 'Failed to save the product.');
    }
    setAddEditModalVisible(false);
    setProductToEdit(null);
  };

  // Function to handle opening the ProductOptionsModal
  const handleCardOptionsPress = (event, product) => {
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
    setSelectedProduct(product);
    setOptionsModalVisible(true);
  };

  // Function to handle selection of an option from ProductOptionsModal
  const handleOptionSelect = option => {
    setOptionsModalVisible(false); // Always close options modal
    if (!selectedProduct) return;

    switch (option) {
      case 'view':
        // Set the product to be viewed and open the ProductDetailModal
        // The ProductDetailModal should use the 'selectedProduct' state
        setDetailModalVisible(true);
        break;
      case 'edit':
        // Map the backend data structure to match what AddProductModal expects
        const mappedProductData = {
          id: selectedProduct._id,
          productName: selectedProduct.name,
          productImage: selectedProduct.image,
          productDetails: selectedProduct.subProducts
            ? selectedProduct.subProducts.map(sub => ({
                productDetailName: sub.name,
                price: sub.price,
                time: sub.time,
                description: sub.description,
                productDetailImage: sub.image,
              }))
            : [],
          isHiddenFromEmployee: selectedProduct.isHiddenFromEmployee || false,
        };
        setProductToEdit(mappedProductData);
        setAddEditModalVisible(true);
        break;
      case 'delete':
        setProductToDelete(selectedProduct);
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
    // No need to clear selectedProduct immediately here if other modals still need it.
    // It's cleared when respective modals close or when a new product is selected.
  };

  // Function to confirm deletion
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
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

      await deleteProduct(productToDelete._id, token);
      Alert.alert('Success', 'Product deleted successfully!');
      fetchProducts(); // Refresh the products list
    } catch (e) {
      console.error('Error deleting product:', e);
      Alert.alert('Error', e.message || 'Failed to delete the product.');
    }
    setProductToDelete(null);
    setConfirmModalVisible(false);
  };

  // Function to handle navigation to SubMarketplaceScreen
  const handleProductCardPress = product => {
    navigation.navigate('SubMarketplace', { product: product });
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

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header Section */}
        <StandardHeader />
        {/* Products Title and Add New Products Button */}
        <View style={styles.productsHeader}>
          <Text style={styles.productsTitle}>Products</Text>
          <TouchableOpacity
            style={styles.addNewProductsButton}
            onPress={() => {
              setProductToEdit(null);
              setAddEditModalVisible(true);
            }}
          >
            <Text style={styles.addNewProductsButtonText}>
              Add New Products
            </Text>
          </TouchableOpacity>
        </View>

        {/* Products Grid */}
        <ScrollView contentContainerStyle={styles.productsGridContainer}>
          <View style={styles.productsGrid}>
            {products.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                onOptionsPress={handleCardOptionsPress}
                onPress={handleProductCardPress}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Modals */}
      <AddProductModal
        visible={addEditModalVisible}
        onClose={() => setAddEditModalVisible(false)}
        onSave={handleSaveProduct}
        initialProductData={productToEdit}
      />
      <ProductOptionsModal
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        onSelectOption={handleOptionSelect}
        position={optionsModalPosition}
      />
      {/* THIS IS THE MODAL FOR VIEWING PRODUCT DETAILS */}
      <ProductDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        product={selectedProduct} // Pass the selected product to the ProductDetailModal
      />
      <ConfirmationModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={confirmDeleteProduct}
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
      />
    </View>
  );
};

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

  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.03,
    marginHorizontal: width * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    paddingBottom: height * 0.03,
  },
  productsTitle: {
    fontSize: width * 0.035,
    fontWeight: 'bold',
    color: '#fff',
  },
  addNewProductsButton: {
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
  addNewProductsButtonText: {
    color: '#fff',
    fontSize: width * 0.018,
    fontWeight: '600',
  },
  productsGridContainer: {
    paddingBottom: height * 0.05,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  productCard: {
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
  productImage: {
    width: 122,
    height: 190,
    borderRadius: 4.9,
    marginBottom: height * 0.01,
  },
  productName: {
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

export default MarketplaceScreen;
