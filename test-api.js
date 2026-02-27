import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test data
const testCompany = {
  username: 'testuser',
  email: 'test@company.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  companyName: 'Test Company',
  companyEmail: 'contact@testcompany.com',
  companyType: 'both'
};

const testProduct = {
  name: 'Test Product',
  description: 'A test product for API testing',
  sku: 'TEST-001',
  category: 'electronics',
  price: '99.99',
  stockQuantity: 100,
  minStockLevel: 10
};

let authToken = '';
let companyId = '';
let productId = '';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  console.log(`${options.method || 'GET'} ${endpoint}`);
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));
  console.log('---');
  
  return { response, data };
}

// Test functions
async function testRegistration() {
  console.log('🧪 Testing User Registration...');
  
  const { response, data } = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(testCompany)
  });

  if (response.ok && data.token) {
    authToken = data.token;
    companyId = data.company.id;
    console.log('✅ Registration successful!');
  } else {
    console.log('❌ Registration failed:', data.message);
  }
}

async function testLogin() {
  console.log('🧪 Testing User Login...');
  
  const { response, data } = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: testCompany.username,
      password: testCompany.password
    })
  });

  if (response.ok && data.token) {
    authToken = data.token;
    companyId = data.company.id;
    console.log('✅ Login successful!');
  } else {
    console.log('❌ Login failed:', data.message);
  }
}

async function testCreateProduct() {
  console.log('🧪 Testing Product Creation...');
  
  const { response, data } = await apiRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(testProduct)
  });

  if (response.ok && data.id) {
    productId = data.id;
    console.log('✅ Product created successfully!');
  } else {
    console.log('❌ Product creation failed:', data.message);
  }
}

async function testGetProducts() {
  console.log('🧪 Testing Get Products...');
  
  const { response, data } = await apiRequest('/api/products');
  
  if (response.ok) {
    console.log(`✅ Retrieved ${data.length} products!`);
  } else {
    console.log('❌ Get products failed:', data.message);
  }
}

async function testGetProduct() {
  if (!productId) {
    console.log('❌ No product ID available for testing');
    return;
  }
  
  console.log('🧪 Testing Get Single Product...');
  
  const { response, data } = await apiRequest(`/api/products/${productId}`);
  
  if (response.ok && data.id) {
    console.log('✅ Product retrieved successfully!');
  } else {
    console.log('❌ Get product failed:', data.message);
  }
}

async function testGetCompanies() {
  console.log('🧪 Testing Get Companies...');
  
  const { response, data } = await apiRequest('/api/companies');
  
  if (response.ok) {
    console.log(`✅ Retrieved ${data.length} companies!`);
  } else {
    console.log('❌ Get companies failed:', data.message);
  }
}

async function testCreateOrder() {
  if (!productId) {
    console.log('❌ No product ID available for testing');
    return;
  }
  
  console.log('🧪 Testing Order Creation...');
  
  const orderData = {
    sellerCompanyId: companyId, // Using same company for testing
    items: [{
      productId: productId,
      quantity: 2,
      unitPrice: '99.99'
    }],
    shippingAddress: '123 Test St, Test City, TC 12345',
    billingAddress: '123 Test St, Test City, TC 12345',
    notes: 'Test order'
  };
  
  const { response, data } = await apiRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });

  if (response.ok && data.id) {
    console.log('✅ Order created successfully!');
    return data.id;
  } else {
    console.log('❌ Order creation failed:', data.message);
    return null;
  }
}

async function testGetOrders() {
  console.log('🧪 Testing Get Orders...');
  
  const { response, data } = await apiRequest('/api/orders');
  
  if (response.ok) {
    console.log(`✅ Retrieved ${data.length} orders!`);
  } else {
    console.log('❌ Get orders failed:', data.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  try {
    // Test authentication
    await testRegistration();
    await testLogin();
    
    // Test products
    await testCreateProduct();
    await testGetProducts();
    await testGetProduct();
    
    // Test companies
    await testGetCompanies();
    
    // Test orders
    const orderId = await testCreateOrder();
    await testGetOrders();
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

// Run tests if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  runTests();
}

export {
  runTests,
  testRegistration,
  testLogin,
  testCreateProduct,
  testGetProducts,
  testCreateOrder,
  testGetOrders
};
