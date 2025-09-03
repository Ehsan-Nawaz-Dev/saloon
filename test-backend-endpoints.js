// Test script to verify backend endpoints
import { BASE_URL } from './src/api/config';

const testBackendEndpoints = async () => {
  try {
    console.log('🧪 Testing backend endpoints...');
    console.log('🔗 Base URL:', BASE_URL);

    // Test health endpoint
    console.log('\n📡 Testing health endpoint...');
    const healthResponse = await fetch(
      `${BASE_URL.replace('/api', '')}/health`,
    );
    console.log('✅ Health status:', healthResponse.status);

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health data:', healthData);
    }

    // Test debug users endpoint
    console.log('\n📡 Testing debug users endpoint...');
    const usersResponse = await fetch(
      `${BASE_URL.replace('/api', '')}/debug/users`,
    );
    console.log('✅ Users status:', usersResponse.status);

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Users data:', {
        managers: usersData.managers?.length || 0,
        admins: usersData.admins?.length || 0,
        employees: usersData.employees?.length || 0,
        users: usersData.users?.length || 0,
      });

      // Show manager details
      if (usersData.managers && usersData.managers.length > 0) {
        console.log(
          '👥 Managers:',
          usersData.managers.map(m => ({
            id: m._id,
            name: m.name,
            email: m.email,
          })),
        );
      }
    }

    // Test manager face-login endpoint (without data)
    console.log('\n📡 Testing manager face-login endpoint...');
    const faceLoginResponse = await fetch(`${BASE_URL}/manager/face-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        managerId: 'test',
        name: 'test',
        faceVerified: true,
      }),
    });
    console.log('✅ Face login status:', faceLoginResponse.status);

    if (!faceLoginResponse.ok) {
      const errorData = await faceLoginResponse.json();
      console.log('✅ Expected error:', errorData);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testBackendEndpoints();
