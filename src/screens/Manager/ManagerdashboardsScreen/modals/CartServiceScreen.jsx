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
  Alert,
  BackHandler,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../../../context/UserContext';
import Sidebar from '../../../../components/ManagerSidebar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { generateClientFromBill } from '../../../../api/clients';
import StandardHeader from '../../../../components/StandardHeader';

// Import all modal components
import CheckoutModal from './CheckoutModal';
import AddCustomServiceModal from './AddCustomServiceModal';
import PrintBillModal from './PrintBillModal';

// Images for default/fallback, similar to Submarket and Cartproduct
import userProfileImage from '../../../../assets/images/cut.jpeg';
import womanBluntCutImage from '../../../../assets/images/cut.jpeg';
import bobLobCutImage from '../../../../assets/images/color.jpeg';
import mediumLengthLayerImage from '../../../../assets/images/haircut.jpeg';
import vShapedCutImage from '../../../../assets/images/manicure.jpeg';
import layerCutImage from '../../../../assets/images/pedicure.jpeg';

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

const CartServiceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userName, isLoading } = useUser();

  // Get the selected service from navigation parameters
  // Assuming the parameter name is 'selectedService'
  const selectedServiceFromRoute = route.params?.selectedService;
  const sourcePanel = route.params?.sourcePanel || 'manager';

  // State to hold the services in the cart, initialized with the selected service
  const [services, setServices] = useState(
    selectedServiceFromRoute ? [selectedServiceFromRoute] : [],
  );

  // State to control modal visibility
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [customServiceModalVisible, setCustomServiceModalVisible] =
    useState(false);
  const [printBillModalVisible, setPrintBillModalVisible] = useState(false);

  // New state to hold the bill data object
  const [billData, setBillData] = useState(null);

  // State to hold form input values
  const [gst, setGst] = useState('');
  const [discount, setDiscount] = useState('');
  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (sourcePanel === 'admin') {
          navigation.replace('AdminMainDashboard');
        } else {
          navigation.replace('ManagerHomeScreen', { targetTab: 'Home' });
        }
        return true; // Prevent default back behavior
      },
    );

    return () => backHandler.remove();
  }, [navigation, sourcePanel]);
  const [beautician, setBeautician] = useState('');

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(100);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    slideAnim.value = withSpring(0, { damping: 15 });
  }, []);

  // Button press animation
  const buttonScale = useSharedValue(1);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleButtonPress = onPress => {
    buttonScale.value = withTiming(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1, { damping: 10 });
    });
    if (onPress) onPress();
  };

  // Calculate subtotal and total based on the 'services' state
  // Ensure price is treated as a number before summing
  const subtotal = services.reduce(
    (sum, service) => sum + (Number(service.price) || 0),
    0,
  );
  const gstAmount = parseFloat(gst) || 0;
  const discountAmount = parseFloat(discount) || 0;
  const totalPrice = subtotal + gstAmount - discountAmount;

  // **NEW FUNCTION: Handle saving and displaying a custom service**
  const handleSaveCustomService = newServiceData => {
    // Create a new service object with a unique ID for the list key
    const newService = {
      ...newServiceData,
      price: Number(newServiceData.price), // Ensure price is a number
      id: Date.now(), // Unique ID for the list
    };

    // Add the new service to the services list
    setServices(prevServices => [...prevServices, newService]);

    // Close the custom service modal
    setCustomServiceModalVisible(false);
  };

  // Function to handle the transition to the print bill modal
  const handleOpenPrintBill = async () => {
    try {
      // 1. Create the billData object using all the state variables
      const newBillData = {
        clientName: clientName,
        phoneNumber: phoneNumber,
        notes: notes,
        beautician: beautician,
        services: services, // Pass the actual services in the cart
        subtotal: subtotal,
        gst: gstAmount,
        discount: discountAmount,
        totalPrice: totalPrice,
      };

      // 2. Set the billData state
      setBillData(newBillData);

      // 3. Auto-generate client from bill data
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

      // 4. Close the CheckoutModal and open the PrintBillModal
      setCheckoutModalVisible(false);
      setPrintBillModalVisible(true);
    } catch (error) {
      console.error('Error in handleOpenPrintBill:', error);
      Alert.alert('Error', 'Failed to generate bill. Please try again.');
    }
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
  const getServiceImageSource = service => {
    if (service.image) {
      return { uri: service.image };
    }
    // Use the same logic as Submarket screen for fallback images
    return getSubServiceImage(service.subServiceName || service.name);
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
      <Animated.View
        style={styles.mainContent}
        entering={FadeInUp.duration(800).springify()}
      >
        {/* Header Section */}
        <StandardHeader showBackButton={true} sourcePanel={sourcePanel} />

        {/* Main Cart Content with ScrollView */}
        <ScrollView style={styles.contentArea}>
          {/* Profile Cards Row */}
          <View style={styles.profileCardsRow}>
            {services.length > 0 ? (
              services.map((service, index) => (
                <Animated.View
                  key={service.id || service._id || index}
                  style={styles.profileCard}
                  entering={SlideInRight.delay(index * 100)
                    .duration(600)
                    .springify()}
                >
                  <View style={styles.profileImageWrapper}>
                    <Image
                      source={getServiceImageSource(service)}
                      style={styles.profileCardImage}
                    />
                    <View style={styles.onlineIndicator} />
                  </View>
                  <View style={styles.profileTextWrapper}>
                    {/* Displaying service name (from subServiceName or name) */}
                    <Text style={styles.profileName}>
                      {service.subServiceName || service.name || 'N/A'}
                    </Text>
                    {/* Displaying service type (from service or subServiceType) */}
                    <Text style={styles.profileService}>
                      {service.service || service.subServiceType || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.cardPriceContainer}>
                    {/* Displaying duration (from time or duration) */}
                    <Text style={styles.cardDescription}>
                      {service.time || service.duration || 'N/A'}
                    </Text>
                    {/* CRITICAL FIX: Ensure service.price is a number before calling toFixed */}
                    <Text style={styles.cardPrice}>
                      PKR {Number(service.price || 0).toFixed(2)}
                    </Text>
                  </View>
                </Animated.View>
              ))
            ) : (
              <Text style={styles.noServicesText}>
                No services added to cart.
              </Text>
            )}
          </View>

          {/* Input Fields Section */}
          <Animated.View
            style={styles.inputSection}
            entering={FadeInUp.delay(400).duration(800)}
          >
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
          </Animated.View>

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
        <Animated.View
          style={styles.checkoutFooter}
          entering={FadeInUp.delay(600).duration(600)}
        >
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>
              Total ({services.length} Services)
            </Text>
            <Text style={styles.totalPrice}>PKR {totalPrice.toFixed(2)}</Text>
          </View>
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => handleButtonPress(handleCheckout)}
            >
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* Modals */}
      <CheckoutModal
        isVisible={checkoutModalVisible}
        onClose={() => setCheckoutModalVisible(false)}
        subtotal={subtotal}
        gst={gstAmount}
        discount={discountAmount}
        servicesCount={services.length}
        onConfirmOrder={handleOpenPrintBill}
      />

      <AddCustomServiceModal
        isVisible={customServiceModalVisible}
        onClose={() => setCustomServiceModalVisible(false)}
        // **PASSING THE NEW PROP HERE**
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

  contentArea: {
    flex: 1,
  },
  profileCardsRow: {
    flexDirection: 'row',
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
    fontSize: normalize(38),
    color: '#faf9f6ff',
    marginBottom: normalize(16),
    fontWeight: '600',
  },
  inputField: {
    backgroundColor: '#424449ff',
    borderRadius: normalize(8),
    paddingHorizontal: normalize(19),
    paddingVertical: normalize(15),
    height: normalize(80),
    color: '#fff',
    fontSize: normalize(32),
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
    borderRadius: normalize(8),
    borderWidth: 1,
    borderColor: '#A98C27',
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(20),
    alignItems: 'center',
    marginBottom: normalize(20),
    alignSelf: 'center',
    minWidth: width * 0.2,
    maxWidth: width * 0.4,
  },
  addCustomServiceButtonText: {
    fontSize: normalize(16),
    color: '#A98C27',
    fontWeight: '600',
  },
  checkoutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2D32',
    borderRadius: normalize(10),
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(20),
    marginTop: 'auto',
    marginBottom: normalize(50),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    backgroundColor: '#A98C27',
    paddingHorizontal: normalize(40),
    paddingVertical: normalize(15),
    borderRadius: normalize(10),
    minWidth: width * 0.15,
    maxWidth: width * 0.25,
  },
  checkoutButtonText: {
    fontSize: normalize(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  noServicesText: {
    color: '#A9A9A9',
    fontSize: normalize(22),
    textAlign: 'center',
    width: '100%',
    marginTop: normalize(50),
  },
});

export default CartServiceScreen;
