import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testLoginEnforcement() {
  console.log('🧪 Testing Login Enforcement Policy...\n');
  
  // Test 1: Try to login with non-existent user
  console.log('1️⃣ Testing login with non-existent user...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'nonexistentuser',
        password: 'password123'
      })
    });

    const data = await response.json();
    
    if (response.status === 401 && data.code === 'ACCOUNT_NOT_FOUND') {
      console.log('✅ PASS: Non-existent user properly rejected');
    } else {
      console.log('❌ FAIL: Should have rejected non-existent user');
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('');

  // Test 2: Try to login with existing user but wrong password
  console.log('2️⃣ Testing login with existing user but wrong password...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'newuser', // This user exists from our earlier test
        password: 'wrongpassword'
      })
    });

    const data = await response.json();
    
    if (response.status === 401 && data.code === 'INVALID_PASSWORD') {
      console.log('✅ PASS: Wrong password properly rejected');
    } else {
      console.log('❌ FAIL: Should have rejected wrong password');
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('');

  // Test 3: Successful login with correct credentials
  console.log('3️⃣ Testing successful login...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'newuser',
        password: 'NewUser123!'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      console.log('✅ PASS: Valid credentials accepted');
      console.log('🎫 Token received:', data.token.substring(0, 50) + '...');
    } else {
      console.log('❌ FAIL: Valid credentials should work');
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n🎯 Login Enforcement Test Complete!');
  console.log('💡 Users must create an account before they can log in.');
  console.log('📋 The system now properly validates user existence and provides clear error messages.');
}

// Run the test
testLoginEnforcement();
