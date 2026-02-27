import { storage } from "../server/storage-factory";

async function runWipe() {
    console.log("Starting database wipe of products and categories via active storage...");

    try {
        const products = await storage.getAllProducts();
        console.log(`Found ${products.length} products to delete...`);

        // Delete all products using storage method
        for (const p of products) {
            await storage.deleteProduct(p.id);
        }
        console.log("Products deleted.");

        // Wipe category structure
        console.log("Resetting category structure...");
        const emptyStructure = JSON.stringify({});
        await storage.updateSiteContent("category_structure", emptyStructure);

        console.log("Category structure reset.");
        console.log("Database wipe completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error wiping database:", error);
        process.exit(1);
    }
}

runWipe();
