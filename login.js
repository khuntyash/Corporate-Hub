import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Login credentials
const credentials = {
  username: 'newuser',
  password: 'NewUser123!'
};

async function login() {
  console.log('🔐 Logging in to get JWT token...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      console.log('✅ Login successful!');
      console.log('🎫 JWT Token:');
      console.log(data.token);
      console.log();
      console.log('💡 How to use this token:');
      console.log('   1. Copy the token above');
      console.log('   2. Add to your API requests as Authorization header:');
      console.log('      Authorization: Bearer YOUR_TOKEN_HERE');
      console.log();
      console.log('🔧 Example API call:');
      console.log('   curl -X GET http://localhost:5000/api/products \\');
      console.log('        -H "Authorization: Bearer YOUR_TOKEN_HERE"');
      
      return data.token;
    } else {
      console.error('❌ Login failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error logging in:', error.message);
    return null;
  }
}

// Run the login
login();
