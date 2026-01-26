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

const formatLine = (left = '', right = '', width = 30) => {
  const leftText = String(left ?? '').trim();
  const rightText = String(right ?? '').trim();

  const rightWidth = rightText.length;
  const leftWidthLimit = width - rightWidth - 1; // 1 for minimum space

  // Case 1: Everything fits on one line
  if (leftText.length <= leftWidthLimit) {
    const spaceCount = width - leftText.length - rightWidth;
    return leftText + ' '.repeat(Math.max(spaceCount, 1)) + rightText;
  }

  // Case 2: Left text is too long and needs to wrap
  // We'll break the left text into chunks that fit
  const lines = [];
  let currentPos = 0;
  while (currentPos < leftText.length) {
    lines.push(leftText.substring(currentPos, currentPos + leftWidthLimit).trim());
    currentPos += leftWidthLimit;
  }

  // First line: First chunk of name + space + price
  const firstLineName = lines[0];
  const firstLineSpaces = width - firstLineName.length - rightWidth;
  let result = firstLineName + ' '.repeat(Math.max(firstLineSpaces, 1)) + rightText;

  // Subsequent lines: Just the remaining chunks of the name
  for (let i = 1; i < lines.length; i++) {
    result += '\n' + lines[i];
  }

  return result;
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

    // Get current date/time formatted like PDF
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const day = now.getDate().toString().padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');

    const dateStr = `${month} ${day}, ${year}`;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    // 1. Initialize printer
    await BLEPrinter.printText('\x1b@', {}); // Reset printer

    // ============ HEADER ============
    await BLEPrinter.printText('\x1ba\x01', {}); // Center

    try {
      // Image Logo
      const logoBase64 = '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';
      await BLEPrinter.printImageBase64(logoBase64, { width: 384, height: 175 });
      await BLEPrinter.printText('\n', {});
    } catch (e) {
      console.log('Logo print failed:', e);
      // Fallback
      await BLEPrinter.printText('\x1b!\x38SARTE SALON\x1b!\x00\n', {});
      await BLEPrinter.printText('\n', {});
    }

    // --- Header Information ---
    await BLEPrinter.printText('\x1ba\x01', {}); // Center
    await BLEPrinter.printText('6-B2 Punjab Society, Wapda Town\nContact: 0300-1042300\n', {});

    // --- Invoice Title ---
    await BLEPrinter.printText('\x1ba\x01', {}); // Center
    await BLEPrinter.printText('\x1b!\x38INVOICE\x1b!\x00\n', {});

    // --- Date/Time ---
    await BLEPrinter.printText('\x1ba\x01', {}); // Center
    await BLEPrinter.printText(`Date: ${dateStr} | Time: ${timeStr}\n`, {});

    // --- Details ---
    await BLEPrinter.printText('\x1ba\x00', {}); // Left align details
    if (beautician && beautician !== '-') {
      await BLEPrinter.printText(`Beautician: ${beautician}\n`, {});
    }
    if (notes && notes !== '-') {
      await BLEPrinter.printText(`Note: ${notes}\n`, {});
    }

    await BLEPrinter.printText('--------------------------------\n', {});

    // --- Services Title ---
    await BLEPrinter.printText('\x1ba\x01', {}); // Center
    await BLEPrinter.printText('\x1b!\x38SERVICES\x1b!\x00\n', {});

    // --- Services List ---
    await BLEPrinter.printText('\x1ba\x00', {}); // Left align for list
    for (const service of services) {
      const name = service.name || service.subServiceName || 'N/A';
      // Robust filter for subtotal
      if (/sub\s*total/i.test(name)) {
        continue;
      }
      const price = Number(service.price || 0).toFixed(2);
      // Use width 30
      await BLEPrinter.printText(formatLine(name, price, 30) + '\n', {});
    }

    await BLEPrinter.printText('--------------------------------\n', {});

    // --- Totals Section ---
    await BLEPrinter.printText('\x1ba\x00', {}); // Left align
    await BLEPrinter.printText(formatLine('Sub Total:', Number(subtotal || 0).toFixed(2), 30) + '\n', {});

    if (gstAmount && Number(gstAmount) > 0) {
      await BLEPrinter.printText(formatLine(
        `GST (${Number(gstRatePercent || 0).toFixed(2)}%)`,
        Number(gstAmount).toFixed(2),
        30
      ) + '\n', {});
    }

    if (discount && Number(discount) > 0) {
      await BLEPrinter.printText(formatLine('Discount', `-${Number(discount).toFixed(2)}`, 30) + '\n', {});
    }

    await BLEPrinter.printText('--------------------------------\n', {});

    // --- Final Grand Total ---
    await BLEPrinter.printText('\x1ba\x01', {}); // Center
    // Use 'TOTAL' instead of 'GRAND TOTAL' for cleaner centering in double-width mode
    const totalVal = Number(total || 0).toFixed(2);
    await BLEPrinter.printText(`\x1b!\x38TOTAL: ${totalVal}\x1b!\x00\n`, {});

    await BLEPrinter.printText('\x1ba\x00', {}); // Final reset
    await BLEPrinter.printText('--------------------------------\n', {});

    // ============ FOOTER ============
    await BLEPrinter.printText('\x1ba\x01', {}); // Center
    await BLEPrinter.printText('Thank you for choosing us\nPlease Visit again\n', {});

    // Feed and cut
    await BLEPrinter.printText('\n\n\x1dV\x42\x00', {});

    console.log('[ThermalPrinter] Print sequence complete');

  } catch (error) {
    console.error('[ThermalPrinter] printBillToThermal error:', error);
    Alert.alert('Print Error', error.message || 'Failed to print to thermal printer.');
    throw error;
  }
};
