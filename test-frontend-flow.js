// Test exact frontend flow
const axios = require('axios');

const BASE_URL = 'https://e0c20009c203.ngrok-free.app/api';

// Simulate the exact getRegisteredUsers function from frontend
async function getRegisteredUsers() {
  try {
    console.log('🔍 [Face Recognition] Fetching users for face recognition...');

    const response = await axios.get(
      `${BASE_URL}/manager/face-recognition-users`,
    );
    console.log('✅ [Face Recognition] API Response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch users');
    }

    const users = response.data.data || [];
    console.log('✅ [Face Recognition] Total users found:', users.length);
    console.log('✅ [Face Recognition] Raw users data:', users);

    // Filter managers and admins (exact same logic as frontend)
    const managers = users.filter(
      user => user.role && user.role.toLowerCase() === 'manager',
    );
    const admins = users.filter(
      user => user.role && user.role.toLowerCase() === 'admin',
    );

    console.log('✅ [Face Recognition] Managers found:', managers.length);
    console.log('✅ [Face Recognition] Admins found:', admins.length);
    console.log('✅ [Face Recognition] Filtered managers:', managers);
    console.log('✅ [Face Recognition] Filtered admins:', admins);

    return { managers, admins };
  } catch (error) {
    console.error('❌ [Face Recognition] Error fetching users:', error);
    throw error;
  }
}

// Simulate the exact startFaceRecognitionProcess function
async function simulateFaceRecognitionProcess() {
  console.log('🧪 Simulating Face Recognition Process...\n');

  try {
    console.log('📸 Simulating photo capture...');

    console.log('🔍 Fetching user data...');
    const { managers, admins } = await getRegisteredUsers();

    console.log('🔍 [Face Recognition] After getRegisteredUsers:');
    console.log('🔍 [Face Recognition] Managers count:', managers.length);
    console.log('🔍 [Face Recognition] Admins count:', admins.length);
    console.log('🔍 [Face Recognition] Managers data:', managers);
    console.log('🔍 [Face Recognition] Admins data:', admins);

    if (managers.length === 0 && admins.length === 0) {
      console.log(
        '❌ [Face Recognition] No managers or admins found - throwing error',
      );
      throw new Error(
        'No registered managers or admins found. Please register users in Admin Panel.',
      );
    }

    console.log(
      '✅ [Face Recognition] Data found - would proceed to face comparison',
    );
    console.log(
      '✅ [Face Recognition] Would compare faces with:',
      managers.length + admins.length,
      'users',
    );
  } catch (error) {
    console.error('❌ [Face Recognition] Process failed:', error.message);
  }
}

// Run the simulation
simulateFaceRecognitionProcess();
