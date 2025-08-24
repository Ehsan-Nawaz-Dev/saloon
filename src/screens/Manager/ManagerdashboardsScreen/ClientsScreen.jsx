// src/screens/admin/ClientsScreen/ClientsScreen.jsx

import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../../../context/UserContext';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native'; // NavigatioN ko import karein

// AddClientModal ko rakhein, baaki View/Delete modal abhi ke liye hata dete hain
import AddClientModal from './modals/AddClientModal';
import DeleteClientModal from './modals/DeleteClientModal';

const { width, height } = Dimensions.get('window');

const userProfileImagePlaceholder = require('../../../assets/images/foundation.jpeg');

// InitialClientsData ko ab unique clients ke liye group karenge
// Har client object mein ek 'visits' array hoga jisme unke har visit ka data hoga
const allClientsData = [
  {
    id: 'CLI001',
    name: 'Ali Ahmed',
    phoneNumber: '03XX-XXXXXXX',
    visits: [
      {
        visitId: 'VIS001_01',
        date: 'June 25, 2025',
        services: [
          { name: 'Haircut', price: 50 },
          { name: 'Shave', price: 20 },
        ],
      },
      {
        visitId: 'VIS001_02',
        date: 'July 10, 2025',
        services: [
          { name: 'Facial', price: 100 },
          { name: 'Massage', price: 80 },
        ],
      },
      {
        visitId: 'VIS001_03',
        date: 'August 01, 2025',
        services: [
          { name: 'Haircut', price: 50 },
          { name: 'Hair Color', price: 150 },
        ],
      },
    ],
  },
  {
    id: 'CLI002',
    name: 'Sara Khan',
    phoneNumber: '03XX-XXXXXXX',
    visits: [
      {
        visitId: 'VIS002_01',
        date: 'June 25, 2025',
        services: [
          { name: 'Manicure', price: 50 },
          { name: 'Pedicure', price: 60 },
        ],
      },
      {
        visitId: 'VIS002_02',
        date: 'July 20, 2025',
        services: [{ name: 'Makeup', price: 200 }],
      },
    ],
  },
  {
    id: 'CLI003',
    name: 'Zainab Abbas',
    phoneNumber: '03XX-XXXXXXX',
    visits: [
      {
        visitId: 'VIS003_01',
        date: 'June 26, 2025',
        services: [{ name: 'Blunt Cut', price: 50 }],
      },
    ],
  },
  {
    id: 'CLI004',
    name: 'Ahmed Raza',
    phoneNumber: '03XX-XXXXXXX',
    visits: [
      {
        visitId: 'VIS004_01',
        date: 'June 26, 2025',
        services: [
          { name: 'Hair Wash', price: 20 },
          { name: 'Facial', price: 100 },
        ],
      },
      {
        visitId: 'VIS004_02',
        date: 'July 05, 2025',
        services: [{ name: 'Haircut', price: 50 }],
      },
    ],
  },
];

const ClientsScreen = () => {
  const { userName, salonName } = useUser();
  const navigation = useNavigation(); // navigation hook use karein
  const [searchText, setSearchText] = useState('');
  const [clientsData, setClientsData] = useState(allClientsData);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFilterDate, setSelectedFilterDate] = useState(null);

  const [isAddClientModalVisible, setIsAddClientModalVisible] = useState(false);
  const [isDeleteClientModalVisible, setIsDeleteClientModalVisible] =
    useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Ab client ka data unique hona chahiye (jaise aapne bataya)
  const uniqueClients = useMemo(() => {
    const clientMap = new Map();
    clientsData.forEach(client => {
      if (!clientMap.has(client.id)) {
        clientMap.set(client.id, client);
      }
    });
    return Array.from(clientMap.values());
  }, [clientsData]);

  const filteredClients = useMemo(() => {
    let currentData = [...uniqueClients];

    if (searchText) {
      currentData = currentData.filter(
        client =>
          client.name.toLowerCase().includes(searchText.toLowerCase()) ||
          client.id.toLowerCase().includes(searchText.toLowerCase()) ||
          client.phoneNumber.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    if (selectedFilterDate) {
      const formattedSelectedDate =
        moment(selectedFilterDate).format('MMMM DD, YYYY');
      currentData = currentData.filter(client => {
        // Filter based on any of the client's visit dates
        return client.visits.some(
          visit =>
            moment(visit.date, 'MMMM DD, YYYY').format('MMMM DD, YYYY') ===
            formattedSelectedDate,
        );
      });
    }
    return currentData;
  }, [uniqueClients, searchText, selectedFilterDate]);

  // Function to generate the next sequential Client ID
  const generateNextClientId = () => {
    let maxIdNumber = 0;
    clientsData.forEach(client => {
      const match = client.id.match(/^CLI(\d+)$/);
      if (match && match[1]) {
        const idNumber = parseInt(match[1], 10);
        if (!isNaN(idNumber) && idNumber > maxIdNumber) {
          maxIdNumber = idNumber;
        }
      }
    });

    const nextIdNumber = maxIdNumber + 1;
    const nextFormattedId = `CLI${String(nextIdNumber).padStart(3, '0')}`;
    return nextFormattedId;
  };

  const handleOpenAddClientModal = () => {
    setIsAddClientModalVisible(true);
  };

  const handleCloseAddClientModal = () => {
    setIsAddClientModalVisible(false);
  };

  const handleSaveNewClient = clientDataFromModal => {
    const newClientId = generateNextClientId();

    // Add a default first visit to the new client
    const newClient = {
      id: newClientId,
      name: clientDataFromModal.name,
      phoneNumber: clientDataFromModal.phoneNumber,
      // A new client will have their first visit on the current date
      visits: [
        {
          visitId: `${newClientId}_01`,
          date: moment().format('MMMM DD, YYYY'),
          services: [{ name: 'Default Service', price: 0 }],
        },
      ],
    };

    setClientsData(prevData => [...prevData, newClient]);
    alert('Client added successfully!');
    handleCloseAddClientModal();
  };

  // Yahan par changes hain - ab yeh function navigation use karega
  const handleViewClientHistory = client => {
    // 'ClientHistory' screen par navigate karein aur client ka data pass karein
    navigation.navigate('ClientHistory', { client });
  };

  const handleOpenDeleteClientModal = client => {
    setSelectedClient(client);
    setIsDeleteClientModalVisible(true);
  };

  const handleCloseDeleteClientModal = () => {
    setIsDeleteClientModalVisible(false);
    setSelectedClient(null);
  };

  const handleDeleteClientConfirm = () => {
    if (selectedClient) {
      setClientsData(prevData =>
        prevData.filter(client => client.id !== selectedClient.id),
      );
      alert(`Client ${selectedClient.name} deleted.`);
    }
    handleCloseDeleteClientModal();
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');

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

  const renderClientItem = ({ item, index }) => (
    <View
      style={[
        styles.row,
        { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
      ]}
    >
      <Text style={styles.clientIdCell}>{item.id}</Text>
      <Text style={styles.clientNameCell}>{item.name}</Text>
      <Text style={styles.clientPhoneCell}>{item.phoneNumber}</Text>
      {/* Ab coming date ki jagah last visit date show karein */}
      <Text style={styles.clientComingDateCell}>
        {item.visits[item.visits.length - 1].date}
      </Text>
      <View style={styles.clientActionCell}>
        {/* Yahan par functionality update ki hai */}
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

  return (
    <View style={styles.container}>
      {/* Header Section */}
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
              onChangeText={setSearchText}
              value={searchText}
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

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.clientIdHeader}>Client ID</Text>
            <Text style={styles.clientNameHeader}>Name</Text>
            <Text style={styles.clientPhoneHeader}>Phone Number</Text>
            <Text style={styles.clientComingDateHeader}>Last Visit</Text>
            <Text style={styles.clientActionHeader}>Action</Text>
          </View>

          <FlatList
            data={filteredClients}
            renderItem={renderClientItem}
            keyExtractor={item => item.id}
            style={styles.table}
            ListEmptyComponent={() => (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No clients found.</Text>
              </View>
            )}
          />
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedFilterDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

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
});

export default ClientsScreen;
