// Test script to debug AsyncStorage tokens
import AsyncStorage from '@react-native-async-storage/async-storage';

const testTokenDebug = async () => {
  try {
    console.log('🧪 Testing AsyncStorage tokens...');

    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('📦 All AsyncStorage keys:', allKeys);

    // Check managerAuth
    const managerAuth = await AsyncStorage.getItem('managerAuth');
    console.log('🔑 managerAuth data:', managerAuth);

    if (managerAuth) {
      const parsed = JSON.parse(managerAuth);
      console.log('🔑 Parsed managerAuth:', {
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

    // Check adminAuth
    const adminAuth = await AsyncStorage.getItem('adminAuth');
    console.log('🔑 adminAuth data:', adminAuth);

    if (adminAuth) {
      const parsed = JSON.parse(adminAuth);
      console.log('🔑 Parsed adminAuth:', {
        tokenExists: !!parsed.token,
        tokenLength: parsed.token ? parsed.token.length : 0,
        tokenType: parsed.token
          ? parsed.token.startsWith('eyJ')
            ? 'JWT'
            : parsed.token.startsWith('face_auth_')
            ? 'Face Auth'
            : 'Unknown'
          : 'None',
        adminExists: !!parsed.admin,
        isAuthenticated: parsed.isAuthenticated,
      });
    }

    // Check other possible auth keys
    const managerToken = await AsyncStorage.getItem('managerToken');
    console.log('🔑 managerToken:', managerToken ? 'Found' : 'Not found');

    const authToken = await AsyncStorage.getItem('authToken');
    console.log('🔑 authToken:', authToken ? 'Found' : 'Not found');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testTokenDebug();
