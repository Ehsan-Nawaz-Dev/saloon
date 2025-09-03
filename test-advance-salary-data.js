const axios = require('axios');

const BASE_URL = 'https://e0c20009c203.ngrok-free.app/api';

async function testAdvanceSalaryData() {
  console.log('🧪 Testing Advance Salary Data Structure...\n');

  try {
    // Test 1: Get advance salary data
    console.log('1️⃣ Testing /api/advance-salary/all...');
    try {
      const response = await axios.get(
        `${BASE_URL}/advance-salary/all?status=approved`,
      );
      console.log('✅ Advance salary endpoint working');
      console.log('📊 Total records:', response.data.length || 0);

      if (response.data && response.data.length > 0) {
        console.log('📊 Sample record structure:');
        console.log(JSON.stringify(response.data[0], null, 2));

        // Analyze the data structure
        const sample = response.data[0];
        console.log('\n📊 Field analysis:');
        console.log('   - employeeId:', sample.employeeId);
        console.log('   - employeeName:', sample.employeeName);
        console.log(
          '   - amount:',
          sample.amount,
          'Type:',
          typeof sample.amount,
        );
        console.log('   - role:', sample.role);
        console.log('   - employee object:', sample.employee);
        console.log('   - createdAt:', sample.createdAt);

        if (sample.employee) {
          console.log('\n📊 Employee object analysis:');
          console.log('   - employee.name:', sample.employee.name);
          console.log('   - employee.employeeId:', sample.employee.employeeId);
          console.log('   - employee.role:', sample.employee.role);
        }
      }
    } catch (error) {
      console.error(
        '❌ Advance salary endpoint failed:',
        error.response?.status,
        error.response?.data,
      );
    }

    // Test 2: Check if endpoint exists
    console.log('\n2️⃣ Testing endpoint accessibility...');
    try {
      const response = await axios.get(`${BASE_URL}/advance-salary/all`);
      console.log('✅ /api/advance-salary/all is accessible');
    } catch (error) {
      console.log('⚠️ /api/advance-salary/all status:', error.response?.status);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdvanceSalaryData();
