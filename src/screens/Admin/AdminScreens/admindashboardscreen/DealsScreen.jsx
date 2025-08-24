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
import { useUser } from '../../../../context/UserContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // useFocusEffect bhi import karein

// Import API functions
import { getDeals, addDeal, updateDeal, deleteDeal } from '../../../../api';

// Assuming these modal files will be created/adapted similar to product ones
import AddDealModal from './modals/AddDealModal';
import DealOptionsModal from './modals/DealOptionsModal';
import DealDetailModal from './modals/DealDetailModal';
import ConfirmationModal from './modals/ConfirmationModal';

const { width, height } = Dimensions.get('window');

// Import your local images (ensure these paths are correct for your project structure)
import bridalDealImage from '../../../../assets/images/makeup.jpeg';
import keratinImage from '../../../../assets/images/hair.jpeg';
import studentDiscountImage from '../../../../assets/images/product.jpeg';
import colorBundleImage from '../../../../assets/images/eyeshadow.jpeg';
const userProfileImagePlaceholder = require('../../../../assets/images/foundation.jpeg');

const initialStaticDealsData = [
  {
    id: 'static-d1',
    dealName: 'Bridal Deal & Spa',
    dealImage: bridalDealImage,
    price: '1200',
    description: 'Luxurious package for brides including spa treatments.',
    isStatic: true,
    isHiddenFromEmployee: false,
  },
  {
    id: 'static-d2',
    dealName: 'Keratin Treatment',
    dealImage: keratinImage,
    price: '1200',
    description:
      'Smooth and frizz-free hair with our premium keratin treatment.',
    isStatic: true,
    isHiddenFromEmployee: false,
  },
  {
    id: 'static-d3',
    dealName: 'Student Discounts',
    dealImage: studentDiscountImage,
    price: '1200',
    description: 'Special offers for students on various salon services.',
    isStatic: true,
    isHiddenFromEmployee: false,
  },
  {
    id: 'static-d4',
    dealName: 'Colour Bundle',
    dealImage: colorBundleImage,
    price: '268',
    description: 'Get a complete hair coloring package with highlights.',
    isStatic: true,
    isHiddenFromEmployee: false,
  },
  {
    id: 'static-d5',
    dealName: 'Complete Hair Care',
    dealImage: colorBundleImage,
    price: '999',
    description: 'Shampoo, conditioner, and styling.',
    isStatic: true,
    isHiddenFromEmployee: false,
  },
  {
    id: 'static-d6',
    dealImage: studentDiscountImage,
    dealName: 'Spa Day Package',
    price: '1500',
    description: 'Full body massage and facial.',
    isStatic: true,
    isHiddenFromEmployee: false,
  },
];

const DealCard = ({ deal, onOptionsPress, onPress, onAddToCartPress }) => {
  let imageSource = null;

  // Handle image source for both backend and frontend data
  if (deal.image || deal.dealImage) {
    const imageUri = deal.image || deal.dealImage;
    if (typeof imageUri === 'string' && imageUri.length > 0) {
      // For backend images (URLs)
      imageSource = { uri: imageUri };
    } else if (typeof imageUri === 'number') {
      // For local assets
      imageSource = imageUri;
    }
  }

  console.log('Admin DealCard image source:', {
    dealName: deal.name || deal.dealName,
    image: deal.image,
    dealImage: deal.dealImage,
    imageSource: imageSource,
    imageType: typeof (deal.image || deal.dealImage),
  });

  return (
    <TouchableOpacity style={styles.dealCard} onPress={() => onPress(deal)}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.dealImage}
          resizeMode="cover"
          onError={error => console.log('Admin Image load error:', error)}
          onLoad={() =>
            console.log(
              'Admin Image loaded successfully for:',
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
            <Text style={styles.dealPriceValue}>${deal.price || 'N/A'}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => onAddToCartPress(deal)}
        >
          <Text style={styles.addToCartButtonText}>Add To Cart</Text>
        </TouchableOpacity>
      </View>

      {deal.isHiddenFromEmployee && (
        <View style={styles.hiddenBadge}>
          <Text style={styles.hiddenBadgeText}>Hidden</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.cardOptionsButton}
        onPress={event => onOptionsPress(event, deal)}
      >
        <Ionicons name="ellipsis-vertical" size={width * 0.025} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const DealsScreen = () => {
  const { userName, isLoading, authToken } = useUser();
  const navigation = useNavigation();

  // Deals state ko yahan manage karein
  const [deals, setDeals] = useState([]);
  const [cartItems, setCartItems] = useState([]); // Cart ka state yahan rakhein
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals states
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [dealToEdit, setDealToEdit] = useState(null);

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [optionsModalPosition, setOptionsModalPosition] = useState({
    top: 0,
    left: 0,
  });
  const [selectedDeal, setSelectedDeal] = useState(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);

  // Custom Alert Modal States
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertAction, setCustomAlertAction] = useState(null);

  const showCustomAlert = (message, action = null) => {
    setCustomAlertMessage(message);
    setCustomAlertAction(() => action);
    setCustomAlertVisible(true);
  };

  const hideCustomAlert = () => {
    setCustomAlertVisible(false);
    setCustomAlertMessage('');
    if (customAlertAction) {
      customAlertAction();
      setCustomAlertAction(null);
    }
  };

  // Fetch deals from backend
  const fetchDeals = useCallback(async () => {
    // if (!authToken) return; // temporarily removed for testing

    setLoading(true);
    setError(null);

    try {
      const response = await getDeals(authToken);
      console.log('Admin Fetched deals response:', response);

      if (response.success && response.deals) {
        console.log('Admin Deals data:', response.deals);
        console.log('Admin First deal image check:', response.deals[0]?.image);
        setDeals(response.deals);
      } else if (Array.isArray(response)) {
        // Handle case where response is directly an array
        console.log('Admin Deals array data:', response);
        console.log('Admin First deal image check:', response[0]?.image);
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

  // Yeh function CartDealsScreen se wapas aane par chalega
  const updateCartAfterReturn = useCallback(updatedCart => {
    setCartItems(updatedCart); // DealsScreen mein cart ka state update karein
  }, []);

  // Jab screen focus mein aaye to cart ko update karein
  useFocusEffect(
    useCallback(() => {
      // Check karein ki kya CartDealsScreen se cart data wapas aaya hai
      const updatedCart = navigation
        .getState()
        .routes.find(route => route.name === 'CartDealsScreen')
        ?.params?.updatedCart;
      if (updatedCart) {
        setCartItems(updatedCart);
        // Parameters ko saaf karein taake dobara na chal jaye
        navigation.setParams({ updatedCart: undefined });
      }
    }, [navigation]),
  );

  const handleCloseModal = () => {
    setAddEditModalVisible(false);
    setDealToEdit(null);
  };

  const handleSaveDeal = async dealData => {
    // if (!authToken) { // temporarily removed for testing
    //   showCustomAlert('Authentication required. Please login again.');
    //   return;
    // }

    setLoading(true);

    try {
      console.log('Saving deal with data:', dealData);
      console.log('Deal to edit:', dealToEdit);

      if (dealToEdit && dealToEdit.id) {
        // Update existing deal - use the correct ID
        console.log('Updating deal with ID:', dealToEdit.id);
        const updateResponse = await updateDeal(
          dealToEdit.id,
          dealData,
          authToken,
        );
        console.log('Update response:', updateResponse);
        showCustomAlert('Deal updated successfully!');
      } else {
        // Add new deal
        console.log('Adding new deal');
        const addResponse = await addDeal(dealData, authToken);
        console.log('Add response:', addResponse);
        showCustomAlert('Deal added successfully!');
      }

      // Refresh deals list
      await fetchDeals();

      handleCloseModal();
    } catch (error) {
      console.error('Error saving deal:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.status,
        data: error.data,
      });

      // Show more specific error message
      let errorMessage = 'Failed to save deal';
      if (error.message) {
        if (error.message.includes('Validation error')) {
          errorMessage = `Validation error: ${
            error.message.split('Validation error:')[1] || error.message
          }`;
        } else if (error.message.includes('Missing required fields')) {
          errorMessage = 'Please fill in all required fields (name and price)';
        } else if (error.message.includes('File upload failed')) {
          errorMessage = 'Image upload failed. Please try again.';
        } else if (error.message.includes('Deal not found')) {
          errorMessage = 'Deal not found. Please refresh and try again.';
        } else if (
          error.message.includes('Image upload service not available')
        ) {
          errorMessage =
            'Image upload service is currently unavailable. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }

      showCustomAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCardOptionsPress = (event, deal) => {
    setSelectedDeal(deal);
    const buttonX = event.nativeEvent.pageX;
    const buttonY = event.nativeEvent.pageY;
    const modalWidth = width * 0.15;
    const modalHeight = height * 0.2;

    let left = buttonX - modalWidth + 20;
    let top = buttonY - 10;
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left + modalWidth > width) left = width - modalWidth - 10;
    if (top + modalHeight > height) top = height - modalHeight - 10;

    setOptionsModalPosition({ top, left });
    setOptionsModalVisible(true);
  };

  const handleOptionSelect = option => {
    setOptionsModalVisible(false);
    if (!selectedDeal) return;

    switch (option) {
      case 'view':
        setDetailModalVisible(true);
        break;
      case 'edit':
        // Map the deal data to match AddDealModal's expected structure
        const mappedDealData = {
          id: selectedDeal._id || selectedDeal.id,
          dealName: selectedDeal.name || selectedDeal.dealName,
          dealImage: selectedDeal.image,
          price: selectedDeal.price,
          description: selectedDeal.description,
          isHiddenFromEmployee: selectedDeal.isHiddenFromEmployee || false,
        };
        setDealToEdit(mappedDealData);
        setAddEditModalVisible(true);
        break;
      case 'delete':
        setDealToDelete(selectedDeal);
        setConfirmModalVisible(true);
        break;
      case 'hide':
        // This would need to be implemented in the backend
        showCustomAlert('Hide/Show functionality will be implemented soon.');
        break;
      default:
        break;
    }
  };

  // 'Add to Cart' function ko update karein
  const handleAddToCart = deal => {
    const isAlreadyAdded = cartItems.some(
      item => item.id === deal._id || item.id === deal.id,
    );
    if (isAlreadyAdded) {
      Alert.alert(
        'Already Added',
        `${deal.name || deal.dealName} is already in the cart.`,
      );
      // Agar pehle se maujood hai to sirf navigate karein
      navigation.navigate('CartDealsScreen', { cartItems });
    } else {
      // Nayi deal add karke navigate karein
      const dealToAdd = {
        id: deal._id || deal.id,
        dealName: deal.name || deal.dealName,
        dealImage: deal.image,
        price: deal.price,
        description: deal.description,
      };
      const updatedCart = [...cartItems, dealToAdd];
      setCartItems(updatedCart); // DealsScreen mein cart ka state update karein
      Alert.alert(
        'Added to Cart',
        `${deal.name || deal.dealName} has been added.`,
      );
      navigation.navigate('CartDealsScreen', { cartItems: updatedCart });
    }
  };

  const confirmDeleteDeal = async () => {
    // if (!dealToDelete || !authToken) { // temporarily removed for testing
    //   showCustomAlert(
    //     'Invalid deal selected for deletion or authentication required.',
    //   );
    //   setConfirmModalVisible(false);
    //   return;
    // }

    setLoading(true);

    try {
      // Use the correct ID field
      const dealId = dealToDelete._id || dealToDelete.id;
      await deleteDeal(dealId, authToken);
      showCustomAlert('Deal deleted successfully!');

      // Refresh deals list
      await fetchDeals();

      setDealToDelete(null);
      setConfirmModalVisible(false);
    } catch (error) {
      console.error('Error deleting deal:', error);
      showCustomAlert(`Failed to delete deal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDealCardPress = deal => {
    setSelectedDeal(deal);
    setDetailModalVisible(true);
  };

  const dealsToDisplay = deals.filter(deal => !deal.isHiddenFromEmployee);

  // Debug logging for deals data
  useEffect(() => {
    if (deals.length > 0) {
      console.log('Admin All deals data:', deals);
      deals.forEach((deal, index) => {
        console.log(`Admin Deal ${index + 1}:`, {
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
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Hello 👋</Text>
              <Text style={styles.userName}>{userName || 'Guest'}</Text>
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
                size={width * 0.041}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialCommunityIcons
                name="alarm"
                size={width * 0.041}
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

        <View style={styles.dealsHeader}>
          <Text style={styles.dealsTitle}>Deals</Text>
          <TouchableOpacity
            style={styles.addNewDealButton}
            onPress={() => {
              setDealToEdit(null);
              setAddEditModalVisible(true);
            }}
          >
            <Text style={styles.addNewDealButtonText}>Add New Deal</Text>
          </TouchableOpacity>
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
                    onOptionsPress={handleCardOptionsPress}
                    onPress={handleDealCardPress}
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

      <AddDealModal
        visible={addEditModalVisible}
        onClose={handleCloseModal}
        onSave={handleSaveDeal}
        initialDealData={dealToEdit}
      />
      <DealOptionsModal
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        onSelectOption={handleOptionSelect}
        position={optionsModalPosition}
      />
      <DealDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        deal={selectedDeal}
      />
      <ConfirmationModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={confirmDeleteDeal}
        message={`Are you sure you want to delete "${
          dealToDelete?.name || dealToDelete?.dealName
        }"? This action cannot be undone.`}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={customAlertVisible}
        onRequestClose={hideCustomAlert}
      >
        <View style={styles.customAlertCenteredView}>
          <View style={styles.customAlertModalView}>
            <Text style={styles.customAlertModalText}>
              {customAlertMessage}
            </Text>
            <TouchableOpacity
              style={styles.customAlertCloseButton}
              onPress={hideCustomAlert}
            >
              <Text style={styles.customAlertCloseButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles ko unchanged rakhein
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
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.02,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.01,
  },
  greeting: {
    color: '#fff',
    fontSize: width * 0.025,
    fontWeight: '600',
  },
  userName: {
    color: '#A99226',
    fontSize: width * 0.025,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C3C3C',
    borderRadius: 8,
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.01,
    flex: 1,
    marginLeft: width * 0.05,
    marginRight: width * 0.05,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: width * 0.02,
    paddingVertical: height * 0.005,
  },
  searchIcon: {
    marginLeft: width * 0.01,
  },
  notificationButton: {
    padding: width * 0.01,
  },
  profileImage: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: (width * 0.08) / 2,
    borderWidth: 2,
    borderColor: '#A99226',
  },
  dealsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: height * 0.03,
  },
  dealsTitle: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  addNewDealButton: {
    backgroundColor: '#A99226',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addNewDealButtonText: {
    color: '#fff',
    fontSize: width * 0.02,
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
    width: CARD_WIDTH,
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
    marginTop: height * 0.01,
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
  cardOptionsButton: {
    position: 'absolute',
    top: width * 0.02,
    right: width * 0.02,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    padding: width * 0.01,
  },
  customAlertCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  customAlertModalView: {
    backgroundColor: '#3C3C3C',
    borderRadius: 12,
    padding: width * 0.05,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: width * 0.8,
  },
  customAlertModalText: {
    color: '#fff',
    fontSize: width * 0.025,
    textAlign: 'center',
    marginBottom: height * 0.03,
  },
  customAlertCloseButton: {
    backgroundColor: '#A99226',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.08,
    borderRadius: 8,
  },
  customAlertCloseButtonText: {
    color: '#fff',
    fontSize: width * 0.02,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: width * 0.025,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#A99226',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: width * 0.02,
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
