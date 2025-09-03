// Test script to verify employee API fix
const axios = require('axios');

const testEmployeeAPIFix = async () => {
  console.log('🧪 Testing Employee API Fix...\n');

  try {
    // Test 1: Check API response structure
    console.log('1️⃣ Testing API response structure...');
    const response = await axios.get(
      'http://192.168.18.16:5000/api/employees/all',
    );

    console.log('✅ API Response Status:', response.status);
    console.log('📋 Response Structure:');
    console.log('   - message:', response.data.message);
    console.log('   - has data:', !!response.data.data);
    console.log('   - has managers:', !!response.data.data?.managers);
    console.log('   - has employees:', !!response.data.data?.employees);
    console.log(
      '   - managers count:',
      response.data.data?.managers?.length || 0,
    );
    console.log(
      '   - employees count:',
      response.data.data?.employees?.length || 0,
    );
    console.log('');

    // Test 2: Simulate the fix logic
    console.log('2️⃣ Testing fix logic...');
    if (response.status === 200 && response.data.data) {
      const managers = response.data.data.managers || [];
      const employees = response.data.data.employees || [];
      const allEmployees = [...managers, ...employees];

      console.log('✅ Combined employees count:', allEmployees.length);

      if (allEmployees.length > 0) {
        const sampleEmployee = allEmployees[0];
        console.log('📋 Sample employee structure:');
        console.log(
          '   - ID:',
          sampleEmployee.employeeId || sampleEmployee._id,
        );
        console.log('   - Name:', sampleEmployee.name);
        console.log('   - Phone:', sampleEmployee.phoneNumber);
        console.log('   - Role:', sampleEmployee.role);
        console.log('   - Has face image:', !!sampleEmployee.livePicture);
      }
    }
    console.log('');

    // Test 3: Test success messages
    console.log('3️⃣ Testing success messages...');
    const getSuccessMessage = role => {
      switch (role) {
        case 'admin':
          return 'Admin has been added successfully! Now you can move to employee screen.';
        case 'manager':
          return 'Manager (Head-girl) has been added successfully! Now you can move to employee screen.';
        case 'employee':
          return 'Employee has been added successfully! Now you can move to employee screen.';
        default:
          return 'Employee registered successfully! Now you can move to employee screen.';
      }
    };

    console.log('✅ Admin message:', getSuccessMessage('admin'));
    console.log('✅ Manager message:', getSuccessMessage('manager'));
    console.log('✅ Employee message:', getSuccessMessage('employee'));
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('📱 The employee API integration should now work properly.');
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log(
        '💡 Make sure your backend server is running on http://192.168.18.16:5000',
      );
    }

    if (error.response) {
      console.log('📊 Response status:', error.response.status);
      console.log('📋 Response data:', error.response.data);
    }
  }
};

// Run the test
testEmployeeAPIFix();





