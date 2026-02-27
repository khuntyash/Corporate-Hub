import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_PATH = path.resolve(__dirname, '../server/data/storage.json');

console.log("Checking storage path:", STORAGE_PATH);
try {
    const exists = fs.existsSync(STORAGE_PATH);
    console.log("Storage exists:", exists);
    if (exists) {
        const data = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
        console.log("Product count:", data.products.length);
        console.log("First product sample:", JSON.stringify(data.products[0][1], null, 2).substring(0, 200));
    }
} catch (err) {
    console.error("Error in test script:", err);
}
