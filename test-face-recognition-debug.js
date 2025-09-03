// Test script to debug face recognition issues
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testFaceRecognitionEndpoints() {
  console.log('🧪 Testing Face Recognition Endpoints...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connectivity...');
    try {
      const healthResponse = await axios.get(
        `${BASE_URL.replace('/api', '')}/health`,
      );
      console.log('✅ Server is running:', healthResponse.status);
    } catch (error) {
      console.log('❌ Server not running or health endpoint not available');
      return;
    }

    // Test 2: Test face recognition users endpoint
    console.log('\n2️⃣ Testing face recognition users endpoint...');
    try {
      const usersResponse = await axios.get(
        `${BASE_URL}/manager/face-recognition-users`,
      );
      console.log('✅ Face recognition users endpoint working');
      console.log('📊 Response:', JSON.stringify(usersResponse.data, null, 2));

      const users = usersResponse.data.data || [];
      console.log(`📈 Found ${users.length} users with face data`);

      if (users.length === 0) {
        console.log('⚠️ No users found with face data!');
      } else {
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
        '❌ Face recognition users endpoint failed:',
        error.response?.data || error.message,
      );
    }

    // Test 3: Test database contents endpoint
    console.log('\n3️⃣ Testing database contents endpoint...');
    try {
      const testResponse = await axios.get(
        `${BASE_URL}/manager/test-face-data`,
      );
      console.log('✅ Database test endpoint working');
      console.log(
        '📊 Database contents:',
        JSON.stringify(testResponse.data, null, 2),
      );

      const data = testResponse.data.data;
      console.log(
        `📈 Managers: ${data.managers.length}, Admins: ${
          data.admins.length
        }, Users: ${data.users.length}, Employees: ${
          data.employees?.length || 0
        }`,
      );

      // Check if any have face data
      const managersWithFace = data.managers.filter(m => m.hasLivePicture);
      const adminsWithFace = data.admins.filter(a => a.hasLivePicture);
      const usersWithFace = data.users.filter(u => u.hasFaceImageUrl);
      const employeesWithFace =
        data.employees?.filter(e => e.hasLivePicture) || [];

      console.log(
        `📈 With face data - Managers: ${managersWithFace.length}, Admins: ${adminsWithFace.length}, Users: ${usersWithFace.length}, Employees: ${employeesWithFace.length}`,
      );

      // Show detailed user info
      if (data.users.length > 0) {
        console.log('👥 Users in database:');
        data.users.forEach((user, index) => {
          console.log(
            `  User ${index + 1}: ${user.name} (${
              user.hasFaceImageUrl ? 'Has face data' : 'No face data'
            })`,
          );
        });
      }

      // Show detailed employee info
      if (data.employees && data.employees.length > 0) {
        console.log('👥 Employees in database:');
        data.employees.forEach((emp, index) => {
          console.log(
            `  Employee ${index + 1}: ${emp.name} (${emp.role}) (${
              emp.hasLivePicture ? 'Has face data' : 'No face data'
            })`,
          );
        });
      }
    } catch (error) {
      console.log(
        '❌ Database test endpoint failed:',
        error.response?.data || error.message,
      );
    }

    // Test 4: Test manager face login endpoint (without data)
    console.log('\n4️⃣ Testing manager face login endpoint...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/manager/face-login`, {
        managerId: 'test',
        name: 'test',
        faceVerified: true,
      });
      console.log('✅ Manager face login endpoint working');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(
          '✅ Manager face login endpoint working (expected 404 for test data)',
        );
      } else {
        console.log(
          '❌ Manager face login endpoint failed:',
          error.response?.data || error.message,
        );
      }
    }
  } catch (error) {
    console.log('❌ General error:', error.message);
  }
}

// Run the test
testFaceRecognitionEndpoints();
