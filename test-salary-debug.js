// Test script to debug salary issue
const axios = require('axios');

const testSalaryAPI = async () => {
  console.log('🔍 Testing Salary API Response...\n');

  try {
    console.log('📡 Making API call to employee endpoint...');
    const response = await axios.get('http://192.168.18.16:5000/api/employees/all');
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Structure:');
    console.log('   - message:', response.data.message);
    console.log('   - has data:', !!response.data.data);
    
    if (response.data.data) {
      const managers = response.data.data.managers || [];
      const employees = response.data.data.employees || [];
      const allEmployees = [...managers, ...employees];
      
      console.log('👥 Total Employees Found:', allEmployees.length);
      console.log('👔 Managers:', managers.length);
      console.log('👨‍💼 Employees:', employees.length);
      
      if (allEmployees.length > 0) {
        console.log('\n🔍 First Employee Sample:');
        const sampleEmp = allEmployees[0];
        console.log('   - name:', sampleEmp.name);
        console.log('   - role:', sampleEmp.role);
        console.log('   - monthlySalary:', sampleEmp.monthlySalary);
        console.log('   - salary (if exists):', sampleEmp.salary);
        console.log('   - phoneNumber:', sampleEmp.phoneNumber);
        console.log('   - employeeId:', sampleEmp.employeeId);
        
        console.log('\n📋 What Frontend Will Show:');
        const frontendData = {
          id: sampleEmp.employeeId || sampleEmp._id,
          name: sampleEmp.name,
          phoneNumber: sampleEmp.phoneNumber,
          idCardNumber: sampleEmp.idCardNumber,
          salary: sampleEmp.monthlySalary || sampleEmp.salary, // This should show the salary
          role: sampleEmp.role,
        };
        console.log(frontendData);
        
        if (!frontendData.salary) {
          console.log('❌ ISSUE FOUND: No salary field available!');
          console.log('💡 Available fields in employee object:');
          console.log(Object.keys(sampleEmp));
        } else {
          console.log('✅ Salary found:', frontendData.salary);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testSalaryAPI();





