import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'server', 'data', 'storage.json');
const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));

const glutamines = data.products.filter(([id, p]) => p.name.includes("Glutamine"));
glutamines.forEach(([id, p]) => {
    console.log(`Product: ${p.name}`);
    console.log(`Images: ${JSON.stringify(p.images)}`);
});
