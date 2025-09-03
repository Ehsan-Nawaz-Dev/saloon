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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../../../context/UserContext';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddClientModal from './modals/AddClientModal';
import DeleteClientModal from './modals/DeleteClientModal';
import { BASE_URL } from '../../../api/config';

const { width, height } = Dimensions.get('window');

const userProfileImagePlaceholder = require('../../../assets/images/foundation.jpeg');

// Helper function to truncate username to 6 words maximum
const truncateUsername = username => {
  if (!username) return 'Guest';
  const words = username.split(' ');
  if (words.length <= 6) return username;
  return words.slice(0, 6).join(' ') + '...';
};

// Base URL for your API
const API_BASE_URL = BASE_URL;

// 🔐 Retrieve token from AsyncStorage
const getAuthToken = async () => {
  try {
    const data = await AsyncStorage.getItem('adminAuth');
    if (data) {
      const { token } = JSON.parse(data);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Failed to get token from storage:', error);
    return null;
  }
};

// ✅ Fetch all clients from API
const fetchClients = async () => {
  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token found');

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
  if (!token) throw new Error('No authentication token');

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
  const { userName } = useUser();
  const navigation = useNavigation();

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

  useEffect(() => {
    loadClients();
  }, []);

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
      // The AddClientModal already handles the API call and success case
      // We just need to refresh the clients list
      await loadClients(false); // Re-fetch
      handleCloseAddClientModal();
    } catch (error) {
      console.error('Error refreshing clients after adding:', error);
      // Don't show error alert since the client was already added successfully
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
      <Text style={styles.clientSpentCell}>{item.totalSpent || 0} PKR</Text>
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.userName}>{truncateUsername(userName)}</Text>
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

        {/* Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.clientIdHeader}>Client ID</Text>
            <Text style={styles.clientNameHeader}>Name</Text>
            <Text style={styles.clientPhoneHeader}>Phone</Text>
            <Text style={styles.clientVisitsHeader}>Visits</Text>
            <Text style={styles.clientSpentHeader}>Total Spent</Text>
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
  tableContainer: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: height * 0.015,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: width * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
  },
  clientIdHeader: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
  },
  clientNameHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
  },
  clientPhoneHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
  },
  clientVisitsHeader: {
    flex: 0.8,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'center',
  },
  clientSpentHeader: {
    flex: 1.2,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'right',
  },
  clientComingDateHeader: {
    flex: 1.2,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
  },
  clientActionHeader: {
    flex: 0.8,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.01,
    alignItems: 'center',
  },
  rowEven: {
    backgroundColor: '#2E2E2E',
  },
  rowOdd: {
    backgroundColor: '#1F1F1F',
  },
  clientIdCell: {
    flex: 1,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  clientNameCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  clientPhoneCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  clientVisitsCell: {
    flex: 0.8,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'center',
  },
  clientSpentCell: {
    flex: 1.2,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'right',
  },
  clientComingDateCell: {
    flex: 1.2,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  clientActionCell: {
    flex: 0.8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    padding: width * 0.005,
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
