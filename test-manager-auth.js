// Test script to verify manager authentication
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getManagerToken } from './src/utils/authUtils';

const testManagerAuth = async () => {
  try {
    console.log('🧪 Testing manager authentication...');

    // Check what's stored in AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('📦 All AsyncStorage keys:', allKeys);

    // Check managerAuth specifically
    const managerAuth = await AsyncStorage.getItem('managerAuth');
    console.log('🔑 Manager auth data:', managerAuth);

    if (managerAuth) {
      const parsed = JSON.parse(managerAuth);
      console.log('🔑 Parsed manager auth:', {
        tokenExists: !!parsed.token,
        tokenLength: parsed.token ? parsed.token.length : 0,
        managerExists: !!parsed.manager,
        isAuthenticated: parsed.isAuthenticated,
      });
    }

    // Test getManagerToken function
    const token = await getManagerToken();
    console.log(
      '🔑 getManagerToken result:',
      token ? 'Token found' : 'No token',
    );

    if (token) {
      console.log('🔑 Token preview:', token.substring(0, 20) + '...');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testManagerAuth();
