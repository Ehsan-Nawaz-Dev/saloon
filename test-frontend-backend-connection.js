// Test frontend-backend connection
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testFrontendBackendConnection() {
  console.log('🧪 Testing Frontend-Backend Connection...\n');

  try {
    // Test 1: Basic connectivity
    console.log('1️⃣ Testing basic connectivity...');
    try {
      const healthResponse = await axios.get(
        `${BASE_URL.replace('/api', '')}/health`,
      );
      console.log('✅ Backend is accessible:', healthResponse.status);
    } catch (error) {
      console.log('❌ Backend not accessible:', error.message);
      return;
    }

    // Test 2: Face recognition users endpoint
    console.log('\n2️⃣ Testing face recognition users endpoint...');
    try {
      const usersResponse = await axios.get(
        `${BASE_URL}/manager/face-recognition-users`,
      );
      console.log('✅ Face recognition endpoint working');
      console.log('📊 Response status:', usersResponse.status);
      console.log(
        '📊 Response data:',
        JSON.stringify(usersResponse.data, null, 2),
      );

      const users = usersResponse.data.data || [];
      console.log(`📈 Found ${users.length} users with face data`);

      if (users.length > 0) {
        users.forEach((user, index) => {
          console.log(`👤 User ${index + 1}:`, {
            id: user._id,
            name: user.name,
            role: user.role,
            hasLivePicture: !!user.livePicture,
            livePictureLength: user.livePicture?.length || 0,
          });
        });
      }
    } catch (error) {
      console.log(
        '❌ Face recognition endpoint failed:',
        error.response?.data || error.message,
      );
    }

    // Test 3: Test with different BASE_URL formats
    console.log('\n3️⃣ Testing different BASE_URL formats...');

    const urls = [
      'http://localhost:5000/api',
      'http://127.0.0.1:5000/api',
      'http://10.0.2.2:5000/api', // Android emulator
      'http://192.168.1.100:5000/api', // Local network
    ];

    for (const url of urls) {
      try {
        console.log(`🔍 Testing: ${url}/manager/face-recognition-users`);
        const response = await axios.get(
          `${url}/manager/face-recognition-users`,
        );
        console.log(
          `✅ ${url} - Working (${
            response.data.data?.length || 0
          } users found)`,
        );
      } catch (error) {
        console.log(`❌ ${url} - Failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.log('❌ General error:', error.message);
  }
}

// Run the test
testFrontendBackendConnection();
