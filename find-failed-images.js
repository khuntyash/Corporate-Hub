import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'server', 'data', 'storage.json');
const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));

console.log("Failed products (still external):");
data.products.forEach(([id, product]) => {
    const images = product.images || [];
    if (images.some(img => img.startsWith('http'))) {
        console.log(`- ${product.name} (${product.sku}): ${images[0]}`);
    }
});
