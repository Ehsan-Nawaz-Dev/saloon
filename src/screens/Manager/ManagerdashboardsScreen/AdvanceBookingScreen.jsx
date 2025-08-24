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
    Platform, // Import Platform for OS-specific logic
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../../../context/UserContext';
// Import the DatePicker component
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment'; // For easier date parsing and formatting

// Import the new modal components
import AddBookingModal from './modals/AddBookingModal';
import ViewBookingModal from './modals/ViewBookingModal';

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

// Reuse the same placeholder image for user profile
const userProfileImagePlaceholder = require('../../../assets/images/foundation.jpeg');

// Sample data for Advance Booking (UPDATED to use local asset paths)
const initialAdvanceBookingData = [
    {
        id: 'BOOK001',
        clientName: 'Ayesha Noor',
        dateTime: 'June 17, 2025 10:00 AM',
        phoneNumber: '0300-4874356',
        reminder: 'Reminder set for June 17, 09:00 AM',
        description: 'Haircut and styling appointment.',
        imageUri: require('../../../assets/images/2.jpeg'),
        advancePayment: '500 PKR',
    },
    {
        id: 'BOOK002',
        clientName: 'Hassan Iqbal',
        dateTime: 'June 17, 2025 02:00 PM',
        phoneNumber: '0300-4874356',
        reminder: 'Reminder set for June 18, 02:00 PM',
        description: 'Beard trim and facial.',
        imageUri: require('../../../assets/images/1.png'),
        advancePayment: '200 PKR',
    },
    {
        id: 'BOOK003',
        clientName: 'Ayesha Noor',
        dateTime: 'June 18, 2025 10:00 AM',
        phoneNumber: '0300-4874356',
        reminder: 'Reminder set for June 18, 09:00 AM',
        description: 'Coloring and deep conditioning.',
        imageUri: require('../../../assets/images/3.jpeg'),
        advancePayment: '1000 PKR',
    },
    {
        id: 'BOOK004',
        clientName: 'Hassan Iqbal',
        dateTime: 'June 18, 2025 02:00 PM',
        phoneNumber: '0300-4874356',
        reminder: 'Reminder set for June 19, 02:00 PM',
        description: 'Manicure and pedicure.',
        imageUri: require('../../../assets/images/4.jpeg'),
        advancePayment: '0.00 PKR',
    },
    {
        id: 'BOOK005',
        clientName: 'Ayesha Noor',
        dateTime: 'June 19, 2025 10:00 AM',
        phoneNumber: '0300-4874356',
        reminder: 'Reminder set for June 19, 09:00 AM',
        description: 'Bridal makeup trial.',
        imageUri: require('../../../assets/images/5.jpeg'),
        advancePayment: '2000 PKR',
    },
    {
        id: 'BOOK006',
        clientName: 'Hassan Iqbal',
        dateTime: 'June 19, 2025 02:00 PM',
        phoneNumber: '0300-4874356',
        reminder: 'Reminder set for June 20, 02:00 PM',
        description: 'Hair treatment.',
        imageUri: require('../../../assets/images/6.jpeg'),
        advancePayment: '0.00 PKR',
    },
    {
        id: 'BOOK007',
        clientName: 'Ayesha Noor',
        dateTime: 'June 20, 2025 10:00 AM',
        phoneNumber: '0300-4874356',
        reminder: 'Reminder set for June 20, 09:00 AM',
        description: 'Full body wax.',
        imageUri: require('../../../assets/images/7.jpeg'),
        advancePayment: '300 PKR',
    },
    {
        id: 'BOOK008',
        clientName: 'Bilal Khan',
        dateTime: 'June 20, 2025 02:00 PM',
        phoneNumber: '0300-4874356',
        reminder: 'Reminder set for June 21, 02:00 PM',
        description: 'Shampoo and blow-dry.',
        imageUri: require('../../../assets/images/8.jpeg'),
        advancePayment: '0.00 PKR',
    },
    {
        id: 'BOOK009',
        clientName: 'Hammad Ali',
        dateTime: 'June 21, 2025 10:00 AM',
        phoneNumber: '0300-4874356',
        reminder: 'Reminder set for June 21, 09:00 AM',
        description: 'Facial and cleanup.',
        imageUri: require('../../../assets/images/9.jpeg'),
        advancePayment: '400 PKR',
    },
    {
        id: 'BOOK010',
        clientName: 'Zainab Abbas',
        dateTime: 'June 21, 2025 02:00 PM',
        phoneNumber: '0300-4874356',
        reminder: 'Reminder set for June 22, 02:00 PM',
        description: 'Hair coloring.',
        imageUri: require('../../../assets/images/10.jpeg'),
        advancePayment: '700 PKR',
    },

];

const AdvanceBookingScreen = () => {
    const { userName, salonName } = useUser();
    const [searchText, setSearchText] = useState('');
    const [bookings, setBookings] = useState(initialAdvanceBookingData);

    // New state for date filtering
    const [selectedFilterDate, setSelectedFilterDate] = useState(null); // Stores the selected date object
    const [showDatePicker, setShowDatePicker] = useState(false); // Controls date picker visibility

    // States for modals
    const [isAddBookingModalVisible, setIsAddBookingModalVisible] = useState(false);
    const [isViewBookingModalVisible, setIsViewBookingModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Handler for date selection
    const onDateChange = (event, date) => {
        setShowDatePicker(Platform.OS === 'ios'); // Hide picker only on iOS after selection

        if (date) { // A date was selected (not cancelled)
            setSelectedFilterDate(date);
        } else { // Picker was cancelled
            setSelectedFilterDate(null); // Clear selected date if cancelled
        }
    };

    // Handler to open the date picker
    const handleOpenDatePicker = () => {
        setShowDatePicker(true);
    };

    // Filter bookings based on search text AND selected date
    const filteredBookings = useMemo(() => {
        let currentData = [...bookings];

        // Apply text search filter
        if (searchText) {
            currentData = currentData.filter(item =>
                item.clientName.toLowerCase().includes(searchText.toLowerCase()) ||
                item.phoneNumber.toLowerCase().includes(searchText.toLowerCase()) ||
                item.dateTime.toLowerCase().includes(searchText.toLowerCase()) ||
                item.reminder.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Apply date filter if a date is selected
        if (selectedFilterDate) {
            const formattedSelectedDate = moment(selectedFilterDate).format('MMM DD, YYYY'); // e.g., "June 22, 2025"
            currentData = currentData.filter(item => {
                // Parse the dateTime from item and format it to match the selected date format
                const itemDate = moment(item.dateTime, 'MMMM DD, YYYY hh:mm A').format('MMM DD, YYYY');
                return itemDate === formattedSelectedDate;
            });
        }

        return currentData;
    }, [bookings, searchText, selectedFilterDate]); // Add selectedFilterDate to dependencies

    // Handlers for Add Booking Modal
    const handleOpenAddBookingModal = () => {
        setIsAddBookingModalVisible(true);
    };

    const handleCloseAddBookingModal = () => {
        setIsAddBookingModalVisible(false);
    };

    const handleSaveNewBooking = (newBooking) => {
        // Generate a simple unique ID (in a real app, backend would do this)
        const newId = `BOOK${String(bookings.length + 1).padStart(3, '0')}`;
        setBookings(prevBookings => [...prevBookings, { ...newBooking, id: newId }]);
        alert('Booking added successfully!');
    };

    // Handlers for View Booking Modal
    const handleOpenViewBookingModal = (item) => {
        setSelectedBooking(item);
        setIsViewBookingModalVisible(true);
    };

    const handleCloseViewBookingModal = () => {
        setIsViewBookingModalVisible(false);
        setSelectedBooking(null);
    };


    const renderItem = ({ item, index }) => (
        // Make the entire row TouchableOpacity to trigger View Modal
        <TouchableOpacity
            style={[
                styles.row,
                { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
            ]}
            onPress={() => handleOpenViewBookingModal(item)}
        >
            <Text style={styles.clientNameCell}>{item.clientName}</Text>
            <Text style={styles.dateTimeCell}>{item.dateTime}</Text>
            <Text style={styles.phoneNumberCell}>{item.phoneNumber}</Text>
            <Text style={styles.reminderCell}>{item.reminder}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header Section (Reused from previous screens) */}
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

            {/* Controls Section */}
            <View style={styles.controls}>
                <Text style={styles.screenTitle}>Advance Booking</Text>

                <View style={styles.filterActions}>
                    {/* Date Filter - Attach onPress to open date picker */}
                    <TouchableOpacity style={styles.filterButton} onPress={handleOpenDatePicker}>
                        <Ionicons name="calendar-outline" size={16} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={styles.filterText}>
                            {selectedFilterDate ? moment(selectedFilterDate).format('MMM DD, YYYY') : 'Date'}
                        </Text>
                        {/* Add a clear button if a date is selected */}
                        {selectedFilterDate && (
                            <TouchableOpacity onPress={() => setSelectedFilterDate(null)} style={{ marginLeft: 5 }}>
                                <Ionicons name="close-circle" size={16} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>

                    {/* Add Booking Button - MODIFIED to open modal */}
                    <TouchableOpacity style={styles.addButton} onPress={handleOpenAddBookingModal}>
                        <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={styles.addText}>Add Booking</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={styles.clientNameHeader}>Client Name</Text>
                <Text style={styles.dateTimeHeader}>Date & Time</Text>
                <Text style={styles.phoneNumberHeader}>Phone Number</Text>
                <Text style={styles.reminderHeader}>Reminder</Text>
            </View>

            {/* Table Rows */}
            <FlatList
                data={filteredBookings}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.id || index.toString()}
                style={styles.table}
                ListEmptyComponent={() => (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No advance bookings found.</Text>
                    </View>
                )}
            />

            {/* Render the DateTimePicker conditionally */}
            {showDatePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={selectedFilterDate || new Date()} // Use selected date or current date
                    mode="date" // Only date mode
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'} // 'spinner' for iOS, 'default' for Android
                    onChange={onDateChange}
                />
            )}

            {/* Render the AddBookingModal */}
            <AddBookingModal
                isVisible={isAddBookingModalVisible}
                onClose={handleCloseAddBookingModal}
                onSave={handleSaveNewBooking}
            />

            {/* Render the ViewBookingModal */}
            <ViewBookingModal
                isVisible={isViewBookingModalVisible}
                onClose={handleCloseViewBookingModal}
                bookingDetails={selectedBooking}
            />
        </View>
    );
};

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
        marginRight: width * 0.010,
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
        paddingBottom: height*0.03,
       
    },
    screenTitle: {
        color: '#fff',
        fontSize: width * 0.029,
        fontWeight: '600',
    },
    filterActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        paddingVertical: height * 0.01,
        paddingHorizontal: width * 0.015,
        borderRadius: 6,
        marginRight: width * 0.01,
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

    // --- Table Styles (Adapted for Advance Booking with Flex for Columns) ---
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
    clientNameHeader: {
        flex: 1.5,
        color: '#fff',
        fontWeight: '600',
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    dateTimeHeader: {
        flex: 2,
        color: '#fff',
        fontWeight: '600',
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    phoneNumberHeader: {
        flex: 1.5,
        color: '#fff',
        fontWeight: '600',
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    reminderHeader: {
        flex: 2,
        color: '#fff',
        fontWeight: '600',
        fontSize: width * 0.013,
        textAlign: 'left',
    },

    row: {
        flexDirection: 'row',
        paddingVertical: height * 0.015,
        paddingHorizontal: width * 0.005,
        alignItems: 'center',
    },
    // Data cells with flex distribution matching headers
    clientNameCell: {
        flex: 1.5,
        color: '#fff',
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    dateTimeCell: {
        flex: 2,
        color: '#fff',
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    phoneNumberCell: {
        flex: 1.5,
        color: '#fff',
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    reminderCell: {
        flex: 2,
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
});

export default AdvanceBookingScreen;