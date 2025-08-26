import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  PixelRatio,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, SlideInUp, BounceIn } from 'react-native-reanimated';

// Dimensions and Scaling for Tablet
const { width } = Dimensions.get('window');
const scale = width / 1280;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const CheckoutModal = ({ isVisible, onClose, subtotal, gst, servicesCount, onConfirmOrder }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <Animated.View 
          style={styles.modalView}
          entering={SlideInUp.duration(600).springify()}
        >
          <Text style={styles.modalTitle}>Confirm Order</Text>

          {/* Price and Service Info */}
          <View style={styles.infoSection}>
            <View style={styles.modalInputContainer}>
              <Text style={styles.inputLabel}>Actual Price</Text>
              <TextInput
                style={styles.inputField}
                value={`PKR ${subtotal.toFixed(2)}`}
                editable={false}
              />
            </View>
            <View style={styles.modalInputContainer}>
              <Text style={styles.inputLabel}>GST</Text>
              <TextInput
                style={styles.inputField}
                value={`PKR ${gst.toFixed(2)}`}
                editable={false}
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.addToCartButton]}
              onPress={() => {
                // Call the new prop to confirm the order and open the print bill modal
                onConfirmOrder();
                onClose(); // Close this modal after confirming
              }}
            >
              <Text style={styles.addToCartButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalView: {
    backgroundColor: '#161719',
    borderRadius: normalize(16),
    padding: normalize(35),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: normalize(600),
    maxHeight:normalize(600)


  },
  modalTitle: {
    fontSize: normalize(36),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: normalize(30),
  },
  infoSection: {
    width: '100%',
    borderRadius: normalize(10),
    padding: normalize(20),
    marginBottom: normalize(25),
  },
  modalInputContainer: {
    marginBottom: normalize(25),
  },
  inputLabel: {
    fontSize: normalize(25),
    color: '#888',
    marginBottom: normalize(8),
  },
  inputField: {
    backgroundColor: '#424449ff',
    borderRadius: normalize(8),
    paddingHorizontal: normalize(19),
    paddingVertical: normalize(5),
    height: normalize(80),
    color: '#fff',
    fontSize: normalize(25),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(10),
  },
  infoLabel: {
    fontSize: normalize(20),
    color: '#888',
  },
  infoValue: {
    fontSize: normalize(25),
    color: '#fff',
    fontWeight: 'bold',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: normalize(30),
  },
  modalButton: {
    flex: 1,
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(20),
    borderRadius: normalize(8),
    alignItems: 'center',
    marginHorizontal: normalize(8),
    minHeight: normalize(45),
  },
  closeButton: {
    backgroundColor: '#666666',
    borderWidth: 1,
    borderColor: '#888888',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  addToCartButton: {
    backgroundColor: '#A98C27',
  },
  addToCartButtonText: {
    color: '#FFFFFF',
    fontSize: normalize(16),
    fontWeight: '600',
  },
});

export default CheckoutModal;
