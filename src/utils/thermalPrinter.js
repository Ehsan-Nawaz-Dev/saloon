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

    // Sanitize user-entered text so that even if beautician/notes contain
    // emojis, Urdu text, or unexpected types, printing never crashes.
    const clientName = sanitizeForPrinter(rawClientName, 'Guest');
    const phoneNumber = sanitizeForPrinter(rawPhoneNumber, '-');
    const notes = sanitizeForPrinter(rawNotes, '-');
    const beautician = sanitizeForPrinter(rawBeautician, '-');

    console.log('[ThermalPrinter] Preparing to print header via BLEPrinter');
    console.log('[ThermalPrinter] Printing header');

    // Hard reset printer + minimize line spacing so header starts as close
    // to the top of the paper as the device physically allows.
    // ESC @  => initialize
    // ESC 3 0 => set line spacing to minimum
    try {
      await BLEPrinter.printText('\x1b@', {});
      await BLEPrinter.printText('\x1b3\x00', {});
    } catch (e) {
      console.warn('[ThermalPrinter] Failed to apply ESC/POS init/line spacing:', e);
    }

    // Start header immediately so overall bill height stays compact
    await BLEPrinter.printText('Sarte Salon\n', {});
    await BLEPrinter.printText('Client Bill\n', {});
    await BLEPrinter.printText('------------------------------\n', {});
    const now = new Date();
    await BLEPrinter.printText(
      `Date: ${now.toLocaleDateString()}\nTime: ${now.toLocaleTimeString()}\n`,
      {},
    );

    await BLEPrinter.printText(
      `Client: ${clientName}\nPhone: ${phoneNumber}\nBeautician: ${beautician}\nNotes: ${notes}\n`,
      {},
    );

    await BLEPrinter.printText('------------------------------\n', {});
    console.log('[ThermalPrinter] Printing services header');
    await BLEPrinter.printText('Services\n', {});

    console.log('[ThermalPrinter] Services to print:', services);
    for (const service of services) {
      const name = service.name || service.subServiceName || 'N/A';
      const price = Number(service.price || 0).toFixed(2);
      await BLEPrinter.printText(formatLine(name, `PKR ${price}`) + '\n', {});
    }

    console.log('[ThermalPrinter] Printing totals section');
    await BLEPrinter.printText('------------------------------\n', {});

    await BLEPrinter.printText(
      formatLine('Sub Total', `PKR ${Number(subtotal || 0).toFixed(2)}`) + '\n',
      {},
    );

    if (gstAmount && Number(gstAmount) > 0) {
      await BLEPrinter.printText(
        formatLine(
          `GST (${Number(gstRatePercent || 0).toFixed(2)}%)`,
          `+PKR ${Number(gstAmount).toFixed(2)}`,
        ) + '\n',
        {},
      );
    }

    await BLEPrinter.printText(
      formatLine('Discount', `-PKR ${Number(discount || 0).toFixed(2)}`) + '\n',
      {},
    );

    await BLEPrinter.printText('------------------------------\n', {});
    await BLEPrinter.printText(
      formatLine('TOTAL', `PKR ${Number(total || 0).toFixed(2)}`) + '\n',
      {},
    );

    console.log('[ThermalPrinter] Printing footer and final line feeds');
    // Footer: print thank-you with a single newline to avoid wasting paper at the top of the next bill
    await BLEPrinter.printText('Thank you for your visit!\n', {});
    console.log('[ThermalPrinter] Printing completed without errors');
  } catch (error) {
    console.error('[ThermalPrinter] printBillToThermal error:', error);
    Alert.alert('Print Error', error.message || 'Failed to print to thermal printer.');
    throw error;
  }
};
