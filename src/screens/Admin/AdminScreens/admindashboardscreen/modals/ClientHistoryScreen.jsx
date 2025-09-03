import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import ViewClientModal from './ViewClientModal';
import moment from 'moment';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Function to get auth token from AsyncStorage
const getAuthToken = async () => {
  try {
    const authData = await AsyncStorage.getItem('adminAuth');
    if (authData) {
      const { token } = JSON.parse(authData);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Failed to get auth token from storage:', error);
    return null;
  }
};

const ClientHistoryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { client } = route.params;

  const [isViewBillModalVisible, setIsViewBillModalVisible] = useState(false);
  const [selectedBillDetails, setSelectedBillDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch client history from API
  const fetchClientHistory = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      console.log('Fetching client history for client:', client);
      console.log('Client ID:', client._id);

      const apiUrl = `${BASE_URL}/clients/${client._id}/history`;
      console.log('API URL:', apiUrl);

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        setClientData(response.data.client);
      } else {
        setError('Failed to fetch client history');
      }
    } catch (error) {
      console.error('Error fetching client history:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError('Failed to load client history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientHistory();
  }, [client._id]);

  const visitsData = useMemo(() => {
    return clientData?.visits || [];
  }, [clientData]);

  const handleOpenViewBillModal = visit => {
    const billData = {
      ...clientData, // Client ki base details (name, id, etc.)
      ...visit, // Visit ki details (visitId, date, services, etc.)
    };
    setSelectedBillDetails(billData);
    setIsViewBillModalVisible(true);
  };

  const handleCloseViewBillModal = () => {
    setIsViewBillModalVisible(false);
    setSelectedBillDetails(null);
  };

  const renderVisitItem = ({ item, index }) => (
    <View
      style={[
        styles.row,
        { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
      ]}
    >
      <Text style={styles.visitIdCell}>{item.visitId}</Text>
      <Text style={styles.visitDateCell}>
        {moment(item.date).format('MMM DD, YYYY hh:mm A')}
      </Text>
      <Text style={styles.visitServiceCountCell}>
        {item.services?.length || 0} services
      </Text>
      <Text style={styles.visitAmountCell}>{item.totalAmount || 0} PKR</Text>
      <View style={styles.visitActionCell}>
        <TouchableOpacity
          onPress={() => handleOpenViewBillModal(item)}
          style={styles.actionButton}
        >
          <Ionicons
            name="receipt-outline"
            size={width * 0.018}
            color="#A98C27"
          />
          <Text style={styles.actionButtonText}> View Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A98C27" />
        <Text style={styles.loadingText}>Loading client history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchClientHistory}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back-outline"
            size={width * 0.04}
            color="#fff"
          />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            Visit History for {clientData?.name || client.name}
          </Text>
          <Text style={styles.headerSubtitle}>
            Total Visits: {clientData?.totalVisits || 0} | Total Spent:{' '}
            {clientData?.totalSpent || 0} PKR
          </Text>
        </View>
      </View>

      <View style={styles.contentArea}>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.visitIdHeader}>Visit ID</Text>
            <Text style={styles.visitDateHeader}>Date & Time</Text>
            <Text style={styles.visitServiceHeader}>Services</Text>
            <Text style={styles.visitAmountHeader}>Amount</Text>
            <Text style={styles.visitActionHeader}>Action</Text>
          </View>

          <FlatList
            data={visitsData}
            renderItem={renderVisitItem}
            keyExtractor={item => item.visitId}
            style={styles.table}
            ListEmptyComponent={() => (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No visit history found.</Text>
              </View>
            )}
          />
        </View>
      </View>

      <ViewClientModal
        isVisible={isViewBillModalVisible}
        onClose={handleCloseViewBillModal}
        clientDetails={selectedBillDetails}
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
    paddingBottom: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    marginBottom: height * 0.02,
  },
  backButton: {
    paddingRight: width * 0.02,
  },
  headerInfo: {
    marginLeft: width * 0.02,
  },
  headerTitle: {
    color: '#fff',
    fontSize: width * 0.025,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#A9A9A9',
    fontSize: width * 0.018,
    marginTop: 2,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: width * 0.005,
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
  visitIdHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
  },
  visitDateHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
  },
  visitServiceHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'left',
  },
  visitAmountHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
    textAlign: 'right',
  },
  visitActionHeader: {
    flex: 1.5,
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
  visitIdCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  visitDateCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  visitServiceCountCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  visitAmountCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'right',
  },
  visitActionCell: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#A98C27',
    fontSize: width * 0.013,
    marginLeft: 5,
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
    color: '#fff',
    fontSize: width * 0.02,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: width * 0.02,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#A98C27',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: width * 0.018,
    fontWeight: 'bold',
  },
});

export default ClientHistoryScreen;
