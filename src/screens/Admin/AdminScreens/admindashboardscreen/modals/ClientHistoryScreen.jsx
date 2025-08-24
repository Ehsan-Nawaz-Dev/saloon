import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import ViewClientModal from './ViewClientModal';
import moment from 'moment';

const { width, height } = Dimensions.get('window');

const ClientHistoryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { client } = route.params;

  const [isViewBillModalVisible, setIsViewBillModalVisible] = useState(false);
  const [selectedBillDetails, setSelectedBillDetails] = useState(null); // Bill details ko state mein store karein

  const visitsData = useMemo(() => {
    return client.visits;
  }, [client]);

  const handleOpenViewBillModal = visit => {
    const billData = {
      ...client, // Client ki base details (name, id, etc.)
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
      <Text style={styles.visitDateCell}>{item.date}</Text>
      <Text style={styles.visitServiceCountCell}>
        {item.services.length} services
      </Text>
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
        <Text style={styles.headerTitle}>Visit History for {client.name}</Text>
      </View>

      <View style={styles.contentArea}>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.visitIdHeader}>Visit ID</Text>
            <Text style={styles.visitDateHeader}>Date</Text>
            <Text style={styles.visitServiceHeader}>Services</Text>
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
  headerTitle: {
    color: '#fff',
    fontSize: width * 0.025,
    fontWeight: 'bold',
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
});

export default ClientHistoryScreen;
