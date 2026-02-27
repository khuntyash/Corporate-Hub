const fs = require('fs');
const path = require('path');

const storagePath = path.join(__dirname, '..', 'server', 'data', 'storage.json');

if (!fs.existsSync(storagePath)) {
    console.log('Storage file not found at:', storagePath);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));

if (data.products && Array.from(data.products).length > 0) {
    console.log('Migrating', data.products.length, 'products...');
    data.products = data.products.map(entry => {
        // Entry is [uuid, productData]
        const product = entry[1];
        if (product.specifications !== undefined) {
            product.properties = product.specifications;
            delete product.specifications;
        }
        return entry;
    });

    fs.writeFileSync(storagePath, JSON.stringify(data, null, 2));
    console.log('Migration complete!');
} else {
    console.log('No products found to migrate.');
}
