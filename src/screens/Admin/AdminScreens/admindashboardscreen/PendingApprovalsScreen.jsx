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
import { useUser } from '../../../../context/UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

// Import all modal components
import ApproveRequestModal from './modals/ApproveRequestModal';
import DeleteRequestModal from './modals/DeleteRequestModal';
import ViewRequestModal from './modals/ViewRequestModal';
import AddAttendanceModal from './modals/AddAttendanceModal';

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

const userProfileImagePlaceholder = require('../../../../assets/images/foundation.jpeg');

const initialPendingApprovalsData = [
    {
        id: 'EMP001',
        name: 'Ali Ahmed',
        requestType: 'Check-In',
        time: '08:32 AM',
        date: 'June 17, 2025',
        status: 'Pending',
        note: 'Employee requested early check-in due to urgent client meeting. Approved by Manager X.',
    },
    {
        id: 'EMP002',
        name: 'Sara Khan',
        requestType: 'Check-Out',
        time: '05:00 PM',
        date: 'June 17, 2025',
        status: 'Pending',
        note: 'Standard check-out request. No issues reported.',
    },
    {
        id: 'EMP003',
        name: 'Ahmed Raza',
        requestType: 'Leave Request', // This would be considered "Absent"
        time: 'Full Day',
        date: 'June 18, 2025',
        status: 'Pending',
        note: 'Leave request for personal reasons. Requires manager approval.',
    },
    {
        id: 'EMP004',
        name: 'Fatima Zahra',
        requestType: 'Check-In',
        time: '09:15 AM',
        date: 'June 18, 2025',
        status: 'Pending',
        note: 'Late check-in due to traffic. Informed supervisor.',
    },
    {
        id: 'EMP005',
        name: 'Usman Ghani',
        requestType: 'Check-Out',
        time: '04:30 PM',
        date: 'June 19, 2025',
        status: 'Pending',
        note: 'Early check-out request for family emergency.',
    },
    {
        id: 'EMP006',
        name: 'Aisha Bibi',
        requestType: 'Leave Request', // This would be considered "Absent"
        time: 'Half Day',
        date: 'June 19, 2025',
        status: 'Pending',
        note: 'Half-day leave for medical appointment.',
    },
    {
        id: 'EMP007',
        name: 'Zainab Abbas',
        requestType: 'Check-In',
        time: '08:45 AM',
        date: 'June 20, 2025',
        status: 'Pending',
        note: 'Regular check-in.',
    },
    {
        id: 'EMP008',
        name: 'Bilal Khan',
        requestType: 'Check-Out',
        time: '05:10 PM',
        date: 'June 20, 2025',
        status: 'Pending',
        note: 'Slightly late check-out. Completed pending tasks.',
    },
    {
        id: 'EMP009',
        name: 'Hammad Ali',
        requestType: 'Check-In',
        time: '08:00 AM',
        date: 'June 21, 2025',
        status: 'Pending',
        note: 'Normal check-in.',
    },
    {
        id: 'EMP010',
        name: 'Hammad Ali',
        requestType: 'Check-Out',
        time: '05:00 PM',
        date: 'June 21, 2025',
        status: 'Pending',
        note: 'Normal check-out.',
    },
];

const PendingApprovals = () => {
    const { userName, salonName } = useUser();
    const [searchText, setSearchText] = useState('');
    const [pendingApprovals, setPendingApprovals] = useState(initialPendingApprovalsData);

    // Date filtering states
    const [selectedFilterDate, setSelectedFilterDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // NEW STATE: Absent filter
    const [isAbsentFilterActive, setIsAbsentFilterActive] = useState(false); // Default is false

    // States for modals
    const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [isAddAttendanceModalVisible, setIsAddAttendanceModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

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

    // Handler to toggle the Absent filter (NEW)
    const handleToggleAbsentFilter = () => {
        setIsAbsentFilterActive(prevState => !prevState);
    };

    // Filter approvals based on search text, selected date, AND absent filter (MODIFIED)
    const filteredApprovals = useMemo(() => {
        let currentData = [...pendingApprovals];

        // Apply text search filter
        if (searchText) {
            currentData = currentData.filter(item =>
                item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                item.id.toLowerCase().includes(searchText.toLowerCase()) ||
                item.requestType.toLowerCase().includes(searchText.toLowerCase()) ||
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

        // Apply Absent filter if active (NEW LOGIC)
        if (isAbsentFilterActive) {
            // Filter for requests that indicate absence, e.g., 'Leave Request'
            currentData = currentData.filter(item =>
                item.requestType.toLowerCase().includes('leave request') // Or any other string that signifies absence
            );
        }

        return currentData;
    }, [pendingApprovals, searchText, selectedFilterDate, isAbsentFilterActive]); // <-- ADDED: isAbsentFilterActive to dependencies

    // Handlers for opening modals
    const handleOpenApproveModal = (item) => {
        setSelectedRequest(item);
        setIsApproveModalVisible(true);
    };

    const handleOpenDeleteModal = (item) => {
        setSelectedRequest(item);
        setIsDeleteModalVisible(true);
    };

    const handleOpenViewModal = (item) => {
        setSelectedRequest(item);
        setIsViewModalVisible(true);
    };

    const handleOpenAddAttendanceModal = () => {
        setIsAddAttendanceModalVisible(true);
    };

    // Handlers for closing modals
    const handleCloseApproveModal = () => {
        setIsApproveModalVisible(false);
        setSelectedRequest(null);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setSelectedRequest(null);
    };

    const handleCloseViewModal = () => {
        setIsViewModalVisible(false);
        setSelectedRequest(null);
    };

    const handleCloseAddAttendanceModal = () => {
        setIsAddAttendanceModalVisible(false);
    };

    // Handler for approving a request
    const handleApproveRequest = () => {
        if (selectedRequest) {
            setPendingApprovals(prevApprovals =>
                prevApprovals.filter(item => item.id !== selectedRequest.id || item.date !== selectedRequest.date || item.time !== selectedRequest.time)
            );
            console.log(`Approved request for ID: ${selectedRequest.id}`);
        }
        handleCloseApproveModal();
        handleCloseViewModal();
    };

    // Handler for deleting a request
    const handleDeleteRequest = () => {
        if (selectedRequest) {
            setPendingApprovals(prevApprovals =>
                prevApprovals.filter(item => item.id !== selectedRequest.id || item.date !== selectedRequest.date || item.time !== selectedRequest.time)
            );
            console.log(`Deleted request for ID: ${selectedRequest.id}`);
        }
        handleCloseDeleteModal();
    };

    // Handler for saving new attendance from the modal
    const handleSaveNewAttendance = (newEntry) => {
        console.log("New attendance entry from modal:", newEntry);
        alert('New attendance data received. (Not added to pending approvals list in this demo)');
    };

    const renderItem = ({ item, index }) => (
        <View
            style={[
                styles.row,
                { backgroundColor: index % 2 === 0 ? '#2E2E2E' : '#1F1F1F' },
            ]}
        >
            <Text style={styles.employeeIdCell}>{item.id}</Text>
            <Text style={styles.nameCell}>{item.name}</Text>
            <Text style={styles.requestTypeCell}>{item.requestType}</Text>
            <Text style={styles.timeCell}>{item.time}</Text>
            <Text style={styles.dateCell}>{item.date}</Text>
            <View style={styles.actionCell}>
                <TouchableOpacity onPress={() => handleOpenViewModal(item)} style={styles.actionButton}>
                    <Ionicons name="eye-outline" size={width * 0.018} color="#A9A9A9" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOpenApproveModal(item)} style={styles.actionButton}>
                    <Ionicons name="checkmark-circle" size={width * 0.018} color="green" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOpenDeleteModal(item)} style={styles.actionButton}>
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
           
            {/* Controls Section (Similar to AttendanceScreen, adapted for Pending Approvals) */}
            <View style={styles.controls}>
                <Text style={styles.screenTitle}>Pending Approvals</Text>

                {/* Filters/Actions - Adjusted based on screenshot */}
                <View style={styles.filterActions}>
                    {/* Absent Filter Button (MODIFIED) */}
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            isAbsentFilterActive && styles.activeFilterButton // Apply active style
                        ]}
                        onPress={handleToggleAbsentFilter}
                    >
                        <Ionicons
                            name={isAbsentFilterActive ? "checkmark-circle" : "close-circle"} // Change icon based on active state
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

                    {/* Add Attendance button */}
                    <TouchableOpacity style={styles.addButton} onPress={handleOpenAddAttendanceModal}>
                        <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={styles.addText}>Add Attendance</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={styles.employeeIdHeader}>Employee ID</Text>
                <Text style={styles.nameHeader}>Name</Text>
                <Text style={styles.requestTypeHeader}>Request Type</Text>
                <Text style={styles.timeHeader}>Time</Text>
                <Text style={styles.dateHeader}>Date</Text>
                <Text style={styles.actionHeader}>Action</Text>
            </View>

            {/* Table Rows */}
            <FlatList
                data={filteredApprovals}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.id + item.date + item.time + index.toString()}
                style={styles.table}
                ListEmptyComponent={() => (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No pending approvals found.</Text>
                    </View>
                )}
            />

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

            {/* Render all modal components */}
            <ApproveRequestModal
                isVisible={isApproveModalVisible}
                onClose={handleCloseApproveModal}
                onApprove={handleApproveRequest}
                requestDetails={selectedRequest}
            />

            <DeleteRequestModal
                isVisible={isDeleteModalVisible}
                onClose={handleCloseDeleteModal}
                onDelete={handleDeleteRequest}
                requestDetails={selectedRequest}
            />

            <ViewRequestModal
                isVisible={isViewModalVisible}
                onClose={handleCloseViewModal}
                onApprove={handleApproveRequest}
                requestDetails={selectedRequest}
            />

            <AddAttendanceModal
                isVisible={isAddAttendanceModalVisible}
                onClose={handleCloseAddAttendanceModal}
                onSave={handleSaveNewAttendance}
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
    // --- Header Styles (Reused from AttendanceScreen) ---
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

    // --- Controls/Filters Section Styles (Adapted for Pending Approvals) ---
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
        fontSize: width * 0.024,
        fontWeight: '500',
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
        fontSize: width * 0.017,
    },
    activeFilterButton: { // NEW STYLE: for active absent filter
        backgroundColor: '#A98C27', // Example active color, match your theme
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#A98C27',
        paddingVertical: height * 0.01,
        paddingHorizontal: width * 0.010,
        borderRadius: 6,
    },
    addText: {
        color: '#fff',
        fontWeight: '5500',
        fontSize: width * 0.012,
    },
    // --- End Controls/Filters Section Styles ---

    // --- Table Styles (Adapted for Pending Approvals with Flex for Columns) ---
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: height * 0.01,
        paddingVertical: height * 0.01,
        backgroundColor: '#2B2B2B',
        paddingHorizontal: width * 0.005,
        borderRadius: 5,
    },
    // Header cells with flex distribution
    employeeIdHeader: {
        flex: 1.7,
        paddingVertical:width*0.006,
        color: '#fff',
        fontWeight: '600',
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    nameHeader: {
        flex: 2,
        color: '#fff',
        fontWeight: '600',
         paddingVertical:width*0.006,
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    requestTypeHeader: {
        flex: 1.5,
        color: '#fff',
        fontWeight: '600',
         paddingVertical:width*0.006,
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    timeHeader: {
        flex: 1,
        color: '#fff',
        fontWeight: '600',
         paddingVertical:width*0.006,
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    dateHeader: {
        flex: 1.5,
        color: '#fff',
        fontWeight: '600',
         paddingVertical:width*0.006,
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    actionHeader: {
        flex: 1,
        color: '#fff',
        fontWeight: '600',
         paddingVertical:width*0.006,
        fontSize: width * 0.013,
        textAlign: 'center', // Center align "Action" header
    },

    row: {
        flexDirection: 'row',
        paddingVertical: height * 0.016,
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
    requestTypeCell: {
        flex: 1.5,
        color: '#fff',
        fontSize: width * 0.013,
        textAlign: 'left',
    },
    timeCell: {
        flex: 1,
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
    actionCell: {
        flex: 1, // Occupy the same flex space as its header
        flexDirection: 'row',
        justifyContent: 'space-around', // Distribute icons evenly
        alignItems: 'center',
    },
    actionButton: {
        padding: width * 0.005, // Small padding around icons for touchability
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

export default PendingApprovals;