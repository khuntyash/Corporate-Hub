import fetch from 'node-fetch';

async function checkProducts() {
  try {
    const response = await fetch('http://localhost:5000/api/products');
    const products = await response.json();
    
    console.log('📦 All Products in System:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Seller: ${product.seller?.name || 'Unknown'}`);
      console.log(`   Price: ${product.price}`);
      console.log(`   Stock: ${product.stockQuantity}`);
      console.log('');
    });
    
    console.log(`📊 Total Products: ${products.length}`);
    
    // Look for your products specifically
    const yourProducts = products.filter(p => 
      p.seller?.name?.includes('New Company') || 
      p.name.toLowerCase().includes('test')
    );
    
    console.log(`🎯 Your Products Found: ${yourProducts.length}`);
    yourProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (ID: ${product.id})`);
    });
    
    // Check categories
    const categories = [...new Set(products.map(p => p.category))];
    console.log(`🏷️ Categories Available: ${categories.join(', ')}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProducts();
