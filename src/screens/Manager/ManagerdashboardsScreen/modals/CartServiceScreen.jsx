// src/screens/admin/CartServiceScreen/CartServiceScreen.jsx

import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import { useUser } from '../../../../context/UserContext';
import ManagerSidebar from '../../../../components/ManagerSidebar';
import AdminSidebar from '../../../../components/Sidebar';
import { useNavigation, useRoute } from '@react-navigation/native';
import StandardHeader from '../../../../components/StandardHeader';
import CheckoutModal from './CheckoutModal';
import AddCustomServiceModal from './AddCustomServiceModal';
import PrintBillModal from './PrintBillModal';

// Mock images, replace with your actual images if needed
import userProfileImage from '../../../../assets/images/cut.jpeg';
import womanBluntCutImage from '../../../../assets/images/cut.jpeg';
import bobLobCutImage from '../../../../assets/images/color.jpeg';
import mediumLengthLayerImage from '../../../../assets/images/haircut.jpeg';
import vShapedCutImage from '../../../../assets/images/manicure.jpeg';
import layerCutImage from '../../../../assets/images/pedicure.jpeg';

// Import necessary modules for the new functionality
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../../api/config';
import { getAuthToken as getUnifiedAuthToken } from '../../../../utils/authUtils';
import {
  addClient as apiAddClient,
  searchClients as apiSearchClients,
} from '../../../../api/clients';

const { width } = Dimensions.get('window');
const scale = width / 1280;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

const getSubServiceImage = subServiceName => {
  switch (subServiceName) {
    case 'Standard Haircut':
      return womanBluntCutImage;
    case 'Layered Cut':
      return layerCutImage;
    case 'Kids Haircut':
    case 'Gel Manicure':
      return bobLobCutImage;
    case 'Classic Manicure':
      return mediumLengthLayerImage;
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

// Use unified token resolver (admin or manager)
const getAuthToken = async () => await getUnifiedAuthToken();

const fetchClients = async () => {
  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token found');

  try {
    const response = await axios.get(`${BASE_URL}/clients/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.clients || [];
  } catch (error) {
    console.error(
      'Error fetching clients:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// FIXED ensureClientByPhone function
const ensureClientByPhone = async ({ name, phoneNumber }) => {
  const trimmedPhone = (phoneNumber || '').trim();
  const trimmedName = (name || '').trim() || 'Guest';

  console.log('🔍 Ensuring client exists:', {
    name: trimmedName,
    phone: trimmedPhone,
  });

  // 1) Normalize phone number for comparison
  const normalizePhone = phone => {
    if (!phone) return '';
    // Remove any spaces, dashes, etc.
    let cleanPhone = phone.replace(/\D/g, '');
    // Ensure it starts with 92 or 0
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }
    if (!cleanPhone.startsWith('92')) {
      cleanPhone = '92' + cleanPhone;
    }
    return cleanPhone;
  };

  const normalizedInputPhone = normalizePhone(trimmedPhone);
  console.log('📞 Normalized phone:', normalizedInputPhone);

  // 2) Search by phone first with better error handling
  try {
    console.log('🔎 Searching for existing client...');
    const searchRes = await apiSearchClients(trimmedPhone);
    console.log('📋 Search response:', searchRes);

    const clientsList = searchRes?.clients || searchRes || [];
    const found = clientsList.find(client => {
      const clientPhoneNormalized = normalizePhone(client.phoneNumber);
      console.log(
        '🔍 Comparing:',
        clientPhoneNormalized,
        'vs',
        normalizedInputPhone,
      );
      return clientPhoneNormalized === normalizedInputPhone;
    });

    if (found) {
      console.log('✅ Existing client found:', found);
      return found;
    }
  } catch (e) {
    console.log(
      '⚠️ Search failed, attempting to create new client:',
      e.message,
    );
    // Continue to create new client
  }

  // 3) Create if not found with better error handling
  try {
    console.log('➕ Creating new client...');
    const created = await apiAddClient({
      name: trimmedName,
      phoneNumber: trimmedPhone, // Original format mein save karein
    });
    console.log('📋 Create response:', created);

    // Handle different response structures
    const newClient = created?.client || created;
    if (newClient && newClient._id) {
      console.log('✅ New client created successfully:', newClient);
      return newClient;
    } else {
      console.log('❌ Client creation response invalid:', created);
      throw new Error('Invalid client creation response');
    }
  } catch (createErr) {
    console.error('❌ Client creation failed:', createErr);

    // Final attempt to search again (maybe client was created by another process)
    try {
      console.log('🔎 Final search attempt...');
      const searchRes2 = await apiSearchClients(trimmedPhone);
      const clientsList2 = searchRes2?.clients || searchRes2 || [];
      const found2 = clientsList2.find(client => {
        const clientPhoneNormalized = normalizePhone(client.phoneNumber);
        return clientPhoneNormalized === normalizedInputPhone;
      });

      if (found2) {
        console.log('✅ Client found in final search:', found2);
        return found2;
      }
    } catch (e2) {
      console.error('❌ Final search also failed:', e2);
    }

    // If everything fails, create a temporary client object
    console.log('🔄 Creating temporary client object');
    return {
      _id: `temp-${Date.now()}`,
      name: trimmedName,
      phoneNumber: trimmedPhone,
      isTemporary: true,
    };
  }
};
// Note: Following product/deals pattern (client visit history)

const addBillToClientHistory = async (clientId, billData) => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/clients/${clientId}/visit`,
      billData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      'Error adding bill history:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

const CartServiceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userName, isLoading } = useUser();
  const selectedServiceFromRoute = route.params?.selectedService;
  const sourcePanel = route.params?.sourcePanel || 'manager';

  const [services, setServices] = useState(
    selectedServiceFromRoute ? [selectedServiceFromRoute] : [],
  );
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [customServiceModalVisible, setCustomServiceModalVisible] =
    useState(false);
  const [printBillModalVisible, setPrintBillModalVisible] = useState(false);
  const [billData, setBillData] = useState(null);
  const [gst, setGst] = useState('');
  const [discount, setDiscount] = useState('');
  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [beautician, setBeautician] = useState('');
  const [notes, setNotes] = useState('');
  const [allClients, setAllClients] = useState([]);
  const [isClientRegistered, setIsClientRegistered] = useState(false);
  const [clientFetchLoading, setClientFetchLoading] = useState(true);
  const [registeredClient, setRegisteredClient] = useState(null);

  // Logic to allow editing name only for new clients
  const canEditName = !isClientRegistered;
  // Allow editing all fields if a client is found or if a phone number and name are entered for a new client
  const canEditOtherFields =
    isClientRegistered ||
    (phoneNumber?.trim().length > 0 && clientName?.trim().length > 0);

  const handleSidebarSelect = useCallback(
    tabName => {
      if (sourcePanel === 'admin') {
        navigation.navigate('AdminMainDashboard', { targetTab: tabName });
      } else {
        navigation.navigate('ManagerHomeScreen', { targetTab: tabName });
      }
    },
    [navigation, sourcePanel],
  );

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clients = await fetchClients();
        setAllClients(clients);
      } catch (error) {
        Alert.alert('Error', 'Failed to load client data for search.');
      } finally {
        setClientFetchLoading(false);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (sourcePanel === 'admin') {
          navigation.navigate('AdminMainDashboard');
        } else {
          navigation.navigate('ManagerHomeScreen', { targetTab: 'Home' });
        }
        return true;
      },
    );
    return () => backHandler.remove();
  }, [navigation, sourcePanel]);

  // Updated function to handle phone number search and new client flow
  const handlePhoneNumberSearch = async () => {
    const trimmedNumber = (phoneNumber || '').trim();
    if (!trimmedNumber) {
      setClientName('');
      setRegisteredClient(null);
      setIsClientRegistered(false);
      return;
    }

    try {
      const foundClient = allClients.find(
        client =>
          client.phoneNumber === trimmedNumber ||
          client.phoneNumber === `+92${trimmedNumber.substring(1)}`,
      );

      if (foundClient) {
        setClientName(foundClient.name || '');
        setRegisteredClient(foundClient);
        setIsClientRegistered(true);
        Alert.alert('Client Found', `Welcome back, ${foundClient.name}.`);
      } else {
        setRegisteredClient(null);
        setIsClientRegistered(false);
        setClientName('');
        Alert.alert(
          'New Client',
          'This phone number is not registered. Please enter a name to add this client automatically.',
        );
      }
    } catch (error) {
      console.error('Error during client search:', error);
      Alert.alert('Error', 'Failed to search for client. Please try again.');
    }
  };

  const subtotal = services.reduce(
    (sum, service) => sum + (Number(service.price) || 0),
    0,
  );
  const gstAmount = parseFloat(gst) || 0;
  const discountAmount = parseFloat(discount) || 0;
  const totalPrice = subtotal + gstAmount - discountAmount;

  const handleSaveCustomService = newServiceData => {
    const newService = {
      ...newServiceData,
      price: Number(newServiceData.price),
      id: Date.now(),
    };
    setServices(prevServices => [...prevServices, newService]);
    setCustomServiceModalVisible(false);
  };

  const handleOpenPrintBill = async () => {
    try {
      if (!phoneNumber?.trim() || !clientName?.trim()) {
        Alert.alert(
          'Missing Info',
          'Please enter phone number and client name.',
        );
        return;
      }

      // ✅ LOG 1: Check what we have in the form
      console.log('=== FORM DATA CHECK ===');
      console.log('Notes from form:', notes);
      console.log('Beautician from form:', beautician);
      console.log('Discount from form:', discount);
      console.log('Discount Amount calculated:', discountAmount);

      console.log('🚀 Starting bill process...');

      let createdClient;
      try {
        createdClient =
          registeredClient ||
          (await ensureClientByPhone({
            name: clientName.trim(),
            phoneNumber: phoneNumber.trim(),
          }));
        console.log('✅ Client resolved:', createdClient);
      } catch (clientError) {
        console.error('❌ Client resolution failed:', clientError);
        createdClient = {
          _id: `temp-${Date.now()}`,
          name: clientName.trim(),
          phoneNumber: phoneNumber.trim(),
          isTemporary: true,
        };
        console.log('🔄 Using temporary client:', createdClient);
      }

      if (createdClient && !createdClient.isTemporary) {
        setRegisteredClient(createdClient);
        setIsClientRegistered(true);
        setAllClients(prev => {
          const exists = prev.some(c => c._id === createdClient._id);
          return exists
            ? prev.map(c => (c._id === createdClient._id ? createdClient : c))
            : [createdClient, ...prev];
        });
      }

      const billNumber = `BILL-${Date.now()}`;

      // ✅ LOG 2: Build the payload step by step
      console.log('=== BUILDING PAYLOAD ===');
      console.log('Subtotal:', subtotal);
      console.log('Discount Amount:', discountAmount);
      console.log('Beautician:', beautician);
      console.log('Notes:', notes);

      const historyPayload = {
        visitData: {
          // Remove visitData wrapper completely
          services: services.map(s => ({
            name: s.subServiceName || s.name,
            price: Number(s.price),
          })),
          totalBill: totalPrice,
          subtotal: subtotal,
          discount: discountAmount,
          specialist: beautician, // Direct, not nested
          notes: notes, // Direct, not nested
          date: new Date().toISOString(),
          billNumber: billNumber,
          clientName: createdClient?.name || clientName.trim(),
          phoneNumber: createdClient?.phoneNumber || phoneNumber.trim(),
        },
      };

      console.log('📦 FLAT STRUCTURE Bill payload:', historyPayload);

      // Send it
      if (createdClient?._id && !createdClient.isTemporary) {
        try {
          await addBillToClientHistory(createdClient._id, historyPayload);
          console.log('✅ Bill saved to client history');
        } catch (historyError) {
          console.error('❌ Bill history save failed:', historyError);
        }
      }

      // ✅ LOG 3: Check the final payload
      console.log('=== FINAL PAYLOAD ===');
      console.log('Full payload:', JSON.stringify(historyPayload, null, 2));
      console.log('visitData.discount:', historyPayload.visitData.discount);
      console.log('visitData.specialist:', historyPayload.visitData.specialist);
      console.log('visitData.notes:', historyPayload.visitData.notes);

      // Only save to history if client is not temporary
      if (createdClient?._id && !createdClient.isTemporary) {
        try {
          console.log('=== SENDING TO BACKEND ===');
          console.log('Client ID:', createdClient._id);
          console.log(
            'Payload being sent:',
            JSON.stringify(historyPayload, null, 2),
          );

          const response = await addBillToClientHistory(
            createdClient._id,
            historyPayload,
          );

          console.log('=== BACKEND RESPONSE ===');
          console.log('Response:', JSON.stringify(response, null, 2));
          console.log('✅ Bill saved to client history');
        } catch (historyError) {
          console.error('❌ Bill history save failed:', historyError);
          console.error(
            'Error details:',
            historyError.response?.data || historyError.message,
          );
        }
      } else {
        console.log('ℹ️ Skipping history save for temporary client');
      }

      // ✅ Bill data for display
      setBillData({
        client: createdClient,
        notes,
        beautician,
        services,
        subtotal,
        gst: gstAmount,
        discount: discountAmount,
        totalPrice,
        clientName: createdClient?.name || clientName.trim(),
        phoneNumber: createdClient?.phoneNumber || phoneNumber.trim(),
        billNumber: billNumber,
      });

      setCheckoutModalVisible(false);
      setPrintBillModalVisible(true);

      // Reset form
      setServices([]);
      setNotes('');
      setBeautician('');
      setGst('');
      setDiscount('');
      setPhoneNumber('');
      setClientName('');
      setRegisteredClient(null);
      setIsClientRegistered(false);

      console.log('🎉 Bill process completed successfully');
    } catch (error) {
      console.error('💥 Error in handleOpenPrintBill:', error);
      Alert.alert(
        'Error',
        `Failed to create bill: ${
          error.message || 'Unknown error'
        }\n\nBut you can still print the bill.`,
      );

      setBillData({
        client: { name: clientName.trim(), phoneNumber: phoneNumber.trim() },
        notes,
        beautician,
        services,
        subtotal,
        gst: gstAmount,
        discount: discountAmount,
        totalPrice,
        clientName: clientName.trim(),
        phoneNumber: phoneNumber.trim(),
        billNumber: `BILL-${Date.now()}`,
      });
      setCheckoutModalVisible(false);
      setPrintBillModalVisible(true);
    }
  };
  const handleCheckout = () => {
    if (services.length === 0) {
      Alert.alert(
        'Empty Cart',
        'Please add at least one service to the cart before checking out.',
      );
      return;
    }
    if (!phoneNumber?.trim()) {
      Alert.alert('Missing Phone', 'Please enter a phone number.');
      return;
    }
    if (!clientName?.trim()) {
      Alert.alert('Missing Name', 'Please enter client name.');
      return;
    }
    setCheckoutModalVisible(true);
  };

  const getServiceImageSource = service => {
    if (service.image) {
      return { uri: service.image };
    }
    return getSubServiceImage(service.subServiceName || service.name);
  };

  if (isLoading || clientFetchLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A98C27" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sourcePanel === 'admin' ? (
        <AdminSidebar
          navigation={navigation}
          activeTab="Services"
          onSelect={handleSidebarSelect}
        />
      ) : (
        <ManagerSidebar
          navigation={navigation}
          userName={userName}
          activeTab="Home"
          onSelect={handleSidebarSelect}
        />
      )}
      <View style={styles.mainContent}>
        <StandardHeader showBackButton={true} sourcePanel={sourcePanel} />
        <ScrollView style={styles.contentArea}>
          <View style={styles.profileCardsRow}>
            {services.length > 0 ? (
              services.map((service, index) => (
                <View
                  key={service.id || service._id || index}
                  style={styles.profileCard}
                >
                  <View style={styles.profileImageWrapper}>
                    <Image
                      source={getServiceImageSource(service)}
                      style={styles.profileCardImage}
                    />
                    <View style={styles.onlineIndicator} />
                  </View>
                  <View style={styles.profileTextWrapper}>
                    <Text style={styles.profileName}>
                      {service.subServiceName || service.name || 'N/A'}
                    </Text>
                    <Text style={styles.cardDescription}>
                      {service.description || 'N/A'}
                    </Text>
                    <Text style={styles.profileService}>
                      {service.time || service.duration || 'N/A'} min
                    </Text>
                  </View>
                  <View style={styles.cardPriceContainer}>
                    <Text style={styles.cardPrice}>
                      PKR {Number(service.price || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noServicesText}>
                No services added to cart.
              </Text>
            )}
          </View>
          <View style={styles.inputSection}>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g., 03001234567 or +923001234567"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onBlur={handlePhoneNumberSearch}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Client Name</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    !canEditName && styles.disabledInput,
                  ]}
                  placeholder="Client Name"
                  placeholderTextColor="#666"
                  value={clientName}
                  onChangeText={setClientName}
                  editable={canEditName}
                />
              </View>
            </View>
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
                  editable={canEditOtherFields}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Beautician</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Add Beautician Name"
                  placeholderTextColor="#666"
                  value={beautician}
                  onChangeText={setBeautician}
                  editable={canEditOtherFields}
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
                editable={canEditOtherFields}
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.addCustomServiceButton}
            onPress={() => setCustomServiceModalVisible(true)}
            disabled={!canEditOtherFields}
          >
            <Text
              style={[
                styles.addCustomServiceButtonText,
                !canEditOtherFields && { color: '#666' },
              ]}
            >
              + Add Custom Service
            </Text>
          </TouchableOpacity>
        </ScrollView>
        <View style={styles.checkoutFooter}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>
              Total ({services.length} Services)
            </Text>
            <Text style={styles.totalPrice}>PKR {totalPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.animatedButtonStyle}>
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                !canEditOtherFields && styles.disabledButton,
              ]}
              onPress={handleCheckout}
              disabled={!canEditOtherFields}
            >
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
        onServiceSave={handleSaveCustomService}
      />
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
  disabledInput: {
    backgroundColor: '#3A3A3A',
    color: '#666',
  },
  disabledButton: {
    backgroundColor: '#4A4A4A',
  },
});

export default CartServiceScreen;
