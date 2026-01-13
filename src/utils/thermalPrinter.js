import { Alert } from 'react-native';
import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';

let cachedDeviceAddress = null;

export const setThermalPrinterAddress = address => {
  cachedDeviceAddress = address || null;
};

export const getThermalPrinterAddress = () => cachedDeviceAddress;

// Ensure any user-provided text is safe for the thermal printer (ASCII, limited length)
const sanitizeForPrinter = (value, fallback = '-') => {
  try {
    let text = value;
    if (text === null || text === undefined) {
      text = '';
    }
    text = String(text).trim();

    if (!text) {
      text = fallback;
    }

    // Collapse multiple whitespace/newlines into single spaces so layout stays stable
    text = text.replace(/\s+/g, ' ');

    // Remove non-ASCII characters which many simple thermal printers can't render
    text = text.replace(/[^\x20-\x7E]/g, '');

    // Limit length so a very long notes field doesn't overflow badly
    const MAX_LEN = 80;
    if (text.length > MAX_LEN) {
      text = text.slice(0, MAX_LEN);
    }

    return text || fallback;
  } catch (e) {
    console.error('[ThermalPrinter] sanitizeForPrinter error:', e);
    return fallback;
  }
};

const connectToPrinter = async address => {
  try {
    const target = address || cachedDeviceAddress;
    if (!target) {
      throw new Error('No printer selected. Please pair and set a printer first.');
    }

    console.log('[ThermalPrinter] Initializing BLE printer');
    await BLEPrinter.init();

    console.log('[ThermalPrinter] Connecting to BLE printer at:', target);
    await BLEPrinter.connectPrinter(target);

    cachedDeviceAddress = target;
    console.log('[ThermalPrinter] BLE printer connected');
  } catch (error) {
    console.error('[ThermalPrinter] Connect error:', error);
    throw new Error('Failed to connect to printer. Please make sure it is on and paired.');
  }
};

const formatLine = (left = '', right = '', width = 42) => {
  const leftText = String(left ?? '');
  const rightText = String(right ?? '');
  const spaceCount = Math.max(width - leftText.length - rightText.length, 1);
  return leftText + ' '.repeat(spaceCount) + rightText;
};

export const printBillToThermal = async bill => {
  try {
    console.log('[ThermalPrinter] printBillToThermal called with bill:', bill);
    if (!bill) {
      throw new Error('No bill data provided for printing.');
    }

    console.log('[ThermalPrinter] Ensuring printer connection...');
    await connectToPrinter();
    console.log('[ThermalPrinter] Printer connected successfully');

    const {
      clientName: rawClientName = 'Guest',
      phoneNumber: rawPhoneNumber = '-',
      notes: rawNotes = '-',
      beautician: rawBeautician = '-',
      services = [],
      subtotal = 0,
      discount = 0,
      gstAmount = 0,
      gstRatePercent = 0,
      total = 0,
    } = bill;

    // Sanitize user-entered text
    const clientName = sanitizeForPrinter(rawClientName, 'Guest');
    const phoneNumber = sanitizeForPrinter(rawPhoneNumber, '-');
    const notes = sanitizeForPrinter(rawNotes, '-');
    const beautician = sanitizeForPrinter(rawBeautician, '-');

    // ---------------------------------------------------------
    // Construct the entire receipt as a single string (Batch Print)
    // ---------------------------------------------------------

    // Command Buffer Start
    let printerPayload = '';

    // 1. Initialization & Config
    // \x1b@   => Initialize printer
    // \x1b3\x00 => Set line spacing to minimum (0). Adjust if too tight.
    printerPayload += '\x1b@';
    printerPayload += '\x1b3\x00';

    // 2. Header
    printerPayload += 'Sarte Salon\n';
    printerPayload += 'Client Bill\n';
    printerPayload += '------------------------------\n';

    const now = new Date();
    printerPayload += `Date: ${now.toLocaleDateString()}\nTime: ${now.toLocaleTimeString()}\n`;

    printerPayload += `Client: ${clientName}\nPhone: ${phoneNumber}\nBeautician: ${beautician}\nNotes: ${notes}\n`;
    printerPayload += '------------------------------\n';

    // 3. Services
    printerPayload += 'Services\n';
    for (const service of services) {
      const name = service.name || service.subServiceName || 'N/A';
      const price = Number(service.price || 0).toFixed(2);
      printerPayload += formatLine(name, `PKR ${price}`) + '\n';
    }

    // 4. Totals
    printerPayload += '------------------------------\n';
    printerPayload += formatLine('Sub Total', `PKR ${Number(subtotal || 0).toFixed(2)}`) + '\n';

    if (gstAmount && Number(gstAmount) > 0) {
      printerPayload += formatLine(
        `GST (${Number(gstRatePercent || 0).toFixed(2)}%)`,
        `+PKR ${Number(gstAmount).toFixed(2)}`
      ) + '\n';
    }

    printerPayload += formatLine('Discount', `-PKR ${Number(discount || 0).toFixed(2)}`) + '\n';
    printerPayload += '------------------------------\n';
    printerPayload += formatLine('TOTAL', `PKR ${Number(total || 0).toFixed(2)}`) + '\n';

    // 5. Footer
    printerPayload += 'Thank you for your visit!\n';

    // 6. Cut / Feed Command for SpeedX SP-90A
    // \n\n => Feed 2 lines of padding so text clears the cutter
    // \x1dV\x42\x00 => GS V n (Feed paper to cut position and cut)
    printerPayload += '\n\n';
    printerPayload += '\x1dV\x42\x00';

    console.log('[ThermalPrinter] Sending batched print command...');
    await BLEPrinter.printText(printerPayload, {});
    console.log('[ThermalPrinter] Batched print command sent successfully');

  } catch (error) {
    console.error('[ThermalPrinter] printBillToThermal error:', error);
    Alert.alert('Print Error', error.message || 'Failed to print to thermal printer.');
    throw error;
  }
};
