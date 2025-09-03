// Script to fix admin face data issue
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function fixAdminFaceData() {
  console.log('🔧 Fixing Admin Face Data Issue...\n');

  try {
    // First, let's check what's in the database
    console.log('1️⃣ Checking current database state...');
    const testResponse = await axios.get(`${BASE_URL}/manager/test-face-data`);
    const data = testResponse.data.data;

    console.log(
      `📊 Current state: ${data.managers.length} managers, ${data.admins.length} admins, ${data.users.length} users`,
    );

    if (data.admins.length > 0) {
      const admin = data.admins[0];
      console.log(`👤 Found admin: ${admin.name} (ID: ${admin.id})`);
      console.log(`📸 Has face data: ${admin.hasLivePicture}`);

      if (!admin.hasLivePicture) {
        console.log('⚠️ Admin exists but has no face data!');
        console.log(
          '💡 You need to re-register with face data or add face data manually.',
        );
      }
    }

    if (data.users.length > 0) {
      console.log('👥 Users found:');
      data.users.forEach((user, index) => {
        console.log(
          `  User ${index + 1}: ${user.name} (Has face: ${
            user.hasFaceImageUrl
          })`,
        );
      });
    }

    console.log('\n2️⃣ Recommendations:');
    console.log(
      '   • If you registered as a manager, use the Admin Panel to add a manager with face data',
    );
    console.log(
      '   • If you registered as an admin, you need to re-register with face data',
    );
    console.log(
      '   • Make sure to upload a clear face image during registration',
    );

    console.log('\n3️⃣ Next steps:');
    console.log('   • Go to Admin Panel → Employees → Add New Employee');
    console.log('   • Select role as "Manager"');
    console.log('   • Upload a clear face image');
    console.log('   • Save the manager');
    console.log('   • Then try face recognition again');
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

// Run the fix
fixAdminFaceData();
