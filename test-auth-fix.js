// Test script to verify authentication fix
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getManagerToken, getAdminToken } from './src/utils/authUtils';

const testAuthFix = async () => {
  try {
    console.log('🧪 Testing authentication fix...');

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
        tokenType: parsed.token
          ? parsed.token.startsWith('eyJ')
            ? 'JWT'
            : parsed.token.startsWith('face_auth_')
            ? 'Face Auth'
            : 'Unknown'
          : 'None',
        managerExists: !!parsed.manager,
        isAuthenticated: parsed.isAuthenticated,
      });
    }

    // Test getManagerToken function
    console.log('🔑 Testing getManagerToken...');
    const managerToken = await getManagerToken();
    console.log(
      '🔑 getManagerToken result:',
      managerToken ? 'Token found' : 'No token',
    );

    if (managerToken) {
      console.log(
        '🔑 Manager token type:',
        managerToken.startsWith('eyJ')
          ? 'JWT'
          : managerToken.startsWith('face_auth_')
          ? 'Face Auth'
          : 'Unknown',
      );
      console.log(
        '🔑 Manager token preview:',
        managerToken.substring(0, 20) + '...',
      );
    }

    // Test getAdminToken function
    console.log('🔑 Testing getAdminToken...');
    const adminToken = await getAdminToken();
    console.log(
      '🔑 getAdminToken result:',
      adminToken ? 'Token found' : 'No token',
    );

    if (adminToken) {
      console.log(
        '🔑 Admin token type:',
        adminToken.startsWith('eyJ')
          ? 'JWT'
          : adminToken.startsWith('face_auth_')
          ? 'Face Auth'
          : 'Unknown',
      );
      console.log(
        '🔑 Admin token preview:',
        adminToken.substring(0, 20) + '...',
      );
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testAuthFix();
