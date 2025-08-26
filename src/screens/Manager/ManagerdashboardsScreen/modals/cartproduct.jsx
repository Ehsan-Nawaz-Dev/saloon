import React, { useState, useEffect } from 'react';
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
  Alert, // Import Alert for user feedback
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../../../context/UserContext';
import Sidebar from '../../../../components/ManagerSidebar';
import { useNavigation, useRoute } from '@react-navigation/native';

// Import all modal components
import CheckoutModal from './CheckoutModal';
import AddCustomServiceModal from './AddCustomProductModal';
import PrintBillModal from './PrintBillModal';

// Images for default/fallback, similar to Submarket
import userProfileImage from '../../../../assets/images/kit.jpeg';
import womanBluntCutImage from '../../../../assets/images/coconut.jpeg';
import bobLobCutImage from '../../../../assets/images/growth.jpeg';
import mediumLengthLayerImage from '../../../../assets/images/onion.jpeg';
import vShapedCutImage from '../../../../assets/images/oil.jpeg';
import layerCutImage from '../../../../assets/images/growth.jpeg';

// Dimensions and Scaling for Tablet
const { width } = Dimensions.get('window');
const scale = width / 1280;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

// Helper function to get image based on service name (copied from Submarket for consistency)
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

const Cartproduct = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userName, isLoading } = useUser();

  // The state should start as an empty array
  // Naya product hum useEffect mein add karenge
  const [services, setServices] = useState([]);

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

  // **IMPORTANT FIX:** Yeh useEffect hook 'route.params' mein tabdeeli ko monitor karega
  useEffect(() => {
    // Handle both parameter names for backward compatibility
    const productToAdd =
      route.params?.productToAdd || route.params?.selectedProduct;
    if (productToAdd) {
      // Naye product ko services array mein add karo
      setServices(prevServices => {
        // Pehle check karein ke product pehle se मौजूद to nahi
        const isAlreadyAdded = prevServices.some(p => p.id === productToAdd.id);
        if (!isAlreadyAdded) {
          Alert.alert(
            'Success',
            `${
              productToAdd.productDetailName || productToAdd.name
            } has been added to the cart.`,
          );
          return [...prevServices, productToAdd];
        }
        return prevServices; // Agar pehle se hai to wahi array wapas do
      });

      // Navigation params ko clear kar do taa ke next time screen khule to dobara add na ho
      navigation.setParams({
        productToAdd: undefined,
        selectedProduct: undefined,
      });
    }
  }, [route.params?.productToAdd, route.params?.selectedProduct, navigation]);

  // **IMPORTANT ADDITION:** A function to handle saving a new custom service
  const handleSaveCustomService = newService => {
    // Create a unique ID for the new service
    const serviceWithId = {
      ...newService,
      id: Date.now().toString(),
      service: 'Custom Service',
    };

    // Add the new service to the beginning of the services array
    setServices(prevServices => [serviceWithId, ...prevServices]);

    // Close the modal
    setCustomServiceModalVisible(false);
    // Show an alert to the user for confirmation
    Alert.alert('Success', 'Custom service added successfully!');
  };

  // Function to handle deleting a service from the cart
  const handleDeleteService = serviceId => {
    setServices(prevServices =>
      prevServices.filter(service => (service.id || service._id) !== serviceId),
    );
  };

  // Calculate subtotal and total based on the 'services' state
  // Ensure price is treated as a number
  const subtotal = services.reduce(
    (sum, service) => sum + (Number(service.price) || 0),
    0,
  );
  const discountAmount = parseFloat(discount) || 0;
  const totalPrice = subtotal - discountAmount;

  // Function to handle the transition to the print bill modal
  const handleOpenPrintBill = () => {
    // 1. Create the billData object using all the state variables
    const newBillData = {
      clientName: clientName,
      phoneNumber: phoneNumber,
      notes: notes,
      services: services, // Pass the actual services in the cart
      subtotal: subtotal,
      discount: discountAmount,
      totalPrice: totalPrice,
    };

    // 2. Set the billData state
    setBillData(newBillData);

    // 3. Close the CheckoutModal and open the PrintBillModal
    setCheckoutModalVisible(false);
    setPrintBillModalVisible(true);
  };

  // Handle checkout button press with validation
  const handleCheckout = () => {
    if (clientName.trim() === '' || phoneNumber.trim() === '') {
      Alert.alert(
        'Incomplete Information',
        'Please fill in the client name and phone number before checking out.',
      );
      return;
    }
    if (services.length === 0) {
      Alert.alert(
        'Empty Cart',
        'Please add at least one service to the cart before checking out.',
      );
      return;
    }
    setCheckoutModalVisible(true);
  };

  // Helper function to handle image source for profile cards
  const getProductImageSource = product => {
    // Check if product.image exists AND it is a string
    if (product.image && typeof product.image === 'string') {
      return { uri: product.image };
    }
    // Agar image URL nahi hai, to fallback image use karein
    return getSubServiceImage(product.subServiceName || product.name);
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
      {/* Sidebar is a separate component and remains fixed */}
      <Sidebar
        navigation={navigation}
        userName={userName}
        activeTab="Services"
      />
      <View style={styles.mainContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userInfoContainer}>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.userName}>Manager</Text>
          </View>
          <View style={styles.searchBarContainer}>
            <Ionicons
              name="search"
              size={normalize(20)}
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
              size={normalize(24)}
              color="#fff"
            />
          </TouchableOpacity>
          <Image
            source={userProfileImage}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </View>

        {/* Main Cart Content with ScrollView */}
        <ScrollView style={styles.contentArea}>
          {/* Profile Cards Row */}
          <View style={styles.profileCardsRow}>
            {services.length > 0 ? (
              services.map((service, index) => (
                <View
                  key={service.id || service._id || index}
                  style={styles.profileCard}
                >
                  <View style={styles.profileImageWrapper}>
                    <Image
                      source={getProductImageSource(service)}
                      style={styles.profileCardImage}
                    />
                    <View style={styles.onlineIndicator} />
                  </View>
                  <View style={styles.profileTextWrapper}>
                    <Text style={styles.profileName}>
                      {service.subServiceName || service.name || 'N/A'}
                    </Text>
                    <Text style={styles.profileService}>
                      {service.service || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.cardPriceContainer}>
                    <Text style={styles.cardDescription}>
                      {service.time || service.duration || 'N/A'}
                    </Text>
                    <Text style={styles.cardPrice}>
                      PKR {Number(service.price || 0).toFixed(2)}
                    </Text>
                  </View>
                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      handleDeleteService(service.id || service._id)
                    }
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
              <Text style={styles.noServicesText}>
                No services added to cart.
              </Text>
            )}
          </View>

          {/* Input Fields Section */}
          <View style={styles.inputSection}>
            <View style={styles.inputRow}>
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
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Add"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
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

        {/* Checkout Footer Section */}
        <View style={styles.checkoutFooter}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>
              Total ({services.length} Services)
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

      {/* Modals */}
      <CheckoutModal
        isVisible={checkoutModalVisible}
        onClose={() => setCheckoutModalVisible(false)}
        subtotal={subtotal}
        discount={discountAmount}
        servicesCount={services.length}
        onConfirmOrder={handleOpenPrintBill}
      />

      {/* Change: onServiceSave prop ko yahan add kiya hai */}
      <AddCustomServiceModal
        isVisible={customServiceModalVisible}
        onClose={() => setCustomServiceModalVisible(false)}
        onServiceSave={handleSaveCustomService}
      />

      {/* Pass the new billData state to the PrintBillModal */}
      <PrintBillModal
        isVisible={printBillModalVisible}
        onClose={() => setPrintBillModalVisible(false)}
        billData={billData}
      />
    </View>
  );
};

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
    paddingHorizontal: normalize(50),
    flex: 0.5,
    height: normalize(100),
    marginBottom: normalize(60),
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
  contentArea: {
    flex: 1,
  },
  profileCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Added this line to wrap cards if they don't fit
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
    minWidth: '48%', // A good width for two cards in a row
    maxWidth: '48%', // Ensures max width doesn't exceed 50%
    justifyContent: 'space-between',
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
    marginLeft: normalize(15),
  },
});

export default Cartproduct;
