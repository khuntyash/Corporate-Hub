import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testAdminProduct() {
  console.log('🧪 Testing Product Creation with Admin Credentials...\n');
  
  // Login with admin credentials
  console.log('1️⃣ Logging in with admin...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin',
      password: 'change me'
    })
  });

  const loginData = await loginResponse.json();
  
  if (!loginResponse.ok || !loginData.token) {
    console.error('❌ Admin login failed:', loginData.message);
    return;
  }

  console.log('✅ Admin login successful!');
  const token = loginData.token;
  console.log(`   User ID: ${loginData.user?.id}`);
  console.log(`   Company ID: ${loginData.company?.id || 'None'}`);

  // Create a test product
  console.log('2️⃣ Creating test product...');
  const testProduct = {
    name: 'Admin Test Product',
    description: 'A product created by admin for testing',
    sku: 'ADMIN-TEST-001',
    category: 'electronics',
    price: '299.99',
    stockQuantity: 50,
    minStockLevel: 10
  };

  const createResponse = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(testProduct)
  });

  const createdProduct = await createResponse.json();
  
  if (!createResponse.ok) {
    console.error('❌ Product creation failed:', createdProduct.message);
    console.error('   Error details:', createdProduct);
    return;
  }

  console.log('✅ Product created successfully!');
  console.log(`   Product ID: ${createdProduct.id}`);
  console.log(`   Product Name: ${createdProduct.name}`);
  console.log(`   Category: ${createdProduct.category}`);
  console.log(`   Seller: ${createdProduct.seller?.name || 'No seller info'}`);

  // Now check all products to see if it appears
  console.log('3️⃣ Checking all products...');
  const checkResponse = await fetch(`${BASE_URL}/api/products`);
  const allProducts = await checkResponse.json();

  if (checkResponse.ok) {
    console.log(`✅ Found ${allProducts.length} products in system:`);
    
    // Find your created product
    const myProduct = allProducts.find(p => p.id === createdProduct.id);
    
    if (myProduct) {
      console.log('🎯 SUCCESS: Your created product is now in the list!');
      console.log(`   Product: ${myProduct.name}`);
      console.log(`   Category: ${myProduct.category}`);
      console.log(`   Seller: ${myProduct.seller?.name || 'Unknown'}`);
      console.log(`   Price: ${myProduct.price}`);
      console.log(`   Stock: ${myProduct.stockQuantity}`);
    } else {
      console.log('❌ ISSUE: Your created product is not showing up');
      console.log('   Looking for product ID:', createdProduct.id);
      console.log('   Available products:', allProducts.map(p => ({ 
        id: p.id, 
        name: p.name, 
        seller: p.seller?.name 
      })));
    }
  } else {
    console.error('❌ Failed to fetch products');
  }
}

testAdminProduct();
