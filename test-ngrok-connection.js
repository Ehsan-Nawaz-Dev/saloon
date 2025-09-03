// Test ngrok connection
const axios = require('axios');

const BASE_URL = 'https://e0c20009c203.ngrok-free.app/api';

async function testNgrokConnection() {
  console.log('🧪 Testing Ngrok Connection...\n');

  try {
    // Test 1: Basic connectivity
    console.log('1️⃣ Testing basic connectivity...');
    try {
      const healthResponse = await axios.get(
        `${BASE_URL.replace('/api', '')}/health`,
      );
      console.log('✅ Ngrok backend is accessible:', healthResponse.status);
    } catch (error) {
      console.log('❌ Ngrok backend not accessible:', error.message);
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
  } catch (error) {
    console.log('❌ General error:', error.message);
  }
}

// Run the test
testNgrokConnection();
