import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'server', 'data', 'storage.json');
const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));

console.log("Products with local images:");
data.products.forEach(([id, product]) => {
    const images = product.images || [];
    const hasLocal = images.some(img => img.startsWith('/uploads/'));
    if (hasLocal) {
        console.log(`- ${product.name} (${product.sku}): ${JSON.stringify(images)}`);
    }
});
