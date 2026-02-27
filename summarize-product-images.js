import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'server', 'data', 'storage.json');
const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));

let externalCount = 0;
let localCount = 0;
let noImageCount = 0;

data.products.forEach(([id, product]) => {
    const images = product.images || [];
    if (images.length === 0) {
        noImageCount++;
    } else if (images.some(img => img.startsWith('http'))) {
        externalCount++;
    } else if (images.some(img => img.startsWith('/uploads/'))) {
        localCount++;
    }
});

console.log(`Total Products: ${data.products.length}`);
console.log(`External Images: ${externalCount}`);
console.log(`Local Images: ${localCount}`);
console.log(`No images: ${noImageCount}`);
