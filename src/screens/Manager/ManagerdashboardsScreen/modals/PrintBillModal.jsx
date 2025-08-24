// src/screens/admin/ClientsScreen/modals/ViewClientModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  PermissionsAndroid,
  Platform,
  Share,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

const { width, height } = Dimensions.get('window');

// The `billData` prop will now be used instead of hardcoded data
const PrintBillModal = ({ isVisible, onClose, billData }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Use the passed billData if it exists, otherwise use a default structure
  // This is a crucial change to make the modal dynamic
  const clientDetails = billData?.clientName || 'Guest';
  const services = billData?.services || [];
  const subTotal = billData?.subtotal || 0;
  const discount = billData?.discount || 0;
  const total = billData?.totalPrice || 0;
  const phoneNumber = billData?.phoneNumber || '-';
  const notes = billData?.notes || '-';

  if (!isVisible || !billData) return null; // Exit early if no data is available

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android' && Platform.Version <= 32) {
      // Target Android 12 (API 32) and below
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message:
              'App needs access to your storage to download the bill as PDF.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    // For Android 13 (API 33) and above, WRITE_EXTERNAL_STORAGE is not needed for app-specific directories.
    // For iOS, storage permissions are typically handled differently or not explicitly requested for app data.
    return true;
  };

  const handlePrintBill = async () => {
    try {
      // Ensure all prices are numbers before generating HTML
      const servicesHtml = services
        .map(
          s => `
                <tr>
                    <td class="service-name">${
                      s.name || s.subServiceName || 'N/A'
                    }</td>
                    <td class="service-price">$${Number(s.price || 0).toFixed(
                      2,
                    )}</td>
                </tr>
            `,
        )
        .join('');

      const billHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Client Bill</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 20px;
                            color: #333;
                            line-height: 1.6;
                        }
                        .container {
                            width: 80%;
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 20px;
                            border: 1px solid #eee;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                            background-color: #fff;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 25px;
                            padding-bottom: 15px;
                            border-bottom: 2px solid #A98C27;
                        }
                        .header h1 {
                            font-size: 28px;
                            color: #000;
                            margin: 0;
                        }
                        .header p {
                            font-size: 14px;
                            color: #555;
                            margin: 5px 0 0;
                        }
                        .section {
                            margin-bottom: 20px;
                        }
                        .section-title {
                            font-size: 18px;
                            font-weight: bold;
                            color: #000;
                            margin-bottom: 10px;
                            padding-bottom: 5px;
                            border-bottom: 1px solid #ddd;
                            text-align: center;
                        }
                        .detail-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 5px 0;
                            border-bottom: 1px dashed #eee;
                        }
                        .detail-row:last-child {
                            border-bottom: none;
                        }
                        .detail-label {
                            font-weight: bold;
                            color: #555;
                            flex: 1;
                        }
                        .detail-value {
                            text-align: right;
                            color: #000;
                            flex: 2;
                        }
                        .service-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 15px;
                        }
                        .service-table th, .service-table td {
                            border: 1px solid #eee;
                            padding: 10px;
                            text-align: left;
                        }
                        .service-table th {
                            background-color: #f8f8f8;
                            color: #333;
                            font-weight: bold;
                        }
                        .service-table tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        .service-name {
                            font-weight: normal;
                        }
                        .service-price {
                            text-align: right;
                            font-weight: bold;
                        }
                        .summary-table {
                            width: 100%;
                            margin-top: 20px;
                            border-collapse: collapse;
                        }
                        .summary-table td {
                            padding: 8px 0;
                        }
                        .summary-label {
                            text-align: right;
                            color: #555;
                            padding-right: 15px;
                        }
                        .summary-value {
                            text-align: right;
                            font-weight: bold;
                            color: #000;
                            font-size: 16px;
                        }
                        .final-total-row {
                            background-color: #A98C27;
                            color: #fff;
                            font-size: 20px;
                            font-weight: bold;
                        }
                        .final-total-row td {
                            padding: 12px 10px;
                        }
                        .final-total-label, .final-total-value {
                            color: #fff;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Client Bill</h1>
                            <p>For: ${clientDetails}</p>
                            <p>Date: ${moment(currentDateTime).format(
                              'MMMM DD, YYYY',
                            )} | Time: ${moment(currentDateTime).format(
        'hh:mm A',
      )}</p>
                        </div>

                        <div class="section">
                            <h2 class="section-title">Client Details</h2>
                            <div class="detail-row">
                                <span class="detail-label">Client Name:</span>
                                <span class="detail-value">${clientDetails}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Phone:</span>
                                <span class="detail-value">${phoneNumber}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Notes:</span>
                                <span class="detail-value">${notes}</span>
                            </div>
                        </div>

                        <div class="section">
                            <h2 class="section-title">Services Provided</h2>
                            <table class="service-table">
                                <thead>
                                    <tr>
                                        <th>Service Name</th>
                                        <th style="text-align:right;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${servicesHtml}
                                </tbody>
                            </table>
                        </div>

                        <div class="section">
                            <table class="summary-table">
                                <tbody>
                                    <tr>
                                        <td class="summary-label">Sub Total:</td>
                                        <td class="summary-value">$${subTotal.toFixed(
                                          2,
                                        )}</td>
                                    </tr>
                                    <tr>
                                        <td class="summary-label">Discount:</td>
                                        <td class="summary-value">-$${discount.toFixed(
                                          2,
                                        )}</td>
                                    </tr>
                                    <tr class="final-total-row">
                                        <td class="summary-label final-total-label">Total:</td>
                                        <td class="summary-value final-total-value">$${total.toFixed(
                                          2,
                                        )}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #777;">
                            Thank you for your business!
                        </div>
                    </div>
                </body>
                </html>
            `;

      const fileName = `Client_Bill_${clientDetails.replace(
        /\s/g,
        '_',
      )}_${moment().format('YYYYMMDD_HHmmss')}`;
      const options = {
        html: billHTML,
        fileName: fileName,
        directory: 'cache', // Use 'cache' or 'tmp' for temporary files
        height: 842, // A4 height in points
        width: 595, // A4 width in points
      };

      const file = await RNHTMLtoPDF.convert(options);

      if (file && file.filePath) {
        Alert.alert(
          'PDF Generated',
          `The bill PDF for ${clientDetails} has been generated.`,
          [
            {
              text: 'Download',
              onPress: async () => {
                const permissionGranted = await requestStoragePermission();
                if (!permissionGranted) {
                  Alert.alert(
                    'Permission Denied',
                    'Cannot download bill without storage permission.',
                  );
                  return;
                }
                // Define the destination path in the Downloads folder
                const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`;
                try {
                  // Copy the generated PDF from cache to the Downloads directory
                  await RNFS.copyFile(file.filePath, destPath);
                  Alert.alert(
                    'Download Successful',
                    `PDF saved to your Downloads folder: ${destPath}`,
                  );
                  // Optionally, open the file after download
                  // FileViewer.open(destPath).catch(e => console.log('Error opening file:', e));
                } catch (downloadError) {
                  console.error('Failed to download PDF:', downloadError);
                  Alert.alert(
                    'Error',
                    `Failed to download PDF: ${
                      downloadError.message || 'Unknown error'
                    }`,
                  );
                }
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      } else {
        Alert.alert(
          'Error',
          'PDF file not generated or path is missing. Please check console for details.',
        );
        console.error(
          'RNHTMLtoPDF conversion failed: file or filePath missing.',
          file,
        );
      }
    } catch (error) {
      console.error('Print Error:', error);
      Alert.alert(
        'Error',
        `Failed to generate bill PDF: ${error.message || 'Unknown error'}`,
      );
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bill for {clientDetails}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close-circle-outline"
                size={width * 0.05}
                color="#A9A9A9"
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>
                {moment(currentDateTime).format('MMMM DD, YYYY')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Time:</Text>
              <Text style={styles.detailValue}>
                {moment(currentDateTime).format('hh:mm A')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Client Name:</Text>
              <Text style={styles.detailValue}>{clientDetails}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone Number:</Text>
              <Text style={styles.detailValue}>{phoneNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.detailValue}>{notes}</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Services</Text>
            </View>

            {services.length > 0 ? (
              services.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <Text style={styles.serviceName}>
                    {service.name || service.subServiceName || 'N/A'}
                  </Text>
                  <Text style={styles.servicePrice}>
                    ${Number(service.price || 0).toFixed(2)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noServicesText}>No services listed.</Text>
            )}

            <View style={styles.separator} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sub Total</Text>
              <Text style={styles.totalValue}>${subTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>-${discount.toFixed(2)}</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabelFinal}>Total</Text>
              <Text style={styles.totalValueFinal}>${total.toFixed(2)}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.printBillButton}
            onPress={handlePrintBill}
          >
            <Text style={styles.printBillButtonText}>Print Bill</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: '70%',
    maxWidth: 600,
    height: '70%',
    maxHeight: 1100,
    backgroundColor: '#1F1F1F',
    borderRadius: 15,
    padding: width * 0.03,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: height * 0.025,
    paddingBottom: height * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: '#3C3C3C',
  },
  modalTitle: {
    fontSize: width * 0.025,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: width * 0.008,
  },
  detailsContainer: {
    flex: 1,
    width: '100%',
    paddingVertical: height * 0.01,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height * 0.012,
  },
  detailLabel: {
    fontSize: width * 0.016,
    color: '#A9A9A9',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: width * 0.016,
    color: '#fff',
    flex: 2,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#3C3C3C',
    marginVertical: height * 0.02,
    width: '100%',
  },
  sectionHeader: {
    marginBottom: height * 0.015,
  },
  sectionTitle: {
    fontSize: width * 0.018,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: height * 0.008,
  },
  serviceName: {
    fontSize: width * 0.015,
    color: '#fff',
  },
  servicePrice: {
    fontSize: width * 0.015,
    color: '#fff',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: height * 0.01,
  },
  totalLabel: {
    fontSize: width * 0.016,
    color: '#A9A9A9',
  },
  totalValue: {
    fontSize: width * 0.016,
    color: '#fff',
    fontWeight: 'bold',
  },
  totalLabelFinal: {
    fontSize: width * 0.02,
    color: '#fff',
    fontWeight: 'bold',
  },
  totalValueFinal: {
    fontSize: width * 0.02,
    color: '#fff',
    fontWeight: 'bold',
  },
  printBillButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: height * 0.02,
    alignItems: 'center',
    marginTop: height * 0.03,
  },
  printBillButtonText: {
    color: '#161719',
    fontSize: width * 0.02,
    fontWeight: 'bold',
  },
  noServicesText: {
    color: '#A9A9A9',
    fontSize: width * 0.015,
    textAlign: 'center',
    marginTop: height * 0.02,
  },
});

export default PrintBillModal;
