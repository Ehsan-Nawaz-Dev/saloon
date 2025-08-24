import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    TouchableWithoutFeedback,
    Alert,
    Image, // For image preview
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker'; // For date and time picker
import { launchImageLibrary } from 'react-native-image-picker'; // For image picker

const { width, height } = Dimensions.get('window');

const AddBookingModal = ({ isVisible, onClose, onSave }) => {
    const [clientName, setClientName] = useState('');
    const [bookingDateTime, setBookingDateTime] = useState(new Date());
    const [openDatePicker, setOpenDatePicker] = useState(false);
    const [advancePayment, setAdvancePayment] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [description, setDescription] = useState('');
    const [imageUri, setImageUri] = useState(null); // State for selected image URI

    const resetForm = () => {
        setClientName('');
        setBookingDateTime(new Date());
        setAdvancePayment('');
        setPhoneNumber('');
        setDescription('');
        setImageUri(null); // Reset image URI
    };

    const handleSave = () => {
        if (!clientName.trim() || !phoneNumber.trim() || !bookingDateTime) {
            Alert.alert('Missing Information', 'Please fill all required fields: Client Name, Phone Number, and Booking Date & Time.');
            return;
        }
        if (advancePayment.trim() && isNaN(parseFloat(advancePayment.trim()))) {
            Alert.alert('Invalid Amount', 'Advance Payment must be a valid number.');
            return;
        }

        const newBooking = {
            // A unique ID will be generated in the parent component or backend
            clientName: clientName.trim(),
            dateTime: bookingDateTime.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
            phoneNumber: phoneNumber.trim(),
            advancePayment: advancePayment.trim() ? `${parseFloat(advancePayment.trim()).toFixed(2)} PKR` : '0.00 PKR',
            description: description.trim(),
            reminder: `Reminder set for ${bookingDateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}, ${bookingDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`, // Example reminder
            imageUri: imageUri, // Include image URI
        };

        onSave(newBooking);
        resetForm();
        onClose();
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleImagePicker = () => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 800,
            maxHeight: 800,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorCode, response.errorMessage);
                Alert.alert('Image Picker Error', response.errorMessage);
            } else if (response.assets && response.assets.length > 0) {
                const selectedImage = response.assets[0];
                setImageUri(selectedImage.uri);
            }
        });
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add Booking</Text>
                                <TouchableOpacity onPress={handleClose}>
                                    <Ionicons name="close-circle-outline" size={width * 0.025} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.modalInput}
                                placeholder="Client Name"
                                placeholderTextColor="#A9A9A9"
                                value={clientName}
                                onChangeText={setClientName}
                            />

                            {/* Date & Time Picker Trigger */}
                            <TouchableOpacity
                                style={styles.modalInputTouchable}
                                onPress={() => setOpenDatePicker(true)}
                            >
                                <Text style={styles.modalInputText}>
                                    {bookingDateTime.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                </Text>
                                <Ionicons name="calendar-outline" size={width * 0.018} color="#A9A9A9" />
                            </TouchableOpacity>

                            <DatePicker
                                modal
                                mode="datetime" // Use datetime mode
                                open={openDatePicker}
                                date={bookingDateTime}
                                onConfirm={(date) => {
                                    setOpenDatePicker(false);
                                    setBookingDateTime(date);
                                }}
                                onCancel={() => setOpenDatePicker(false)}
                            />

                            <TextInput
                                style={styles.modalInput}
                                placeholder="Advance Payment (PKR)"
                                placeholderTextColor="#A9A9A9"
                                value={advancePayment}
                                onChangeText={setAdvancePayment}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Phone Number"
                                placeholderTextColor="#A9A9A9"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                            <TextInput
                                style={[styles.modalInput, styles.descriptionInput]}
                                placeholder="Description"
                                placeholderTextColor="#A9A9A9"
                                value={description}
                                onChangeText={setDescription}
                                multiline={true}
                                numberOfLines={4}
                            />

                            {/* Image Picker Section */}
                            <TouchableOpacity style={styles.fileUploadContainer} onPress={handleImagePicker}>
                                {imageUri ? (
                                    <Image source={{ uri: imageUri }} style={styles.selectedImagePreview} />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={width * 0.03} color="#A9A9A9" />
                                        <Text style={styles.fileUploadText}>Drag & Drop files or browse files</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        width: width * 0.59,
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        padding: width * 0.02,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: height * 0.02,
        paddingBottom: height * 0.01,
        borderBottomWidth: 1,
        borderBottomColor: '#3C3C3C',
    },
    modalTitle: {
        color: '#fff',
        fontSize: width * 0.02,
        fontWeight: 'bold',
    },
    modalInput: {
        backgroundColor: '#2A2D32',
        color: '#fff',
        fontSize: width * 0.018,
        paddingVertical: height * 0.015,
        paddingHorizontal: width * 0.015,
        borderRadius: 8,
        marginBottom: height * 0.015,
        borderWidth: 1,
        borderColor: '#4A4A4A',
    },
    modalInputTouchable: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2A2D32',
        paddingVertical: height * 0.015,
        paddingHorizontal: width * 0.015,
        borderRadius: 8,
        marginBottom: height * 0.015,
        borderWidth: 1,
        borderColor: '#4A4A4A',
    },
    modalInputText: {
        color: '#fff',
        fontSize: width * 0.018,
    },
    descriptionInput: {
        height: height * 0.1,
        textAlignVertical: 'top',
    },
    fileUploadContainer: {
        backgroundColor: '#2A2D32',
        borderWidth: 1,
        borderColor: '#4A4A4A',
        borderRadius: 8,
        borderStyle: 'dashed',
        paddingVertical: height * 0.03,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: height * 0.02,
        height: height * 0.15,
    },
    fileUploadText: {
        color: '#A9A9A9',
        fontSize: width * 0.015,
        marginTop: height * 0.01,
    },
    selectedImagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'contain',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: height * 0.02,
    },
    closeButton: {
        backgroundColor: '#3C3C3C',
        paddingVertical: height * 0.015,
        paddingHorizontal: width * 0.11,
        borderRadius: 8,
        marginRight: width * 0.02,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: width * 0.016,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#A98C27',
        paddingVertical: height * 0.015,
        paddingHorizontal: width * 0.11,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: width * 0.016,
        fontWeight: '600',
    },
});

export default AddBookingModal;