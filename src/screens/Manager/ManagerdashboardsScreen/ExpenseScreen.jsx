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
import { useUser } from '../../../context/UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

// Import the new modal components
import AddExpenseModal from './modals/AddExpenseModal';
import ViewExpenseModal from './modals/ViewExpenseModal';

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

// Reuse the same placeholder image
const userProfileImagePlaceholder = require('../../../assets/images/foundation.jpeg');
// Dummy image for static expense entries (you need to create this file)
const dummyScreenshotImage = require('../../../assets/images/ss.jpg'); // You need to create this image

// Sample data for Expenses
const initialExpenseData = [
    {
        id: 'EXP001',
        name: 'Supplies',
        amount: '500 PKR',
        description: 'Team lunch',
        date: 'June 18, 2025',
        image: dummyScreenshotImage, // Added image for static data
    },
    {
        id: 'EXP002',
        name: 'Lunch',
        amount: '1200 PKR',
        description: 'Hair products',
        date: 'June 18, 2025',
        image: dummyScreenshotImage, // Added image for static data
    },
    {
        id: 'EXP003',
        name: 'Supplies',
        amount: '500 PKR',
        description: 'Team lunch',
        date: 'June 19, 2025',
        image: dummyScreenshotImage, // Added image for static data
    },
    {
        id: 'EXP004',
        name: 'Lunch',
        amount: '1200 PKR',
        description: 'Hair products',
        date: 'June 19, 2025',
        image: dummyScreenshotImage, // Added image for static data
    },
    {
        id: 'EXP005',
        name: 'Utilities',
        amount: '3000 PKR',
        description: 'Electricity bill',
        date: 'June 20, 2025',
        image: dummyScreenshotImage, // Added image for static data
    },
    {
        id: 'EXP006',
        name: 'Marketing',
        amount: '1500 PKR',
        description: 'Social media ads',
        date: 'June 20, 2025',
        image: dummyScreenshotImage, // Added image for static data
    },
    {
        id: 'EXP007',
        name: 'Supplies',
        amount: '750 PKR',
        description: 'Cleaning supplies',
        date: 'June 21, 2025',
        image: dummyScreenshotImage, // Added image for static data
    },
    {
        id: 'EXP008',
        name: 'Lunch',
        amount: '1000 PKR',
        description: 'Client meeting lunch',
        date: 'June 21, 2025',
        image: dummyScreenshotImage, // Added image for static data
    },
    {
        id: 'EXP009',
        name: 'Rent',
        amount: '50000 PKR',
        description: 'Monthly salon rent',
        date: 'June 22, 2025',
        image: dummyScreenshotImage, // Added image for static data
    },
    {
        id: 'EXP010',
        name: 'Maintenance',
        amount: '2000 PKR',
        description: 'Equipment repair',
        date: 'June 22, 2025',
        image: dummyScreenshotImage, // Added image for static data
    },
];

const ExpenseScreen = () => {
    const { userName, salonName } = useUser();
    const [searchText, setSearchText] = useState('');
    const [expenses, setExpenses] = useState(initialExpenseData); // State for expenses data

    // Date filtering states
    const [selectedFilterDate, setSelectedFilterDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // States for modals
    const [isAddExpenseModalVisible, setIsAddExpenseModalVisible] = useState(false);
    const [isViewExpenseModalVisible, setIsViewExpenseModalVisible] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

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

    // Filter expenses based on search text AND selected date
    const filteredExpenses = useMemo(() => {
        let currentData = [...expenses];

        // Apply text search filter
        if (searchText) {
            currentData = currentData.filter(item =>
                item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                item.description.toLowerCase().includes(searchText.toLowerCase()) ||
                item.id.toLowerCase().includes(searchText.toLowerCase()) ||
                item.date.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Apply date filter if a date is selected
        if (selectedFilterDate) {
            const formattedSelectedDate = moment(selectedFilterDate).format('MMM DD, YYYY');
            currentData = currentData.filter(item => {
                const itemDate = moment(item.date, 'MMMM DD, YYYY').format('MMM DD, YYYY');
                return itemDate === formattedSelectedDate;
            });
        }

        return currentData;
    }, [expenses, searchText, selectedFilterDate]);

    // Handlers for Add Expense Modal
    const handleOpenAddExpenseModal = () => {
        setIsAddExpenseModalVisible(true);
    };

    const handleCloseAddExpenseModal = () => {
        setIsAddExpenseModalVisible(false);
    };

    const handleSaveNewExpense = (newExpense) => {
        // Generate a simple unique ID for the new expense (in a real app, backend would do this)
        const newId = `EXP${String(expenses.length + 1).padStart(3, '0')}`;
        // Ensure the image property is included from newExpense, defaulting to null if not provided
        setExpenses(prevExpenses => [...prevExpenses, { ...newExpense, id: newId, image: newExpense.image || null }]);
        console.log('Expense added successfully!'); // Using console.log for feedback
    };

    // Handlers for View Expense Modal
    const handleOpenViewExpenseModal = (item) => {
        setSelectedExpense(item);
        setIsViewExpenseModalVisible(true);
    };

    const handleCloseViewExpenseModal = () => {
        setIsViewExpenseModalVisible(false);
        setSelectedExpense(null);
    };

    const renderItem = ({ item, index }) => (
        <TouchableOpacity
            style={[
                styles.row,
                { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
            ]}
            onPress={() => handleOpenViewExpenseModal(item)}
        >
            <Text style={styles.nameCell}>{item.name}</Text>
            <Text style={styles.amountCell}>{item.amount}</Text>
            <Text style={styles.descriptionCell}>{item.description}</Text>
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
                <Text style={styles.screenTitle}>Expense</Text>

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

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleOpenAddExpenseModal}
                    >
                        <Ionicons
                            name="add-circle-outline"
                            size={16}
                            color="#fff"
                            style={{ marginRight: 5 }}
                        />
                        <Text style={styles.addText}>Add Expense</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={styles.nameHeader}>Name</Text>
                <Text style={styles.amountHeader}>Amount</Text>
                <Text style={styles.descriptionHeader}>Description</Text>
                <Text style={styles.dateHeader}>Date</Text>
            </View>

            {/* Table Rows */}
            <FlatList
                data={filteredExpenses}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.id || index.toString()}
                style={styles.table}
                ListEmptyComponent={() => (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No expenses found.</Text>
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

            {/* Render the AddExpenseModal */}
            <AddExpenseModal
                isVisible={isAddExpenseModalVisible}
                onClose={handleCloseAddExpenseModal}
                onSave={handleSaveNewExpense}
            />

            {/* Render the ViewExpenseModal */}
            <ViewExpenseModal
                isVisible={isViewExpenseModalVisible}
                onClose={handleCloseViewExpenseModal}
                expenseDetails={selectedExpense}
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

    // --- Table Styles (Adapted for Expenses with Flex for Columns) ---
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
    nameHeader: {
        flex: 1.5, // Name column is a bit wider
        color: '#fff',
        fontWeight: '500',
        fontSize: width * 0.017,
        textAlign: 'left',
    },
    amountHeader: {
        flex: 1,
        color: '#fff',
        fontWeight: '500',
        fontSize: width * 0.017,
        textAlign: 'left',
    },
    descriptionHeader: {
        flex: 2, // Description column is widest
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
        paddingVertical: height * 0.017,
        paddingHorizontal: width * 0.005,
        alignItems: 'center',
    },
    // Data cells with flex distribution matching headers
    nameCell: {
        flex: 1.5,
        color: '#fff',
        fontSize: width * 0.016,
        textAlign: 'left',
        fontWeight: '400'
    },
    amountCell: {
        flex: 1,
        color: '#fff',
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    descriptionCell: {
        flex: 2,
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
});

export default ExpenseScreen;
