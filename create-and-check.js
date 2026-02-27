import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function createAndCheckProduct() {
  console.log('🧪 Creating Test Product and Checking if it Appears...\n');
  
  // First login to get token
  console.log('1️⃣ Logging in...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'newuser',
      password: 'NewUser123!'
    })
  });

  const loginData = await loginResponse.json();
  
  if (!loginResponse.ok || !loginData.token) {
    console.error('❌ Login failed:', loginData.message);
    return;
  }

  console.log('✅ Login successful!');
  const token = loginData.token;

  // Create a test product
  console.log('2️⃣ Creating test product...');
  const testProduct = {
    name: 'My Test Product',
    description: 'A product created for testing',
    sku: 'TEST-001',
    category: 'electronics',
    price: '199.99',
    stockQuantity: 25,
    minStockLevel: 5
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
    return;
  }

  console.log('✅ Product created successfully!');
  console.log(`   Product ID: ${createdProduct.id}`);
  console.log(`   Product Name: ${createdProduct.name}`);
  console.log(`   Seller: ${createdProduct.seller?.name}`);

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
      console.log(`   Seller: ${myProduct.seller?.name}`);
      console.log(`   Price: ${myProduct.price}`);
    } else {
      console.log('❌ ISSUE: Your created product is not showing up');
      console.log('   Looking for product ID:', createdProduct.id);
      console.log('   Available products:', allProducts.map(p => ({ id: p.id, name: p.name })));
    }
  } else {
    console.error('❌ Failed to fetch products');
  }
}

createAndCheckProduct();
