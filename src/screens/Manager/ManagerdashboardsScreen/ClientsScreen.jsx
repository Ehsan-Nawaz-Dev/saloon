// src/screens/admin/ClientsScreen/ClientsScreen.jsx

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NotificationBell from '../../../components/NotificationBell';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddClientModal from './modals/AddClientModal';
import DeleteClientModal from './modals/DeleteClientModal';
import { BASE_URL } from '../../../api/config';

const { width, height } = Dimensions.get('window');

const userProfileImagePlaceholder = require('../../../assets/images/logo.png');

// Helper function to truncate username to 6 words maximum
const truncateUsername = username => {
  if (!username) return 'Guest';
  const words = username.split(' ');
  if (words.length <= 6) return username;
  return words.slice(0, 6).join(' ') + '...';
};

// Base URL for your API
const API_BASE_URL = BASE_URL;

// 🔐 Enhanced Retrieve token from AsyncStorage
const getAuthToken = async navigation => {
  try {
    // 1. Try manager auth first
    const managerAuth = await AsyncStorage.getItem('managerAuth');
    if (managerAuth) {
      const parsed = JSON.parse(managerAuth);
      if (parsed.token && parsed.isAuthenticated) {
        console.log('✅ Using Manager Token');
        return parsed.token;
      }
    }

    // 2. Try admin auth
    const adminAuth = await AsyncStorage.getItem('adminAuth');
    if (adminAuth) {
      const parsed = JSON.parse(adminAuth);
      if (parsed.token && parsed.isAuthenticated) {
        console.log('✅ Using Admin Token');
        return parsed.token;
      }
    }

    // 3. Check if face auth token exists and needs conversion
    const faceToken = await AsyncStorage.getItem('face_auth_token');
    if (faceToken && faceToken.startsWith('face_auth_')) {
      console.log('🔄 Face auth token found, attempting conversion...');

      if (adminAuth) {
        const parsed = JSON.parse(adminAuth);
        if (parsed.admin && parsed.admin.faceData) {
          try {
            const response = await fetch(`${API_BASE_URL}/auth/face-login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                adminId: parsed.admin._id,
                name: parsed.admin.name,
                faceVerified: true,
                faceData: parsed.admin.faceData,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const jwtToken = data.token || data.data?.token;

              await AsyncStorage.setItem(
                'adminAuth',
                JSON.stringify({
                  ...parsed,
                  token: jwtToken,
                  isAuthenticated: true,
                }),
              );

              console.log('✅ Successfully converted face token to JWT');
              return jwtToken;
            }
          } catch (conversionError) {
            console.error('❌ Face token conversion failed:', conversionError);
          }
        }
      }
    }

    console.error('❌ No valid authentication token found');
    return null;
  } catch (error) {
    console.error('Failed to get token from storage:', error);
    return null;
  }
};

// ✅ Fetch all clients from API
const fetchClients = async () => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/clients/all`, {
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

// ✅ POST new client to API
const createClient = async clientData => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/clients/add`,
      clientData,
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
      'Error creating client:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// ✅ DELETE client from API
const deleteClient = async clientId => {
  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token');

  try {
    await axios.delete(`${API_BASE_URL}/clients/${clientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return true;
  } catch (error) {
    console.error(
      'Error deleting client:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

const ClientsScreen = () => {
  const navigation = useNavigation();

  // ➡️ New state to hold user data fetched from AsyncStorage
  const [userData, setUserData] = useState({
    name: 'Guest',
    profileImage: userProfileImagePlaceholder,
  });

  const [searchText, setSearchText] = useState('');
  const [clientsData, setClientsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFilterDate, setSelectedFilterDate] = useState(null);

  const [isAddClientModalVisible, setIsAddClientModalVisible] = useState(false);
  const [isDeleteClientModalVisible, setIsDeleteClientModalVisible] =
    useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // ➡️ New useEffect hook to load user data from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const managerAuth = await AsyncStorage.getItem('managerAuth');
        const adminAuth = await AsyncStorage.getItem('adminAuth');

        if (managerAuth) {
          const parsedData = JSON.parse(managerAuth);
          if (parsedData.token && parsedData.isAuthenticated) {
            setUserData({
              name: parsedData.manager.name,
              profileImage:
                parsedData.manager.livePicture || userProfileImagePlaceholder,
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
              name: parsedData.admin.name,
              profileImage:
                parsedData.admin.livePicture || userProfileImagePlaceholder,
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
    loadClients(); // Load clients on mount
  }, []);

  // 🔁 Load clients from API
  const loadClients = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchClients();
      setClientsData(data);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to load clients. Please check your connection.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔍 Search handler
  const handleSearch = text => {
    setSearchText(text);
  };

  // 🔀 Filter clients based on search and date
  const filteredClients = useMemo(() => {
    let result = [...clientsData];

    // Search filter
    if (searchText.trim().length > 0) {
      const query = searchText.toLowerCase().trim();
      result = result.filter(
        client =>
          client.name?.toLowerCase().includes(query) ||
          client.clientId?.toLowerCase().includes(query) ||
          client.phoneNumber?.toLowerCase().includes(query),
      );
    }

    // Date filter
    if (selectedFilterDate) {
      const formattedDate = moment(selectedFilterDate).format('YYYY-MM-DD');
      result = result.filter(
        client =>
          moment(client.createdAt).format('YYYY-MM-DD') === formattedDate,
      );
    }

    return result;
  }, [clientsData, searchText, selectedFilterDate]);

  // 🔄 Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients(false);
  };

  // ✅ Open Add Modal
  const handleOpenAddClientModal = () => {
    setIsAddClientModalVisible(true);
  };

  const handleCloseAddClientModal = () => {
    setIsAddClientModalVisible(false);
  };

  const handleSaveNewClient = async clientDataFromModal => {
    try {
      await loadClients(false);
      handleCloseAddClientModal();
    } catch (error) {
      console.error('Error refreshing clients after adding:', error);
    }
  };

  // 👁️ View client history
  const handleViewClientHistory = client => {
    navigation.navigate('ClientHistory', { client });
  };

  // 🗑️ Delete client
  const handleOpenDeleteClientModal = client => {
    setSelectedClient(client);
    setIsDeleteClientModalVisible(true);
  };

  const handleCloseDeleteClientModal = () => {
    setIsDeleteClientModalVisible(false);
    setSelectedClient(null);
  };

  const handleDeleteClientConfirm = async () => {
    if (!selectedClient) return;

    try {
      await deleteClient(selectedClient._id);
      await loadClients(false);
      Alert.alert(
        'Success',
        `Client ${selectedClient.name} deleted successfully.`,
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to delete client. Please try again.');
    } finally {
      handleCloseDeleteClientModal();
    }
  };

  // 📅 Date picker handlers
  const onDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedFilterDate(date);
    } else {
      setSelectedFilterDate(null);
    }
  };

  const handleOpenDatePicker = () => {
    setShowDatePicker(true);
  };

  const handleClearDateFilter = () => {
    setSelectedFilterDate(null);
  };

  // 🖼️ Render client item
  const renderClientItem = ({ item, index }) => (
    <View
      style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
    >
      <Text style={styles.clientIdCell}>{item.clientId}</Text>
      <Text style={styles.clientNameCell}>{item.name}</Text>
      <Text style={styles.clientPhoneCell}>{item.phoneNumber}</Text>
      <Text style={styles.clientVisitsCell}>{item.totalVisits || 0}</Text>
      <Text style={styles.clientComingDateCell}>
        {item.lastVisit
          ? moment(item.lastVisit).format('MMM DD, YYYY')
          : 'Never'}
      </Text>
      <View style={styles.clientActionCell}>
        <TouchableOpacity
          onPress={() => handleViewClientHistory(item)}
          style={styles.actionButton}
        >
          <Ionicons name="eye-outline" size={width * 0.018} color="#A9A9A9" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleOpenDeleteClientModal(item)}
          style={styles.actionButton}
        >
          <Ionicons name="trash-outline" size={width * 0.018} color="#ff5555" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // 🚀 Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A98C27" />
        <Text style={styles.loadingText}>Loading clients...</Text>
      </View>
    );
  }

  // ➡️ Get the profile image source from the state
  const profileImageSource =
    userData.profileImage && typeof userData.profileImage === 'string'
      ? { uri: userData.profileImage }
      : userProfileImagePlaceholder;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.userName}>
              {truncateUsername(userData.name)}
            </Text>
          </View>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients..."
              placeholderTextColor="#A9A9A9"
              value={searchText}
              onChangeText={handleSearch}
              autoCapitalize="none"
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

      {/* Content */}
      <View style={styles.contentArea}>
        <Text style={styles.screenTitle}>Clients</Text>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={handleOpenDatePicker}
          >
            <Ionicons
              name="calendar-outline"
              size={width * 0.02}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.datePickerButtonText}>
              {selectedFilterDate
                ? moment(selectedFilterDate).format('MMM DD, YYYY')
                : 'Select Date'}
            </Text>
            {selectedFilterDate && (
              <TouchableOpacity
                onPress={handleClearDateFilter}
                style={{ marginLeft: 5 }}
              >
                <Ionicons
                  name="close-circle"
                  size={width * 0.018}
                  color="#fff"
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addClientButton}
            onPress={handleOpenAddClientModal}
          >
            <Ionicons
              name="add-circle-outline"
              size={width * 0.02}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.addClientButtonText}>
              Add Direct New Client
            </Text>
          </TouchableOpacity>
        </View>

        {/* Table with Horizontal Scrolling */}
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          style={styles.tableScrollView}
        >
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.clientIdHeader}>Client ID</Text>
              <Text style={styles.clientNameHeader}>Name</Text>
              <Text style={styles.clientPhoneHeader}>Phone</Text>
              <Text style={styles.clientVisitsHeader}>Visits</Text>
              <Text style={styles.clientComingDateHeader}>Last Visit</Text>
              <Text style={styles.clientActionHeader}>Action</Text>
            </View>

            <FlatList
              data={filteredClients}
              renderItem={renderClientItem}
              keyExtractor={item => item._id}
              style={styles.table}
              ListEmptyComponent={
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                    {searchText || selectedFilterDate
                      ? 'No matching clients found.'
                      : 'No clients yet.'}
                  </Text>
                </View>
              }
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          </View>
        </ScrollView>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedFilterDate || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Modals */}
      <AddClientModal
        isVisible={isAddClientModalVisible}
        onClose={handleCloseAddClientModal}
        onSave={handleSaveNewClient}
      />

      <DeleteClientModal
        isVisible={isDeleteClientModalVisible}
        onClose={handleCloseDeleteClientModal}
        onDeleteConfirm={handleDeleteClientConfirm}
        clientDetails={selectedClient}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingHorizontal: width * 0.02,
    paddingTop: height * 0.03,
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
    marginHorizontal: width * 0.0001,
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
    paddingHorizontal: width * 0.002,
    flex: 1,
    height: height * 0.04,
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
    borderRadius: 9,
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
  contentArea: {
    flex: 1,
    paddingHorizontal: width * 0.005,
  },
  screenTitle: {
    color: '#fff',
    fontSize: width * 0.029,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: height * -0.02,
    marginBottom: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    paddingBottom: height * 0.03,
  },
  addClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A98C27',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.025,
    borderRadius: 8,
    marginLeft: width * 0.01,
  },
  addClientButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.025,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  datePickerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
  },
  tableScrollView: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableContainer: {
    minWidth: '100%',
    backgroundColor: '#1F1F1F',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: height * 0.015,
    backgroundColor: '#2B2B2B',
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
  },
  clientIdHeader: {
    width: width * 0.15,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
    paddingHorizontal: width * 0.01,
  },
  clientNameHeader: {
    width: width * 0.2,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
    paddingHorizontal: width * 0.01,
  },
  clientPhoneHeader: {
    width: width * 0.2,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
    paddingHorizontal: width * 0.01,
  },
  clientVisitsHeader: {
    width: width * 0.1,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'center',
    paddingHorizontal: width * 0.01,
  },
  clientComingDateHeader: {
    width: width * 0.15,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
    paddingHorizontal: width * 0.01,
  },
  clientActionHeader: {
    width: width * 0.12,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'center',
    paddingHorizontal: width * 0.01,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: height * 0.015,
    alignItems: 'center',
  },
  rowEven: {
    backgroundColor: '#2E2E2E',
  },
  rowOdd: {
    backgroundColor: '#1F1F1F',
  },
  clientIdCell: {
    width: width * 0.15,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
    paddingHorizontal: width * 0.01,
  },
  clientNameCell: {
    width: width * 0.2,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
    paddingHorizontal: width * 0.01,
  },
  clientPhoneCell: {
    width: width * 0.2,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
    paddingHorizontal: width * 0.01,
  },
  clientVisitsCell: {
    width: width * 0.1,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'center',
    paddingHorizontal: width * 0.01,
  },
  clientComingDateCell: {
    width: width * 0.15,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
    paddingHorizontal: width * 0.01,
  },
  clientActionCell: {
    width: width * 0.12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.01,
  },
  actionButton: {
    padding: width * 0.005,
    marginHorizontal: width * 0.005,
  },
  table: {
    flex: 1,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  loadingText: {
    color: '#A9A9A9',
    fontSize: width * 0.02,
    marginTop: height * 0.01,
  },
});

export default ClientsScreen;
