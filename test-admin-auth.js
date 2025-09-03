const AsyncStorage = require('@react-native-async-storage/async-storage');

async function testAdminAuth() {
  console.log('🧪 Testing Admin Authentication...\n');

  try {
    // Check adminAuth data
    console.log('1️⃣ Checking adminAuth data...');
    const adminAuthData = await AsyncStorage.getItem('adminAuth');
    console.log('📊 adminAuth data exists:', !!adminAuthData);
    
    if (adminAuthData) {
      const parsed = JSON.parse(adminAuthData);
      console.log('📊 adminAuth structure:', {
        hasToken: !!parsed.token,
        hasAdmin: !!parsed.admin,
        isAuthenticated: parsed.isAuthenticated,
        adminName: parsed.admin?.name,
        tokenPreview: parsed.token ? parsed.token.substring(0, 20) + '...' : 'No token'
      });
    }

    // Check managerAuth data
    console.log('\n2️⃣ Checking managerAuth data...');
    const managerAuthData = await AsyncStorage.getItem('managerAuth');
    console.log('📊 managerAuth data exists:', !!managerAuthData);
    
    if (managerAuthData) {
      const parsed = JSON.parse(managerAuthData);
      console.log('📊 managerAuth structure:', {
        hasToken: !!parsed.token,
        hasManager: !!parsed.manager,
        isAuthenticated: parsed.isAuthenticated,
        managerName: parsed.manager?.name,
        tokenPreview: parsed.token ? parsed.token.substring(0, 20) + '...' : 'No token'
      });
    }

    // Check other auth tokens
    console.log('\n3️⃣ Checking other auth tokens...');
    const authToken = await AsyncStorage.getItem('authToken');
    const adminToken = await AsyncStorage.getItem('adminToken');
    const managerToken = await AsyncStorage.getItem('managerToken');
    
    console.log('📊 authToken exists:', !!authToken);
    console.log('📊 adminToken exists:', !!adminToken);
    console.log('📊 managerToken exists:', !!managerToken);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminAuth();
