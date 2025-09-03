// Test script to verify face-login endpoints
import { BASE_URL } from './src/api/config';

const testFaceLogin = async () => {
  try {
    console.log('🧪 Testing face-login endpoints...');
    console.log('🔗 Base URL:', BASE_URL);

    // Test manager face-login endpoint
    console.log('\n📡 Testing manager face-login endpoint...');
    const managerResponse = await fetch(`${BASE_URL}/manager/face-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        managerId: '68b56b432f216d1cadae1589', // From your debug info
        name: 'Fawad',
        faceVerified: true,
      }),
    });

    console.log('✅ Manager face-login status:', managerResponse.status);

    if (managerResponse.ok) {
      const managerData = await managerResponse.json();
      console.log('✅ Manager face-login response:', managerData);
    } else {
      const errorData = await managerResponse.json();
      console.log('❌ Manager face-login error:', errorData);
    }

    // Test admin face-login endpoint
    console.log('\n📡 Testing admin face-login endpoint...');
    const adminResponse = await fetch(`${BASE_URL}/auth/face-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminId: '68b56b432f216d1cadae1589', // From your debug info
        name: 'Fawad',
        faceVerified: true,
      }),
    });

    console.log('✅ Admin face-login status:', adminResponse.status);

    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log('✅ Admin face-login response:', adminData);
    } else {
      const errorData = await adminResponse.json();
      console.log('❌ Admin face-login error:', errorData);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testFaceLogin();
