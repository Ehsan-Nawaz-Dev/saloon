import React, { useState, useMemo, useCallback } from 'react'; // Added useCallback
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
  ActivityIndicator, // Added for loading state
  Alert, // For basic alerts, replace with custom if available
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../../../context/UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Import useNavigation and useFocusEffect

// Import the new modal components
import AddAdvanceSalaryModal from './modals/AddAdvanceSalaryModal';
import ViewAdvanceSalaryModal from './modals/ViewAdvanceSalaryModal';

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

const userProfileImagePlaceholder = require('../../../assets/images/foundation.jpeg');
// Dummy image for static advance salary entries
const dummyScreenshotImage = require('../../../assets/images/ss.jpg'); // You need to create this image

// Sample data for Advance Salary
const initialAdvanceSalaryData = [
  {
    id: 'EMP001',
    name: 'Ali Ahmed',
    amount: 30000, // Changed to number
    date: 'June 20, 2025',
    image: dummyScreenshotImage,
  },
  {
    id: 'EMP002',
    name: 'Zainab Malik',
    amount: 25000, // Changed to number
    date: 'June 20, 2025',
    image: dummyScreenshotImage,
  },
  {
    id: 'EMP003',
    name: 'Ali Ahmed',
    amount: 30000, // Changed to number
    date: 'June 21, 2025',
    image: dummyScreenshotImage,
  },
  {
    id: 'EMP004',
    name: 'Zainab Malik',
    amount: 25000, // Changed to number
    date: 'June 21, 2025',
    image: dummyScreenshotImage,
  },
  {
    id: 'EMP005',
    name: 'Ali Ahmed',
    amount: 30000, // Changed to number
    date: 'June 22, 2025',
    image: dummyScreenshotImage,
  },
  {
    id: 'EMP006',
    name: 'Zainab Malik',
    amount: 25000, // Changed to number
    date: 'June 22, 2025',
    image: dummyScreenshotImage,
  },
  {
    id: 'EMP007',
    name: 'Ali Ahmed',
    amount: 30000, // Changed to number
    date: 'June 23, 2025',
    image: dummyScreenshotImage,
  },
  {
    id: 'EMP008',
    name: 'Zainab Malik',
    amount: 25000, // Changed to number
    date: 'June 23, 2025',
    image: dummyScreenshotImage,
  },
  {
    id: 'EMP009',
    name: 'Ali Ahmed',
    amount: 30000, // Changed to number
    date: 'June 24, 2025',
    image: dummyScreenshotImage,
  },
  {
    id: 'EMP010',
    name: 'Zainab Malik',
    amount: 25000, // Changed to number
    date: 'June 24, 2025',
    image: dummyScreenshotImage,
  },
];

const AdvanceSalary = () => {
  const navigation = useNavigation(); // Initialize navigation hook
  const { userName, salonName } = useUser();
  const [searchText, setSearchText] = useState('');
  const [advanceSalaries, setAdvanceSalaries] = useState([]); // Initialize as empty, will fetch on focus
  const [loading, setLoading] = useState(true); // Add loading state for data fetch

  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // States for modals
  const [isAddAdvanceSalaryModalVisible, setIsAddAdvanceSalaryModalVisible] =
    useState(false);
  const [isViewAdvanceSalaryModalVisible, setIsViewAdvanceSalaryModalVisible] =
    useState(false);
  const [selectedAdvanceSalary, setSelectedAdvanceSalary] = useState(null);

  // Function to simulate fetching advance salary ......data (replace with actual API call)
  const fetchAdvanceSalaryData = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 0.1));
      // In a real app, you'd fetch data from your backend here
      setAdvanceSalaries(initialAdvanceSalaryData); // Using static data for now
    } catch (error) {
      console.error('Failed to fetch advance salary data:', error);
      Alert.alert('Error', 'Failed to load advance salary data.'); // Use Alert for user feedback
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies, as initial data is static

  // Use useFocusEffect to refetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAdvanceSalaryData();
      // Optionally reset filters when screen gains focus
      setSelectedFilterDate(null);
      setSearchText('');
    }, [fetchAdvanceSalaryData]),
  );

  // Handler for date selection
  const onDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');

    if (date) {
      setSelectedFilterDate(date);
    } else {
      setSelectedFilterDate(null);
    }
  };

  // Handler to open the date picker
  const handleOpenDatePicker = () => {
    setShowDatePicker(true);
  };

  // Filter advance salaries based on search text AND selected date
  const filteredAdvanceSalaries = useMemo(() => {
    let currentData = [...advanceSalaries];

    // Apply text search filter
    if (searchText) {
      currentData = currentData.filter(
        item =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.id.toLowerCase().includes(searchText.toLowerCase()) ||
          String(item.amount)
            .toLowerCase()
            .includes(searchText.toLowerCase()) || // Convert amount to string for search
          item.date.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Apply date filter if a date is selected
    if (selectedFilterDate) {
      const formattedSelectedDate =
        moment(selectedFilterDate).format('MMM DD, YYYY');
      currentData = currentData.filter(item => {
        const itemDate = moment(item.date, 'MMMM DD, YYYY').format(
          'MMM DD, YYYY',
        );
        return itemDate === formattedSelectedDate;
      });
    }

    return currentData;
  }, [advanceSalaries, searchText, selectedFilterDate]);

  // Handlers for Add Advance Salary Modal
  const handleOpenAddAdvanceSalaryModal = () => {
    setIsAddAdvanceSalaryModalVisible(true);
  };

  const handleCloseAddAdvanceSalaryModal = () => {
    setIsAddAdvanceSalaryModalVisible(false);
    // After closing add modal, refresh data
    fetchAdvanceSalaryData();
  };

  const handleSaveNewAdvanceSalary = newSalary => {
    // In a real API scenario, you'd send newSalary to your backend.
    // Upon successful API response, you'd then refetch data to update the list.
    // For now, we'll simulate adding to local state.
    const newId = `EMP${String(advanceSalaries.length + 1).padStart(3, '0')}`;
    setAdvanceSalaries(prevSalaries => [
      ...prevSalaries,
      { ...newSalary, id: newId, image: newSalary.image || null },
    ]);
    Alert.alert('Success', 'Advance Salary added successfully!'); // Using Alert for now
    handleCloseAddAdvanceSalaryModal(); // Close modal after saving
  };

  // Handlers for View Advance Salary Modal
  const handleOpenViewAdvanceSalaryModal = item => {
    setSelectedAdvanceSalary(item);
    setIsViewAdvanceSalaryModalVisible(true);
  };

  const handleCloseViewAdvanceSalaryModal = () => {
    setIsViewAdvanceSalaryModalVisible(false);
    setSelectedAdvanceSalary(null);
  };

  // Function to navigate to LiveCheckupScreen for "Face Scan for Request"
  const handleNavigateLiveCheckup = () => {
    navigation.navigate('LiveCheckScreenSalary', { actionType: 'request' }); // Or 'faceScan' if you define that type
  };

  const renderItem = ({ item, index }) => (
    // Make the entire row TouchableOpacity to trigger View Modal
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
      ]}
      onPress={() => handleOpenViewAdvanceSalaryModal(item)}
    >
      <Text style={styles.employeeIdCell}>{item.id}</Text>
      <Text style={styles.nameCell}>{item.name}</Text>
      {/* Format amount for display */}
      <Text style={styles.amountCell}>{`${Number(
        item.amount || 0,
      ).toLocaleString()} PKR`}</Text>
      <Text style={styles.dateCell}>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.userName}>Manager</Text>
          </View>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search anything"
              placeholderTextColor="#A9A9A9"
              value={searchText}
              onChangeText={setSearchText}
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

      <View style={styles.controls}>
        <Text style={styles.screenTitle}>Advance Salary</Text>

        <View style={styles.filterActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleOpenDatePicker}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.filterText}>
              {selectedFilterDate
                ? moment(selectedFilterDate).format('MMM DD, YYYY')
                : 'Date'}
            </Text>

            {selectedFilterDate && (
              <TouchableOpacity
                onPress={() => setSelectedFilterDate(null)}
                style={{ marginLeft: 5 }}
              >
                <Ionicons name="close-circle" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Button for Face Scan Request - navigates to LiveCheckupScreen */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleNavigateLiveCheckup}
          >
            <Text style={styles.addText}>Face Scan for Request</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#A98C27" />
          <Text style={styles.loadingText}>Loading advance salaries...</Text>
        </View>
      ) : (
        <>
          <View style={styles.tableHeader}>
            <Text style={styles.employeeIdHeader}>Employee ID</Text>
            <Text style={styles.nameHeader}>Name</Text>
            <Text style={styles.amountHeader}>Amount</Text>
            <Text style={styles.dateHeader}>Date</Text>
          </View>

          {/* Table Rows */}
          <FlatList
            data={filteredAdvanceSalaries}
            renderItem={renderItem}
            keyExtractor={(item, index) =>
              item.id + item.date + index.toString()
            }
            style={styles.table}
            ListEmptyComponent={() => (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  No advance salary records found.
                </Text>
              </View>
            )}
          />
        </>
      )}

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedFilterDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {/* Render the AddAdvanceSalaryModal */}
      <AddAdvanceSalaryModal
        isVisible={isAddAdvanceSalaryModalVisible}
        onClose={handleCloseAddAdvanceSalaryModal}
        onSave={handleSaveNewAdvanceSalary}
      />

      {/* Render the ViewAdvanceSalaryModal */}
      <ViewAdvanceSalaryModal
        isVisible={isViewAdvanceSalaryModalVisible}
        onClose={handleCloseViewAdvanceSalaryModal}
        salaryDetails={selectedAdvanceSalary}
      />
    </View>
  );
};
export default AdvanceSalary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingHorizontal: width * 0.02,
    paddingTop: height * 0.02,
  },
  // --- Header Styles (Reused from previous screens) ---
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
    borderRadius: 8,
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
  // --- End Header Styles ---

  // --- Controls Section Styles ---
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
    marginTop: height * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
    paddingBottom: height * 0.03,
  },
  screenTitle: {
    color: '#fff',
    fontSize: width * 0.029,
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.01, // Added gap for spacing between buttons
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.015,
    borderRadius: 6,
    // marginRight: width * 0.01, // Replaced by gap
  },
  filterText: {
    color: '#fff',
    fontSize: width * 0.019,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A98C27',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.015,
    borderRadius: 6,
  },
  addText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.014,
  },
  // --- End Controls Section Styles ---

  // --- Table Styles (Adapted for Advance Salary with Flex for Columns) ---
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: height * 0.01,
    paddingVertical: height * 0.02,
    backgroundColor: '#2B2B2B',
    paddingHorizontal: width * 0.005,
    borderRadius: 5,
  },
  // Header cells with flex distribution (adjusted for 4 columns)
  employeeIdHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  nameHeader: {
    flex: 2,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  amountHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },
  dateHeader: {
    flex: 1.5,
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.017,
    textAlign: 'left',
  },

  row: {
    flexDirection: 'row',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.005,
    alignItems: 'center',
  },
  // Data cells with flex distribution matching headers
  employeeIdCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  nameCell: {
    flex: 2,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  amountCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  dateCell: {
    flex: 1.5,
    color: '#fff',
    fontSize: width * 0.013,
    textAlign: 'left',
  },
  table: {
    marginTop: height * 0.005,
    borderRadius: 5,
    overflow: 'hidden',
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
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.8)', // Semi-transparent dark background
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10, // Ensure it's on top
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: width * 0.02,
  },
});
