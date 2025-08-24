// src/api/config.js
import { Platform, NativeModules } from 'react-native';

// Development-friendly host resolution
// Android emulator: 10.0.2.2, iOS simulator: localhost
let PACKAGER_HOST = null;
try {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    PACKAGER_HOST = new URL(scriptURL).hostname;
  }
} catch {}

// For physical device testing, force your PC LAN IP.
// Update this if your IP changes.
const LOCAL_DEV_HOST = '192.168.18.16';

// You can override this by replacing LOCAL_DEV_HOST with your machine IP if testing on a physical device
// Example: const LOCAL_DEV_HOST = '192.168.1.100';

export const BASE_URL = `http://${LOCAL_DEV_HOST}:5000/api`;

export default BASE_URL;

// Helpful debug log
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('[API] BASE_URL =', BASE_URL);
}
