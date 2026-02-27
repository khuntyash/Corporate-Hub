process.env.NODE_ENV = "production";
import "dotenv/config";

import { db } from "../server/db";
import { products, companies } from "../shared/schema";
import { eq, isNull } from "drizzle-orm";

async function repair() {
    try {
        console.log("Finding target company...");
        let [targetCompany] = await db.select().from(companies).where(eq(companies.name, "Dual Life Chemicals"));

        if (!targetCompany) {
            console.log("Company 'Dual Life Chemicals' not found, falling back to first available company.");
            [targetCompany] = await db.select().from(companies).limit(1);
        }

        if (!targetCompany) {
            console.error("No companies found in database! Please create one first.");
            return;
        }

        console.log(`Using company: ${targetCompany.name} (${targetCompany.id})`);

        console.log("Updating products with missing sellerCompanyId...");
        const result = await db.update(products)
            .set({ sellerCompanyId: targetCompany.id })
            .where(isNull(products.sellerCompanyId));

        console.log(`Successfully updated ${result.rowCount} products.`);

    } catch (error) {
        console.error("Repair failed:", error);
    } finally {
        process.exit();
    }
}

repair();
