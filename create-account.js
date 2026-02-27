import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// User registration form
const newUser = {
  username: 'newuser',
  email: 'newuser@company.com',
  password: 'NewUser123!',
  firstName: 'New',
  lastName: 'User',
  companyName: 'New Company',
  companyEmail: 'newcompany@business.com',
  companyType: 'both'
};

async function createAccount() {
  console.log('🔧 Creating new user account...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Account created successfully!');
      console.log('📋 User Details:');
      console.log(`   Username: ${newUser.username}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Password: ${newUser.password}`);
      console.log();
      console.log('🔑 Login Credentials:');
      console.log(`   Username: ${newUser.username}`);
      console.log(`   Password: ${newUser.password}`);
      console.log();
      console.log('💡 Next Steps:');
      console.log('   1. Use the login credentials above to get your JWT token');
      console.log('   2. Save the token for API access');
      console.log('   3. Start creating products, orders, etc.');
      
      return data;
    } else {
      console.error('❌ Failed to create account:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating account:', error.message);
    return null;
  }
}

// Run the account creation
createAccount();
