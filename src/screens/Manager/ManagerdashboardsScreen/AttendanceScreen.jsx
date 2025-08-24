import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../../../context/UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Import useNavigation and useFocusEffect

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

const userProfileImagePlaceholder = require('../../../assets/images/foundation.jpeg');

// Initial static data (will be used to initialize the useState)
const initialAttendanceData = [
    {
        id: 'EMP001',
        name: 'Ali Ahmed',
        status: 'Present',
        checkIn: '08:32 AM',
        checkOut: '04:47 PM',
        date: 'June 16, 2025',
    },
    {
        id: 'EMP002',
        name: 'Sara Khan',
        status: 'Absent',
        checkIn: 'N/A',
        checkOut: 'N/A',
        date: 'June 16, 2025',
    },
    {
        id: 'EMP003',
        name: 'Ahmed Raza',
        status: 'Present',
        checkIn: '08:00 AM',
        checkOut: '05:00 PM',
        date: 'June 17, 2025',
    },
    {
        id: 'EMP004',
        name: 'Fatima Zahra',
        status: 'Absent',
        checkIn: 'N/A',
        checkOut: 'N/A',
        date: 'June 17, 2025',
    },
    {
        id: 'EMP005',
        name: 'Usman Ghani',
        status: 'Present',
        checkIn: '09:15 AM',
        checkOut: '05:30 PM',
        date: 'June 18, 2025',
    },
    {
        id: 'EMP006',
        name: 'Aisha Bibi',
        status: 'Present',
        checkIn: '08:45 AM',
        checkOut: '04:50 PM',
        date: 'June 18, 2025',
    },
    {
        id: 'EMP007',
        name: 'Zainab Abbas',
        status: 'Absent',
        checkIn: 'N/A',
        checkOut: 'N/A',
        date: 'June 19, 2025',
    },
    {
        id: 'EMP008',
        name: 'Bilal Khan',
        status: 'Present',
        checkIn: '08:20 AM',
        checkOut: '04:40 PM',
        date: 'June 19, 2025',
    },
    {
        id: 'EMP009',
        name: 'Current Date Employee',
        status: 'Present',
        checkIn: '09:00 AM',
        checkOut: '05:00 PM',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    },
    {
        id: 'EMP010',
        name: 'Another Current Day',
        status: 'Absent',
        checkIn: 'N/A',
        checkOut: 'N/A',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    },
    {
        id: 'EMP011',
        name: 'New Employee 1',
        status: 'Present',
        checkIn: '08:00 AM',
        checkOut: '04:00 PM',
        date: 'July 20, 2025',
    },
    {
        id: 'EMP012',
        name: 'New Employee 2',
        status: 'Absent',
        checkIn: 'N/A',
        checkOut: 'N/A',
        date: 'July 20, 2025',
    },
];

const AttendanceScreen = () => {
    const navigation = useNavigation(); // Initialize navigation
    const { userName, salonName } = useUser();
    const [allAttendanceData, setAllAttendanceData] = useState([]); // Initialize as empty, will fetch on focus
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true); // Add loading state for data fetch

    const [selectedFilterDate, setSelectedFilterDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [isAbsentFilterActive, setIsAbsentFilterActive] = useState(false);

    // Function to simulate fetching attendance data (replace with actual API call)
    const fetchAttendanceData = useCallback(async () => {
        setLoading(true);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 50));
            // In a real app, you'd fetch data from your backend here
            setAllAttendanceData(initialAttendanceData); // Using static data for now
        } catch (error) {
            console.error("Failed to fetch attendance data:", error);
            // Handle error (e.g., show an error message to the user)
        } finally {
            setLoading(false);
        }
    }, []);

    // Use useFocusEffect to refetch data when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchAttendanceData();
            // Reset filters when screen gains focus
            setSelectedFilterDate(null);
            setSearchText('');
            setIsAbsentFilterActive(false);
        }, [fetchAttendanceData])
    );

    // Function to generate the next sequential Employee ID for the main display
    const generateNextEmployeeId = useCallback(() => {
        let maxIdNumber = 0;
        allAttendanceData.forEach(record => {
            const match = record.id.match(/^EMP(\d+)$/); // Extracts the number part
            if (match && match[1]) {
                const idNumber = parseInt(match[1], 10);
                if (!isNaN(idNumber) && idNumber > maxIdNumber) {
                    maxIdNumber = idNumber;
                }
            }
        });

        const nextIdNumber = maxIdNumber + 1;
        const nextFormattedId = `EMP${String(nextIdNumber).padStart(3, '0')}`;
        return nextFormattedId;
    }, [allAttendanceData]); // Depend on allAttendanceData to get the latest IDs

    const filteredAttendanceData = useMemo(() => {
        let currentData = [...allAttendanceData];

        if (isAbsentFilterActive) {
            currentData = currentData.filter(item =>
                item.status.toLowerCase() === 'absent'
            );
        }

        if (selectedFilterDate) {
            const formattedSelectedDate = moment(selectedFilterDate).format('MMM DD, YYYY');
            currentData = currentData.filter(item => {
                const itemDate = moment(item.date, 'MMMM DD, YYYY').format('MMM DD, YYYY');
                return itemDate === formattedSelectedDate;
            });
        }

        if (searchText) {
            currentData = currentData.filter(item =>
                item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                item.id.toLowerCase().includes(searchText.toLowerCase()) ||
                item.status.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        return currentData;
    }, [allAttendanceData, selectedFilterDate, searchText, isAbsentFilterActive]);

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

    const handleToggleAbsentFilter = () => {
        setIsAbsentFilterActive(prevState => !prevState);
    };

    const handleClearAllFilters = () => {
        setSelectedFilterDate(null);
        setSearchText('');
        setIsAbsentFilterActive(false);
    };

    // Function to navigate to LiveCheckupScreen
    const handleNavigateLiveCheckup = (actionType) => {
        navigation.navigate('LiveCheckScreenAttendance', {
            actionType: actionType,
            // We no longer pass setters directly. LiveCheckupScreen will make its own API call.
            // AttendanceScreen will refresh its data using useFocusEffect when it comes back into focus.
        });
    };

    const renderItem = ({ item, index }) => (
        <View
            style={[
                styles.row,
                { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
            ]}
        >
            <Text style={styles.cell}>{item.id}</Text>
            <Text style={styles.cell}>{item.name}</Text>
            <Text
                style={[
                    styles.cell,
                    { color: item.status === 'Present' ? 'green' : '#ff5555' },
                ]}
            >
                {item.status}
            </Text>
            <Text style={styles.cell}>{item.checkIn}</Text>
            <Text style={styles.cell}>{item.checkOut}</Text>
            <Text style={styles.cell}>{item.date}</Text>
        </View>
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
                        <Ionicons name="search" size={width * 0.027} color="#A9A9A9" style={styles.searchIcon} />
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.notificationButton}>
                        <MaterialCommunityIcons name="bell-outline" size={width * 0.041} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.notificationButton}>
                        <MaterialCommunityIcons name="alarm" size={width * 0.041} color="#fff" />
                    </TouchableOpacity>
                    <Image source={userProfileImagePlaceholder} style={styles.profileImage} resizeMode="cover" />
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <Text style={styles.attendanceTitle}>Attendance</Text>

                <View style={styles.filterActions}>
                    {/* Absent Filter Button */}
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            isAbsentFilterActive && styles.activeFilterButton
                        ]}
                        onPress={handleToggleAbsentFilter}
                    >
                        <Ionicons
                            name={isAbsentFilterActive ? "checkmark-circle" : "close-circle"}
                            size={16}
                            color="#fff"
                            style={{ marginRight: 5 }}
                        />
                        <Text style={styles.filterText}>Absent</Text>
                    </TouchableOpacity>

                    {/* Date Filter */}
                    <TouchableOpacity style={styles.filterButton} onPress={handleOpenDatePicker}>
                        <Ionicons name="calendar-outline" size={16} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={styles.filterText}>
                            {selectedFilterDate ? moment(selectedFilterDate).format('MMM DD, YYYY') : 'Date'}
                        </Text>
                        {selectedFilterDate && (
                            <TouchableOpacity onPress={() => setSelectedFilterDate(null)} style={{ marginLeft: 5 }}>
                                <Ionicons name="close-circle" size={16} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>

                    {/* NEW: Check-in button */}
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleNavigateLiveCheckup('checkin')}>
                        <Text style={styles.actionButtonText}>Check-in</Text>
                    </TouchableOpacity>

                    {/* NEW: Check-out button */}
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleNavigateLiveCheckup('checkout')}>
                        <Text style={styles.actionButtonText}>Check-out</Text>
                    </TouchableOpacity>

                    {/* NEW: Request button */}
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleNavigateLiveCheckup('request')}>
                        <Text style={styles.actionButtonText}>Request</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Loading Indicator */}
            {loading ? (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#A98C27" />
                    <Text style={styles.loadingText}>Loading attendance data...</Text>
                </View>
            ) : (
                <>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={styles.headerCell}>Employee ID</Text>
                        <Text style={styles.headerCell}>Name</Text>
                        <Text style={styles.headerCell}>Status</Text>
                        <Text style={styles.headerCell}>Check In</Text>
                        <Text style={styles.headerCell}>Check Out</Text>
                        <Text style={styles.headerCell}>Date</Text>
                    </View>

                    {/* Table Rows */}
                    <FlatList
                        data={filteredAttendanceData}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item.id + item.date + index.toString()}
                        style={styles.table}
                        ListEmptyComponent={() => (
                            <View style={styles.noDataContainer}>
                                <Text style={styles.noDataText}>No attendance data for this date or filters.</Text>
                            </View>
                        )}
                    />
                </>
            )}


            {/* Render the DateTimePicker conditionally */}
            {showDatePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={selectedFilterDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                />
            )}
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
    attendanceTitle: {
        color: '#fff',
        fontSize: width * 0.029,
        fontWeight: '600',

    },
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
    activeFilterButton: {
        backgroundColor: '#A98C27',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#A98C27',
        paddingVertical: height * 0.01,
        paddingHorizontal: width * 0.015,
        borderRadius: 6,
        marginLeft: width * 0.01,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: width * 0.014,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: height * 0.01,
        paddingVertical: height * 0.01,
        backgroundColor: '#2B2B2B',
        paddingHorizontal: width * 0.005,
        borderRadius: 5,
        paddingLeft: width * 0.01,
    },
    headerCell: {
        color: '#fff',
        fontWeight: '600',
        fontSize: width * 0.013,
        width: screenWidth / 6.5,
        textAlign: 'left',
    },
    row: {
        flexDirection: 'row',
        paddingVertical: height * 0.012,
        paddingHorizontal: width * 0.005,
        alignItems: 'center',
        paddingLeft: width * 0.01,
    },
    cell: {
        color: '#fff',
        fontSize: width * 0.013,
        width: screenWidth / 6.5,
        height: screenWidth / 27.5,
        textAlign: 'left',
    },
    table: {
        marginTop: height * 0.009,
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

export default AttendanceScreen;
