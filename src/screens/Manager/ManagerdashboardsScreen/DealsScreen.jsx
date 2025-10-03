import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NotificationBell from '../../../components/NotificationBell';
import { useNavigation } from '@react-navigation/native';
import { getDeals } from '../../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Import your local images
import bridalDealImage from '../../../assets/images/makeup.jpeg';
import keratinImage from '../../../assets/images/hair.jpeg';
import studentDiscountImage from '../../../assets/images/product.jpeg';
import colorBundleImage from '../../../assets/images/eyeshadow.jpeg';
const userProfileImagePlaceholder = require('../../../assets/images/logo.png');

// Helper function to get image based on deal name
const getDealImageFallback = dealName => {
  switch (dealName) {
    case 'Bridal Deal & Spa':
      return bridalDealImage;
    case 'Keratin Treatment':
    case 'Complete Hair Care':
      return keratinImage;
    case 'Student Discounts':
    case 'Spa Day Package':
      return studentDiscountImage;
    case 'Colour Bundle':
      return colorBundleImage;
    default:
      return userProfileImagePlaceholder;
  }
};

const DealCard = ({ deal, onAddToCartPress }) => {
  let imageSource = null;

  const imageUri = deal?.image || deal?.dealImage;

  if (
    typeof imageUri === 'string' &&
    (imageUri.startsWith('http://') ||
      imageUri.startsWith('https://') ||
      imageUri.startsWith('file://'))
  ) {
    // Case 1: Valid URI (http/https/file)
    imageSource = { uri: imageUri };
  }
  // 🚫 REMOVED: The problematic 'else if (typeof imageUri === 'number')' block
  // API se number nahi aana chahiye. Agar aayega toh use fallback pe bhej denge.

  if (!imageSource) {
    // Case 2: Use fallback image if API image is not a valid string URI or is empty/null/number.
    imageSource = getDealImageFallback(deal.name || deal.dealName);
  }

  // Final check to ensure imageSource is not null before rendering
  if (!imageSource) {
    // If even fallback fails (shouldn't happen with require), set to null to render No Image box
    imageSource = null;
  }

  return (
    <View style={styles.dealCard}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.dealImage}
          resizeMode="cover"
          onError={error => console.log('Manager Image load error:', error)}
        />
      ) : (
        <View style={styles.dealImageNoImage}>
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}
      <View style={styles.dealInfo}>
        <View>
          <Text style={styles.dealName}>
            {deal.name || deal.dealName || 'No Name'}
          </Text>
          {deal.description ? (
            <Text style={styles.dealDescription}>{deal.description}</Text>
          ) : (
            <Text style={styles.dealDescription}>
              No description available.
            </Text>
          )}
          <Text style={styles.dealPriceLabel}>
            Price:{' '}
            <Text style={styles.dealPriceValue}>PKR {deal.price || 'N/A'}</Text>
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={() => onAddToCartPress(deal)}
      >
        <Text style={styles.addToCartButtonText}>Add To Cart</Text>
      </TouchableOpacity>
      {deal.isHiddenFromEmployee && (
        <View style={styles.hiddenBadge}>
          <Text style={styles.hiddenBadgeText}>Hidden</Text>
        </View>
      )}
    </View>
  );
};

const DealsScreen = () => {
  const navigation = useNavigation();

  const [deals, setDeals] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    userName: 'Guest',
    userProfileImage: userProfileImagePlaceholder,
  });

  // Updated profile image source logic to handle API/local images
  const profileImageSource =
    typeof userData.userProfileImage === 'string' &&
    (userData.userProfileImage.startsWith('http://') ||
      userData.userProfileImage.startsWith('https://'))
      ? { uri: userData.userProfileImage }
      : userProfileImagePlaceholder;

  // Load user data from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const managerAuth = await AsyncStorage.getItem('managerAuth');
        const adminAuth = await AsyncStorage.getItem('adminAuth');

        if (managerAuth) {
          const parsedData = JSON.parse(managerAuth);
          if (parsedData.token && parsedData.isAuthenticated) {
            setUserData({
              userName: parsedData.manager.name,
              userProfileImage: parsedData.manager.livePicture,
            });
          } else {
            Alert.alert('Authentication Error', 'Please login again.', [
              {
                text: 'OK',
                onPress: () => navigation.replace('RoleSelection'),
              },
            ]);
          }
        } else if (adminAuth) {
          const parsedData = JSON.parse(adminAuth);
          if (parsedData.token && parsedData.isAuthenticated) {
            setUserData({
              userName: parsedData.admin.name,
              userProfileImage: parsedData.admin.livePicture,
            });
          } else {
            Alert.alert('Authentication Error', 'Please login again.', [
              {
                text: 'OK',
                onPress: () => navigation.replace('RoleSelection'),
              },
            ]);
          }
        } else {
          Alert.alert('Authentication Error', 'Please login again.', [
            {
              text: 'OK',
              onPress: () => navigation.replace('RoleSelection'),
            },
          ]);
        }
      } catch (e) {
        console.error('Failed to load user data from storage:', e);
        Alert.alert('Authentication Error', 'Please login again.', [
          {
            text: 'OK',
            onPress: () => navigation.replace('RoleSelection'),
          },
        ]);
      }
    };

    loadUserData();
  }, []);

  const fetchDeals = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        // Get auth token
        const managerAuth = await AsyncStorage.getItem('managerAuth');
        const adminAuth = await AsyncStorage.getItem('adminAuth');

        let authToken = null;
        if (managerAuth) {
          const parsed = JSON.parse(managerAuth);
          if (parsed.token && parsed.isAuthenticated) {
            authToken = parsed.token;
          }
        } else if (adminAuth) {
          const parsed = JSON.parse(adminAuth);
          if (parsed.token && parsed.isAuthenticated) {
            authToken = parsed.token;
          }
        }

        if (!authToken) {
          Alert.alert('Authentication Error', 'Please login again.', [
            {
              text: 'OK',
              onPress: () => navigation.replace('RoleSelection'),
            },
          ]);
          return;
        }

        const response = await getDeals(authToken);
        console.log('Manager Fetched deals response:', response);

        if (response.success && response.deals) {
          console.log('Manager Deals data:', response.deals);
          setDeals(response.deals);
        } else if (Array.isArray(response)) {
          console.log('Manager Deals array data:', response);
          setDeals(response);
        } else {
          console.log('No deals found or invalid response format');
          setDeals([]);
        }
      } catch (error) {
        console.error('Error fetching deals:', error);
        setError('Failed to load deals. Please try again.');
        setDeals([]);
      } finally {
        setLoading(false);
      }
    },
    [
      // FIX 1: Removed 'authToken' from dependency array
    ],
  );

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleAddToCart = deal => {
    const isAlreadyAdded = cartItems.some(
      item =>
        (item.id === deal._id || item.id === deal.id) &&
        item.dealName === (deal.name || deal.dealName),
    );

    if (isAlreadyAdded) {
      Alert.alert(
        'Already Added',
        `${deal.name || deal.dealName} is already in the cart.`,
      );
      navigation.navigate('CartDealsScreen', {
        cartItems,
        sourcePanel: 'manager',
      });
    } else {
      const dealToAdd = {
        id: deal._id || deal.id,
        dealName: deal.name || deal.dealName,
        dealImage: deal.image,
        price: deal.price,
        description: deal.description,
      };

      const updatedCart = [...cartItems, dealToAdd];
      setCartItems(updatedCart);

      Alert.alert(
        'Added to Cart',
        `${deal.name || deal.dealName} has been added.`,
      );

      navigation.navigate('CartDealsScreen', {
        cartItems: updatedCart,
        sourcePanel: 'manager',
      });
    }
  };

  const dealsToDisplay = deals.filter(deal => !deal.isHiddenFromEmployee);

  useEffect(() => {
    if (deals.length > 0) {
      console.log('Manager All deals data:', deals);
    }
  }, [deals]);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.mainContent}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDeals}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Hello 👋</Text>
              <Text style={styles.userName}>
                {userData.userName || 'Guest'}
              </Text>
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
            <NotificationBell containerStyle={styles.notificationButton} />
            <Image
              source={profileImageSource}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
        </View>
        <View style={styles.servicesHeader}>
          <Text style={styles.servicesTitle}>Deals</Text>
        </View>

        {/* Deals Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A99226" />
            <Text style={styles.loadingText}>Loading Deals...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.dealsGridContainer}>
            <View style={styles.dealsGrid}>
              {dealsToDisplay.length > 0 ? (
                dealsToDisplay.map(deal => (
                  <DealCard
                    key={deal._id || deal.id}
                    deal={deal}
                    onAddToCartPress={handleAddToCart}
                  />
                ))
              ) : (
                <Text style={styles.noDealsText}>No deals available.</Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

// Layout constants - UPDATED FOR 2 CARDS PER ROW
const CARD_SPACING = 11;
const NUM_COLUMNS = 2; // Changed to 2 cards per row
const SCREEN_WIDTH = Dimensions.get('window').width;

// Main content area width is 70% of screen width.
const MAIN_CONTENT_WIDTH = SCREEN_WIDTH * 0.8;

// Calculate the card width based on the new main content width.
const CARD_WIDTH =
  (MAIN_CONTENT_WIDTH - CARD_SPACING * (NUM_COLUMNS + 6)) / NUM_COLUMNS;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1e1f20ff',
  },
  mainContent: {
    flex: 1,
    paddingTop: height * 0.03,
    paddingHorizontal: CARD_SPACING,
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
    marginLeft: width * 0.0001,
    marginRight: width * 0.0001,
  },
  userInfo: {
    marginRight: width * 0.16,
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
    paddingHorizontal: width * 0.0003,
    flex: 1,
    height: height * 0.035,
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
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.03,
    marginHorizontal: width * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    paddingBottom: height * 0.04,
  },
  servicesTitle: {
    fontSize: width * 0.035,
    fontWeight: 'bold',
    color: '#fff',
  },
  dealsGridContainer: {
    paddingBottom: height * 0.05,
    paddingHorizontal: CARD_SPACING, // Add padding to container
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: CARD_SPACING, // Use gap for consistent spacing
  },
  dealCard: {
    width: CARD_WIDTH,
    height: 'auto',
    minHeight: height * 0.33,
    backgroundColor: '#3C3C3C',
    borderRadius: 12,
    marginBottom: CARD_SPACING,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  dealImage: {
    width: '100%',
    height: CARD_WIDTH * 0.8,
  },
  dealImageNoImage: {
    width: '100%',
    height: CARD_WIDTH * 0.6,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#fff',
    fontSize: width * 0.02,
    fontWeight: '600',
  },
  dealInfo: {
    padding: width * 0.02,
    justifyContent: 'space-between',
    flex: 1,
  },
  dealName: {
    color: '#fff',
    fontSize: width * 0.025,
    fontWeight: 'bold',
    marginBottom: height * 0.005,
  },
  dealDescription: {
    color: '#A9A9A9',
    fontSize: width * 0.018,
    marginBottom: height * 0.01,
    lineHeight: width * 0.025,
  },
  dealPriceLabel: {
    color: '#A9A9A9',
    fontSize: width * 0.018,
    marginBottom: height * 0.01,
  },
  dealPriceValue: {
    color: '#A99226',
    fontWeight: 'bold',
  },
  addToCartButton: {
    backgroundColor: '#A99226',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.02,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: width * 0.02,
    marginBottom: width * 0.02,
    marginTop: 'auto', // Push to the bottom
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: width * 0.018,
    fontWeight: '600',
  },
  hiddenBadge: {
    position: 'absolute',
    top: width * 0.02,
    right: width * 0.02,
    backgroundColor: '#ff4444',
    paddingVertical: height * 0.005,
    paddingHorizontal: width * 0.015,
    borderRadius: 4,
  },
  hiddenBadgeText: {
    color: '#fff',
    fontSize: width * 0.015,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: width * 0.025,
    marginTop: height * 0.02,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: width * 0.02,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#A99226',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: width * 0.018,
    fontWeight: '600',
  },
  noDealsText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
    textAlign: 'center',
    marginTop: height * 0.1,
    width: '100%',
  },
});

export default DealsScreen;
