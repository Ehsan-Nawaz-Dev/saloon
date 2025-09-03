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
  Modal, // Import Modal for custom alerts
  ActivityIndicator,
  Alert, // Import Alert for cart confirmation
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../../context/UserContext';

// Helper function to truncate username to 6 words maximum
const truncateUsername = username => {
  if (!username) return 'Guest';
  const words = username.split(' ');
  if (words.length <= 6) return username;
  return words.slice(0, 6).join(' ') + '...';
};
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

// Import API functions
import { getDeals } from '../../../api';

// Assuming these modal files will be created/adapted similar to product ones
// import AddDealModal from './modals/AddDealModal'; // Removed as per edit hint

const { width, height } = Dimensions.get('window');

// Import your local images (ensure these paths are correct for your project structure)
import bridalDealImage from '../../../assets/images/makeup.jpeg';
import keratinImage from '../../../assets/images/hair.jpeg';
import studentDiscountImage from '../../../assets/images/product.jpeg';
import colorBundleImage from '../../../assets/images/eyeshadow.jpeg';
const userProfileImagePlaceholder = require('../../../assets/images/foundation.jpeg');

// Helper function to get image based on deal name (for fallback only)
const getDealImageFallback = dealName => {
  switch (dealName) {
    case 'Bridal Deal & Spa':
      return bridalDealImage;
    case 'Keratin Treatment':
      return keratinImage;
    case 'Student Discounts':
      return studentDiscountImage;
    case 'Colour Bundle':
      return colorBundleImage;
    case 'Complete Hair Care':
      return colorBundleImage;
    case 'Spa Day Package':
      return studentDiscountImage;
    default:
      return userProfileImagePlaceholder; // Generic fallback
  }
};

// Static initial deals data // Removed as per edit hint
// const initialStaticDealsData = [
//   {
//     id: 'static-d1',
//     dealName: 'Bridal Deal & Spa',
//     dealImage: bridalDealImage,
//     price: 1200, // Changed to number for calculations
//     description: 'Luxurious package for brides including spa treatments.',
//     isStatic: true,
//     isHiddenFromEmployee: false,
//   },
//   {
//     id: 'static-d2',
//     dealName: 'Keratin Treatment',
//     dealImage: keratinImage,
//     price: 1200, // Changed to number
//     description:
//       'Smooth and frizz-free hair with our premium keratin treatment.',
//     isStatic: true,
//     isHiddenFromEmployee: false,
//   },
//   {
//     id: 'static-d3',
//     dealName: 'Student Discounts',
//     dealImage: studentDiscountImage,
//     price: 1200, // Changed to number
//     description: 'Special offers for students on various salon services.',
//     isStatic: true,
//     isHiddenFromEmployee: false,
//   },
//   {
//     id: 'static-d4',
//     dealName: 'Colour Bundle',
//     dealImage: colorBundleImage,
//     price: 268, // Changed to number
//     description: 'Get a complete hair coloring package with highlights.',
//     isStatic: true,
//     isHiddenFromEmployee: false,
//   },
//   {
//     id: 'static-d5',
//     dealName: 'Complete Hair Care',
//     dealImage: colorBundleImage,
//     price: 999, // Changed to number
//     description: 'Shampoo, conditioner, and styling.',
//     isStatic: true,
//     isHiddenFromEmployee: false,
//   },
//   {
//     id: 'static-d6',
//     dealImage: studentDiscountImage,
//     dealName: 'Spa Day Package',
//     price: 1500, // Changed to number
//     description: 'Full body massage and facial.',
//     isStatic: true,
//     isHiddenFromEmployee: false,
//   },
// ];

// DealCard component to display individual deal
const DealCard = ({ deal, onAddToCartPress }) => {
  // Get image source with proper fallback logic
  let imageSource = null;

  // First try to get the actual image from deal
  if (deal?.image || deal?.dealImage) {
    const imageUri = deal.image || deal.dealImage;

    // If image is a valid HTTP/HTTPS URL, return it
    if (
      typeof imageUri === 'string' &&
      (imageUri.startsWith('http://') || imageUri.startsWith('https://'))
    ) {
      console.log('Using HTTP image:', imageUri);
      imageSource = { uri: imageUri };
    }
    // If image is a local file path (starts with file://)
    else if (typeof imageUri === 'string' && imageUri.startsWith('file://')) {
      console.log('Using local file image:', imageUri);
      imageSource = { uri: imageUri };
    }
    // If image is a number (local asset), return it directly
    else if (typeof imageUri === 'number') {
      console.log('Using local asset image:', imageUri);
      imageSource = imageUri;
    }
    // If image is null, undefined, or empty string, return null
    else if (!imageUri || imageUri === '') {
      console.log('No image provided, returning null');
      imageSource = null;
    }
    // For any other case, log and return null
    else {
      console.log('Unknown image format:', imageUri, 'returning null');
      imageSource = null;
    }
  }

  // Only use fallback if no image is provided
  if (!imageSource) {
    imageSource = getDealImageFallback(deal.name || deal.dealName);
  }

  console.log(
    'Manager DealCard image source for',
    deal?.name || deal?.dealName,
    ':',
    imageSource,
  );

  return (
    <TouchableOpacity style={styles.dealCard}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.dealImage}
          resizeMode="cover"
          onError={error => console.log('Manager Image load error:', error)}
          onLoad={() =>
            console.log(
              'Manager Image loaded successfully for:',
              deal.name || deal.dealName,
            )
          }
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
      {/* Removed the three dots options button */}
    </TouchableOpacity>
  );
};

const DealsScreen = () => {
  const { userName, isLoading, authToken } = useUser();
  const navigation = useNavigation();

  // Deals state
  const [deals, setDeals] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch deals from backend
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getDeals(authToken);
      console.log('Manager Fetched deals response:', response);

      if (response.success && response.deals) {
        console.log('Manager Deals data:', response.deals);
        console.log(
          'Manager First deal image check:',
          response.deals[0]?.image,
        );
        setDeals(response.deals);
      } else if (Array.isArray(response)) {
        // Handle case where response is directly an array
        console.log('Manager Deals array data:', response);
        console.log('Manager First deal image check:', response[0]?.image);
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
  }, [authToken]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Handle Save (Add/Edit) Deal - now purely local state management
  const handleSaveDeal = dealData => {
    // For manager, we'll just show a success message
    // In a real app, you might want to refresh the deals list
    console.log('Manager: Deal would be saved:', dealData);
    // You could show a toast or alert here
  };

  // 'Add to Cart' function
  const handleAddToCart = deal => {
    // Check if deal is already in cart using proper ID comparison
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
      // Navigate to cart with current items
      navigation.navigate('CartDealsScreen', {
        cartItems,
        sourcePanel: 'manager',
      });
    } else {
      // Create a unique deal object for cart
      const dealToAdd = {
        id: deal._id || deal.id,
        dealName: deal.name || deal.dealName,
        dealImage: deal.image,
        price: deal.price,
        description: deal.description,
      };

      // Add to cart and navigate
      const updatedCart = [...cartItems, dealToAdd];
      setCartItems(updatedCart);

      Alert.alert(
        'Added to Cart',
        `${deal.name || deal.dealName} has been added.`,
      );

      // Navigate with updated cart
      navigation.navigate('CartDealsScreen', {
        cartItems: updatedCart,
        sourcePanel: 'manager',
      });
    }
  };

  // Filter deals to show only non-hidden ones
  const dealsToDisplay = deals.filter(deal => !deal.isHiddenFromEmployee);

  // Debug logging for deals data
  useEffect(() => {
    if (deals.length > 0) {
      console.log('Manager All deals data:', deals);
      deals.forEach((deal, index) => {
        console.log(`Manager Deal ${index + 1}:`, {
          name: deal.name || deal.dealName,
          image: deal.image,
          dealImage: deal.dealImage,
          imageType: typeof deal.image,
          dealImageType: typeof deal.dealImage,
        });
      });
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
                size={width * 0.037}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialCommunityIcons
                name="alarm"
                size={width * 0.037}
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

        {/* Deals Grid */}
        {loading || isLoading ? ( // Combined loading states
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
                    onAddToCartPress={handleAddToCart} // Pass the new handler
                  />
                ))
              ) : (
                <Text style={styles.noDealsText}>No deals available.</Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Removed AddDealModal and custom alert modal as per edit hint */}
    </View>
  );
};

// Update the layout constants
const CARD_SPACING = width * 0.02; // Reduced spacing
const NUM_COLUMNS = 3; // Changed back to 3 cards per row
const CARD_WIDTH = (width - CARD_SPACING * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2A2D32',
  },
  mainContent: {
    flex: 1,
    paddingTop: height * 0.03,
    paddingHorizontal: width * 0.03,
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
  dealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    paddingBottom: height * 0.03,
  },
  dealsTitle: {
    fontSize: width * 0.035,
    fontWeight: 'bold',
    color: '#fff',
  },
  addNewDealButton: {
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
  addNewDealButtonText: {
    color: '#fff',
    fontSize: width * 0.018,
    fontWeight: '600',
  },
  dealsGridContainer: {
    paddingBottom: height * 0.05,
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dealCard: {
    width: width * 0.22,
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
    flexDirection: 'column',
  },
  dealImage: {
    width: '100%',
    height: CARD_WIDTH * 0.6,
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
    marginTop: 'auto',
    marginHorizontal: width * 0.02,
    marginBottom: width * 0.02,
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
  },
});

export default DealsScreen;
