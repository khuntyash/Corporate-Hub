process.env.NODE_ENV = "production";
import "dotenv/config";

import { db } from "../server/db";
import { products, companies } from "../shared/schema";
import { eq, isNull } from "drizzle-orm";

async function inspect() {
    try {
        console.log("Checking for products with missing sellerCompanyId...");
        const missingSellerProducts = await db.select().from(products).where(isNull(products.sellerCompanyId));
        console.log(`Found ${missingSellerProducts.length} products with missing sellerCompanyId.`);

        if (missingSellerProducts.length > 0) {
            console.log("Sample products:", missingSellerProducts.slice(0, 5).map(p => p.name));
        }

        console.log("\nChecking companies...");
        const allCompanies = await db.select().from(companies);
        console.log(`Found ${allCompanies.length} companies.`);
        allCompanies.forEach(c => console.log(`- ${c.name} (${c.id})`));

    } catch (error) {
        console.error("Inspection failed:", error);
    } finally {
        process.exit();
    }
}

inspect();
