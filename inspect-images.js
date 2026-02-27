import { storage } from "./server/storage-factory.js";

async function inspectImages() {
    try {
        const products = await storage.getAllProducts();
        console.log(`Checking ${products.length} products...`);

        products.slice(0, 5).forEach(p => {
            console.log(`Product: ${p.name}`);
            console.log(`Images: ${JSON.stringify(p.images)}`);
            console.log('---');
        });
    } catch (err) {
        console.error("Error:", err);
    }
}

inspectImages();
