// Test frontend filtering logic
const axios = require('axios');

const BASE_URL = 'https://e0c20009c203.ngrok-free.app/api';

async function testFrontendFiltering() {
  console.log('🧪 Testing Frontend Filtering Logic...\n');

  try {
    // Get data from backend
    const response = await axios.get(
      `${BASE_URL}/manager/face-recognition-users`,
    );
    console.log('✅ Backend response received');

    const users = response.data.data || [];
    console.log(`📊 Total users from backend: ${users.length}`);

    // Log all users for debugging
    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`, {
        id: user._id,
        name: user.name,
        role: user.role,
        roleType: typeof user.role,
        hasLivePicture: !!user.livePicture,
      });
    });

    // Test the same filtering logic as frontend
    const managers = users.filter(
      user => user.role && user.role.toLowerCase() === 'manager',
    );
    const admins = users.filter(
      user => user.role && user.role.toLowerCase() === 'admin',
    );

    console.log(`\n📈 Filtering Results:`);
    console.log(`✅ Managers found: ${managers.length}`);
    console.log(`✅ Admins found: ${admins.length}`);

    if (managers.length > 0) {
      console.log('👥 Managers:');
      managers.forEach((manager, index) => {
        console.log(`  ${index + 1}. ${manager.name} (${manager.role})`);
      });
    }

    if (admins.length > 0) {
      console.log('👥 Admins:');
      admins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ${admin.name} (${admin.role})`);
      });
    }

    // Test the condition that triggers the error
    if (managers.length === 0 && admins.length === 0) {
      console.log(
        '\n❌ This would trigger the error: "No registered managers or admins found"',
      );
    } else {
      console.log('\n✅ Data found - should not trigger the error');
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testFrontendFiltering();
