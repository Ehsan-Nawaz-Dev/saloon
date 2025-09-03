import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  PixelRatio,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../../../context/UserContext';
import Sidebar from '../../../../components/ManagerSidebar';
import { useNavigation, useRoute } from '@react-navigation/native';
import StandardHeader from '../../../../components/StandardHeader';
import { generateClientFromBill } from '../../../../api/clients';

// Import all modal components (assuming these are shared)
import CheckoutModal from './CheckoutModal';
import AddCustomServiceModal from './AddCustomDealModal';
import PrintBillModal from './PrintBillModal';

// Images for default/fallback, similar to DealsScreen
import userProfileImagePlaceholder from '../../../../assets/images/foundation.jpeg';
import bridalDealImage from '../../../../assets/images/makeup.jpeg';
import keratinImage from '../../../../assets/images/hair.jpeg';
import studentDiscountImage from '../../../../assets/images/product.jpeg';
import colorBundleImage from '../../../../assets/images/eyeshadow.jpeg';

// Dimensions and Scaling for Tablet
const { width } = Dimensions.get('window');
const scale = width / 1280;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

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
      return userProfileImagePlaceholder;
  }
};

const CartDealsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userName, isLoading } = useUser();
  const sourcePanel = route.params?.sourcePanel || 'manager';

  // Ab dealsInCart state ko navigation params se initialize karein
  const [dealsInCart, setDealsInCart] = useState(route.params?.cartItems || []);

  // Update cart state when route params change
  useEffect(() => {
    if (route.params?.cartItems) {
      setDealsInCart(route.params.cartItems);
    }
  }, [route.params?.cartItems]);

  // Handle back navigation properly
  const handleBackPress = () => {
    if (sourcePanel === 'admin') {
      navigation.replace('AdminMainDashboard');
    } else {
      // Pass updated cart data back to DealsScreen
      navigation.navigate({
        name: 'DealsScreen',
        params: { updatedCart: dealsInCart },
        merge: true,
      });
    }
  };

  // Use useFocusEffect to handle screen focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Update cart when screen comes into focus
      if (route.params?.cartItems) {
        setDealsInCart(route.params.cartItems);
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.cartItems]);

  // State to control modal visibility
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [customServiceModalVisible, setCustomServiceModalVisible] =
    useState(false);
  const [printBillModalVisible, setPrintBillModalVisible] = useState(false);

  // New state to hold the bill data object
  const [billData, setBillData] = useState(null);

  // State to hold form input values
  const [discount, setDiscount] = useState('');
  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [beautician, setBeautician] = useState('');
  const [gst, setGst] = useState('');

  const subtotal = dealsInCart.reduce(
    (sum, deal) => sum + (Number(deal.price) || 0),
    0,
  );
  const gstAmount = parseFloat(gst) || 0;
  const discountAmount = parseFloat(discount) || 0;
  const totalPrice = subtotal + gstAmount - discountAmount;

  // Function to handle saving a new custom deal
  const handleSaveCustomDeal = newDealData => {
    const newDealWithId = {
      ...newDealData,
      id: `custom-${Date.now()}`,
      dealName: newDealData.name,
      price: newDealData.price,
      description: newDealData.description,
      dealImage: newDealData.image,
    };
    setDealsInCart(currentDeals => [...currentDeals, newDealWithId]);
    setCustomServiceModalVisible(false);
    Alert.alert('Success', `${newDealData.name} has been added to the cart.`);
  };

  // Function to handle deleting a deal from the cart
  const handleDeleteDeal = dealId => {
    setDealsInCart(dealsInCart.filter(deal => deal.id !== dealId));
    Alert.alert('Removed', 'Deal has been removed from the cart.');
  };

  const handleOpenPrintBill = async () => {
    try {
      const newBillData = {
        clientName: clientName,
        phoneNumber: phoneNumber,
        notes: notes,
        beautician: beautician,
        services: dealsInCart.map(deal => ({
          id: deal.id,
          name: deal.dealName,
          price: Number(deal.price || 0),
          description: deal.description,
        })),
        subtotal: subtotal,
        gst: gstAmount,
        discount: discountAmount,
        totalPrice: totalPrice,
      };

      setBillData(newBillData);

      // Auto-generate client from bill data
      try {
        const clientResult = await generateClientFromBill(newBillData);
        if (clientResult.success) {
          if (clientResult.isNew) {
            Alert.alert(
              'New Client Created',
              `Client "${clientName}" has been automatically added to your clients list.`,
            );
          } else {
            Alert.alert(
              'Existing Client',
              `Client "${clientName}" already exists in your clients list.`,
            );
          }
        }
      } catch (clientError) {
        console.error('Error generating client:', clientError);
        // Don't block bill generation if client creation fails
        Alert.alert(
          'Warning',
          'Bill generated successfully, but there was an issue saving client data.',
        );
      }

      setCheckoutModalVisible(false);
      setPrintBillModalVisible(true);
    } catch (error) {
      console.error('Error in handleOpenPrintBill:', error);
      Alert.alert('Error', 'Failed to generate bill. Please try again.');
    }
  };

  const handleCheckout = () => {
    if (clientName.trim() === '' || phoneNumber.trim() === '') {
      Alert.alert(
        'Incomplete Information',
        'Please fill in the client name and phone number before checking out.',
      );
      return;
    }
    if (dealsInCart.length === 0) {
      Alert.alert(
        'Empty Cart',
        'Please add at least one deal to the cart before checking out.',
      );
      return;
    }
    setCheckoutModalVisible(true);
  };

  const getDealImageSource = deal => {
    if (
      typeof deal.dealImage === 'string' &&
      (deal.dealImage.startsWith('http') || deal.dealImage.startsWith('data:'))
    ) {
      return { uri: deal.dealImage };
    }
    if (typeof deal.dealImage === 'number') {
      return deal.dealImage;
    }
    if (typeof deal.image === 'string') {
      return { uri: deal.image };
    }
    return getDealImageFallback(deal.dealName);
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
      <Sidebar navigation={navigation} userName={userName} activeTab="Deals" />
      <View style={styles.mainContent}>
        <StandardHeader showBackButton={true} sourcePanel={sourcePanel} />

        <ScrollView style={styles.contentArea}>
          <View style={styles.profileCardsRow}>
            {dealsInCart.length > 0 ? (
              dealsInCart.map((deal, index) => (
                <View key={deal.id || index} style={styles.profileCard}>
                  <View style={styles.profileImageWrapper}>
                    <Image
                      source={getDealImageSource(deal)}
                      style={styles.profileCardImage}
                    />
                    <View style={styles.onlineIndicator} />
                  </View>
                  <View style={styles.profileTextWrapper}>
                    <Text style={styles.profileName}>
                      {deal.dealName || deal.name || 'N/A'}
                    </Text>
                    <Text style={styles.profileService}>
                      {deal.description || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.cardPriceContainer}>
                    <Text style={styles.cardDescription}>Deal</Text>
                    <Text style={styles.cardPrice}>
                      PKR {Number(deal.price || 0).toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteDeal(deal.id)}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={normalize(30)}
                      color="#FF6347"
                    />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noServicesText}>No deals added to cart.</Text>
            )}
          </View>

          <View style={styles.inputSection}>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>GST</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Add GST Amount"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={gst}
                  onChangeText={setGst}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Discount</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Add Discount"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Add Client Name"
                  placeholderTextColor="#666"
                  value={clientName}
                  onChangeText={setClientName}
                />
              </View>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Add Phone Number"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Beautician</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Add Beautician Name"
                  placeholderTextColor="#666"
                  value={beautician}
                  onChangeText={setBeautician}
                />
              </View>
            </View>
            <View style={styles.notesContainer}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.inputField, styles.notesInput]}
                placeholder="Type your notes here"
                placeholderTextColor="#666"
                multiline={true}
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.addCustomServiceButton}
            onPress={() => setCustomServiceModalVisible(true)}
          >
            <Text style={styles.addCustomServiceButtonText}>
              + Add Custom Service
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.checkoutFooter}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>
              Total ({dealsInCart.length} Deals)
            </Text>
            <Text style={styles.totalPrice}>PKR {totalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CheckoutModal
        isVisible={checkoutModalVisible}
        onClose={() => setCheckoutModalVisible(false)}
        subtotal={subtotal}
        gst={gstAmount}
        discount={discountAmount}
        servicesCount={dealsInCart.length}
        beautician={beautician}
        onConfirmOrder={handleOpenPrintBill}
      />

      <AddCustomServiceModal
        isVisible={customServiceModalVisible}
        onClose={() => setCustomServiceModalVisible(false)}
        onServiceSave={handleSaveCustomDeal}
      />

      <PrintBillModal
        isVisible={printBillModalVisible}
        onClose={() => setPrintBillModalVisible(false)}
        billData={billData}
      />
    </View>
  );
};

// Styles ko unchanged rakhein
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#161719',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161719',
  },
  loadingText: {
    color: '#fff',
    fontSize: normalize(20),
  },
  mainContent: {
    flex: 1,
    paddingTop: normalize(30),
    paddingHorizontal: normalize(40),
    backgroundColor: '#161719',
  },

  contentArea: {
    flex: 1,
  },
  profileCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: normalize(40),
    gap: normalize(15),
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    borderRadius: normalize(10),
    padding: normalize(25),
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
    justifyContent: 'space-between',
    position: 'relative',
  },
  profileImageWrapper: {
    position: 'relative',
    marginRight: normalize(15),
  },
  profileCardImage: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(100),
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
    backgroundColor: '#34C759',
    borderWidth: normalize(2),
    borderColor: '#2A2D32',
  },
  profileTextWrapper: {
    flex: 1,
    marginRight: normalize(10),
  },
  profileName: {
    fontSize: normalize(27),
    fontWeight: 'bold',
    color: '#fff',
  },
  profileService: {
    fontSize: normalize(19),
    color: '#888',
    marginTop: normalize(5),
  },
  cardPriceContainer: {
    alignItems: 'flex-end',
  },
  cardDescription: {
    color: '#ccc',
    fontSize: normalize(18),
  },
  cardPrice: {
    color: '#FFD700',
    fontSize: normalize(21),
    fontWeight: 'bold',
    marginTop: normalize(5),
  },
  inputSection: {
    backgroundColor: '#2A2D32',
    borderRadius: normalize(10),
    padding: normalize(20),
    marginBottom: normalize(20),
  },
  inputRow: {
    flexDirection: 'row',
    gap: normalize(15),
    marginBottom: normalize(50),
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: normalize(33),
    color: '#faf9f6ff',
    marginBottom: normalize(16),
  },
  inputField: {
    backgroundColor: '#424449ff',
    borderRadius: normalize(8),
    paddingHorizontal: normalize(19),
    paddingVertical: normalize(10),
    height: normalize(75),
    color: '#fff',
    fontSize: normalize(28),
  },
  notesContainer: {
    marginBottom: normalize(50),
  },
  notesInput: {
    height: normalize(500),
    fontSize: normalize(35),
    textAlignVertical: 'top',
  },
  addCustomServiceButton: {
    backgroundColor: '#2A2D32',
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: '#444',
    padding: normalize(15),
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  addCustomServiceButtonText: {
    fontSize: normalize(24),
    paddingVertical: normalize(10),
    color: '#faf9f6ff',
    fontWeight: 'bold',
  },
  checkoutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2D32',
    borderRadius: normalize(10),
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(15),
    marginTop: 'auto',
  },
  totalInfo: {
    flexDirection: 'column',
  },
  totalLabel: {
    fontSize: normalize(19),
    color: '#888',
  },
  totalPrice: {
    fontSize: normalize(24),
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: normalize(5),
  },
  checkoutButton: {
    backgroundColor: '#fce14bff',
    paddingHorizontal: normalize(290),
    paddingVertical: normalize(25),
    borderRadius: normalize(18),
  },
  checkoutButtonText: {
    fontSize: normalize(25),
    fontWeight: 'bold',
    color: '#161719',
  },
  noServicesText: {
    color: '#A9A9A9',
    fontSize: normalize(22),
    textAlign: 'center',
    width: '100%',
    marginTop: normalize(50),
  },
  deleteButton: {
    position: 'absolute',
    top: normalize(10),
    right: normalize(10),
  },
});

export default CartDealsScreen;
