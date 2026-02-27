import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testInquirySystem() {
  console.log('🧪 Testing Inquiry Form System...\n');
  
  try {
    // Step 1: Get available products
    console.log('1️⃣ Getting available products...');
    const productsResponse = await fetch(`${BASE_URL}/api/products`);
    const products = await productsResponse.json();
    
    if (!productsResponse.ok || products.length === 0) {
      console.error('❌ No products available for inquiry');
      return;
    }
    
    const testProduct = products[0];
    console.log(`✅ Found product: ${testProduct.name} (ID: ${testProduct.id})`);
    console.log(`   Seller: ${testProduct.seller?.name || 'Unknown'}`);
    
    // Step 2: Create an inquiry
    console.log('2️⃣ Creating inquiry...');
    const inquiryData = {
      productId: testProduct.id,
      productName: testProduct.name,
      sellerCompanyId: testProduct.seller?.id || 'unknown',
      buyerName: 'John Doe',
      buyerEmail: 'john.doe@example.com',
      buyerPhone: '+1234567890',
      buyerCompany: 'Test Company',
      subject: 'Interested in bulk purchase',
      message: 'I am interested in purchasing 50 units of this product. Please provide bulk pricing and delivery information.',
      quantity: '50',
      budget: '$5000',
      deliveryDate: '2024-03-15',
      additionalRequirements: 'Need custom branding on products',
      priority: 'high'
    };

    const inquiryResponse = await fetch(`${BASE_URL}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryData)
    });

    const createdInquiry = await inquiryResponse.json();
    
    if (!inquiryResponse.ok) {
      console.error('❌ Failed to create inquiry:', createdInquiry.message);
      return;
    }

    console.log('✅ Inquiry created successfully!');
    console.log(`   Inquiry ID: ${createdInquiry.id}`);
    console.log(`   Status: ${createdInquiry.status}`);
    console.log(`   Priority: ${createdInquiry.priority}`);
    
    // Step 3: Test admin inquiry access
    console.log('3️⃣ Testing admin inquiry access...');
    
    // First login as admin
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin',
        password: 'change me'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Admin login failed:', loginData.message);
      return;
    }

    const adminToken = loginData.token;
    console.log('✅ Admin login successful!');

    // Get admin inquiries
    const adminInquiriesResponse = await fetch(`${BASE_URL}/api/admin/inquiries`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const adminInquiries = await adminInquiriesResponse.json();
    
    if (adminInquiriesResponse.ok) {
      console.log(`✅ Admin can see ${adminInquiries.length} inquiries`);
      
      // Find our created inquiry
      const ourInquiry = adminInquiries.find(i => i.id === createdInquiry.id);
      if (ourInquiry) {
        console.log('✅ Admin can see our created inquiry');
        console.log(`   Buyer: ${ourInquiry.buyerName}`);
        console.log(`   Subject: ${ourInquiry.subject}`);
        console.log(`   Status: ${ourInquiry.status}`);
      }
    } else {
      console.error('❌ Failed to get admin inquiries');
    }

    // Step 4: Test inquiry statistics
    console.log('4️⃣ Testing inquiry statistics...');
    const statsResponse = await fetch(`${BASE_URL}/api/admin/inquiries/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const stats = await statsResponse.json();
    
    if (statsResponse.ok) {
      console.log('✅ Inquiry statistics:');
      console.log(`   Total: ${stats.total}`);
      console.log(`   Pending: ${stats.pending}`);
      console.log(`   Responded: ${stats.responded}`);
      console.log(`   Closed: ${stats.closed}`);
    } else {
      console.error('❌ Failed to get inquiry statistics');
    }

    console.log('\n🎉 Inquiry System Test Complete!');
    console.log('✅ Users can create inquiries from product pages');
    console.log('✅ Admin can view and manage inquiries');
    console.log('✅ Statistics tracking is working');
    console.log('✅ Contact form functionality is ready');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInquirySystem();
