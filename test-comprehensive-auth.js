// Comprehensive Authentication and API Test Script
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getAuthToken, 
  getManagerToken, 
  getAdminToken, 
  getUserType, 
  getUserData,
  createAuthenticatedInstance,
  clearAuthData 
} from './src/utils/authUtils';
import { BASE_URL } from './src/api/config';
import axios from 'axios';

const testComprehensiveAuth = async () => {
  try {
    console.log('🧪 Starting Comprehensive Authentication Test...\n');

    // Test 1: Check current AsyncStorage state
    console.log('📦 Test 1: Checking AsyncStorage state...');
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('📦 All AsyncStorage keys:', allKeys);

    // Test 2: Check authentication tokens
    console.log('\n🔑 Test 2: Checking authentication tokens...');
    
    const authToken = await getAuthToken();
    console.log('🔑 getAuthToken result:', authToken ? 'Token found' : 'No token');
    
    const managerToken = await getManagerToken();
    console.log('🔑 getManagerToken result:', managerToken ? 'Token found' : 'No token');
    
    const adminToken = await getAdminToken();
    console.log('🔑 getAdminToken result:', adminToken ? 'Token found' : 'No token');

    // Test 3: Check user type and data
    console.log('\n👤 Test 3: Checking user type and data...');
    
    const userType = await getUserType();
    console.log('👤 getUserType result:', userType || 'No user type');
    
    const userData = await getUserData();
    console.log('👤 getUserData result:', userData ? `${userData.type}: ${userData.data?.name}` : 'No user data');

    // Test 4: Test authenticated instance creation
    console.log('\n🔐 Test 4: Testing authenticated instance creation...');
    try {
      const authInstance = await createAuthenticatedInstance();
      console.log('✅ createAuthenticatedInstance successful');
      console.log('🔐 Headers:', authInstance.headers);
    } catch (error) {
      console.log('❌ createAuthenticatedInstance failed:', error.message);
    }

    // Test 5: Test backend connectivity
    console.log('\n🌐 Test 5: Testing backend connectivity...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Backend health check successful:', healthResponse.status);
      console.log('📊 Health data:', healthResponse.data);
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
    }

    // Test 6: Test API endpoints with authentication
    console.log('\n🔗 Test 6: Testing authenticated API endpoints...');
    
    if (authToken) {
      try {
        // Test services endpoint
        const servicesResponse = await axios.get(`${BASE_URL}/services`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('✅ Services API call successful:', servicesResponse.status);
      } catch (error) {
        console.log('❌ Services API call failed:', error.response?.status, error.response?.data?.message);
      }

      try {
        // Test employees endpoint
        const employeesResponse = await axios.get(`${BASE_URL}/employees/all`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('✅ Employees API call successful:', employeesResponse.status);
      } catch (error) {
        console.log('❌ Employees API call failed:', error.response?.status, error.response?.data?.message);
      }

      // Test admin-specific endpoints if user is admin
      if (userType === 'admin') {
        try {
          const adminAttendanceResponse = await axios.get(`${BASE_URL}/admin/attendance/all`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });
          console.log('✅ Admin attendance API call successful:', adminAttendanceResponse.status);
        } catch (error) {
          console.log('❌ Admin attendance API call failed:', error.response?.status, error.response?.data?.message);
        }
      }

      // Test manager-specific endpoints if user is manager
      if (userType === 'manager') {
        try {
          const managerAdvanceSalaryResponse = await axios.get(`${BASE_URL}/advance-salary/all`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });
          console.log('✅ Manager advance salary API call successful:', managerAdvanceSalaryResponse.status);
        } catch (error) {
          console.log('❌ Manager advance salary API call failed:', error.response?.status, error.response?.data?.message);
        }
      }
    } else {
      console.log('⚠️ No authentication token available for API testing');
    }

    // Test 7: Check specific auth data
    console.log('\n📋 Test 7: Checking specific authentication data...');
    
    const managerAuth = await AsyncStorage.getItem('managerAuth');
    if (managerAuth) {
      const parsed = JSON.parse(managerAuth);
      console.log('🔑 managerAuth data:', {
        tokenExists: !!parsed.token,
        tokenType: parsed.token ? 
          (parsed.token.startsWith('eyJ') ? 'JWT' : 
           parsed.token.startsWith('face_auth_') ? 'Face Auth' : 'Unknown') : 'None',
        managerExists: !!parsed.manager,
        isAuthenticated: parsed.isAuthenticated,
        managerName: parsed.manager?.name,
      });
    }

    const adminAuth = await AsyncStorage.getItem('adminAuth');
    if (adminAuth) {
      const parsed = JSON.parse(adminAuth);
      console.log('🔑 adminAuth data:', {
        tokenExists: !!parsed.token,
        tokenType: parsed.token ? 
          (parsed.token.startsWith('eyJ') ? 'JWT' : 
           parsed.token.startsWith('face_auth_') ? 'Face Auth' : 'Unknown') : 'None',
        adminExists: !!parsed.admin,
        isAuthenticated: parsed.isAuthenticated,
        adminName: parsed.admin?.name,
      });
    }

    console.log('\n✅ Comprehensive Authentication Test Complete!');
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`- Authentication Token: ${authToken ? '✅ Available' : '❌ Not Available'}`);
    console.log(`- User Type: ${userType ? `✅ ${userType}` : '❌ Not Determined'}`);
    console.log(`- Backend Connectivity: ${authToken ? '✅ Tested' : '⚠️ Not Tested'}`);
    console.log(`- API Endpoints: ${authToken ? '✅ Tested' : '⚠️ Not Tested'}`);

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
  }
};

// Run the test
testComprehensiveAuth();
