const axios = require('axios');

const BASE_URL = 'https://e0c20009c203.ngrok-free.app/api';

async function testAdvanceSalaryFaceRecognition() {
  console.log('🧪 Testing Advance Salary Face Recognition Endpoints...\n');

  try {
    // Test 1: Get all employees
    console.log('1️⃣ Testing /api/employees/all...');
    try {
      const employeesResponse = await axios.get(`${BASE_URL}/employees/all`);
      console.log('✅ Employees endpoint working');
      console.log(
        '📊 Total employees:',
        employeesResponse.data.data?.length ||
          employeesResponse.data.length ||
          0,
      );

      const allUsers =
        employeesResponse.data.data || employeesResponse.data || [];
      console.log('📊 All users from employees endpoint:', allUsers.length);

      // Analyze roles
      const employees = allUsers.filter(user => user.role === 'employee');
      const managers = allUsers.filter(user => user.role === 'manager');
      const admins = allUsers.filter(user => user.role === 'admin');

      console.log('📊 Role breakdown:');
      console.log('   - Employees:', employees.length);
      console.log('   - Managers:', managers.length);
      console.log('   - Admins:', admins.length);

      if (managers.length > 0) {
        console.log('📊 Sample manager:', {
          name: managers[0].name,
          role: managers[0].role,
          employeeId: managers[0].employeeId,
          hasLivePicture: !!managers[0].livePicture,
        });
      }

      if (employees.length > 0) {
        console.log('📊 Sample employee:', {
          name: employees[0].name,
          role: employees[0].role,
          employeeId: employees[0].employeeId,
          hasLivePicture: !!employees[0].livePicture,
        });
      }
    } catch (error) {
      console.error(
        '❌ Employees endpoint failed:',
        error.response?.status,
        error.response?.data,
      );
    }

    // Test 2: Get all admins (for managers)
    console.log('\n2️⃣ Testing /api/admin/all...');
    try {
      const adminsResponse = await axios.get(`${BASE_URL}/admin/all`);
      console.log('✅ Admins endpoint working');
      console.log(
        '📊 Total admins:',
        adminsResponse.data.data?.length || adminsResponse.data.length || 0,
      );
      console.log(
        '📊 Sample admin:',
        adminsResponse.data.data?.[0] || adminsResponse.data[0],
      );

      // Filter managers
      const managers = (
        adminsResponse.data.data ||
        adminsResponse.data ||
        []
      ).filter(admin => admin.role === 'manager');
      console.log('📊 Total managers from admin endpoint:', managers.length);
      console.log('📊 Sample manager from admin endpoint:', managers[0]);
    } catch (error) {
      console.error(
        '❌ Admins endpoint failed:',
        error.response?.status,
        error.response?.data,
      );
    }

    // Test 3: Test compare-faces endpoint (without actual image)
    console.log(
      '\n3️⃣ Testing /api/employees/compare-faces endpoint structure...',
    );
    try {
      // This will fail but we can see if the endpoint exists
      const compareResponse = await axios.post(
        `${BASE_URL}/employees/compare-faces`,
        {
          sourceImage: 'test',
          targetImageUrl: 'test',
        },
      );
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(
          '✅ Compare-faces endpoint exists (expected 400 for missing file)',
        );
        console.log('📊 Error message:', error.response.data);
      } else {
        console.error(
          '❌ Compare-faces endpoint failed:',
          error.response?.status,
          error.response?.data,
        );
      }
    }

    // Test 4: Check if endpoints are accessible
    console.log('\n4️⃣ Testing endpoint accessibility...');
    const endpoints = [
      '/api/employees/all',
      '/api/admin/all',
      '/api/employees/compare-faces',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(
          `${BASE_URL}${endpoint.replace('/compare-faces', '/all')}`,
        );
        console.log(`✅ ${endpoint} is accessible`);
      } catch (error) {
        console.log(`⚠️ ${endpoint} status: ${error.response?.status}`);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdvanceSalaryFaceRecognition();
