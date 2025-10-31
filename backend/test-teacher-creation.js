const axios = require('axios');

async function testTeacherCreation() {
  console.log('🧪 Testing Teacher Creation with Email...\n');

  const testTeacher = {
    firstName: 'Test',
    lastName: 'Teacher',
    email: 'zlabor_220000000434@uic.edu.ph', // Using the same test email
    department: 'Computer Science',
    employeeId: 'TEST001'
  };

  try {
    console.log('📝 Creating teacher with data:');
    console.log(JSON.stringify(testTeacher, null, 2));
    console.log('\n🚀 Sending request to admin API...');

    const response = await axios.post('http://localhost:5000/api/admin/teachers', testTeacher, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Teacher creation successful!');
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.emailSent) {
      console.log('\n📧 ✅ Password reset email was sent successfully!');
      console.log('📬 Check the email inbox for the password reset link.');
    } else {
      console.log('\n📧 ❌ Email sending failed:');
      console.log('🔍 Error:', response.data.emailError || 'Unknown error');
    }

  } catch (error) {
    console.error('\n❌ Teacher creation failed:');
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('🔍 Error:', error.message);
    }
  }
}

// Run the test
testTeacherCreation();