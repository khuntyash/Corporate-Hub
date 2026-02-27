import "dotenv/config";
import fs from "fs";
import path from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../shared/schema.js";

async function main() {
    console.log("Starting production seeding...");

    if (!process.env.DATABASE_URL) {
        console.error("Critical: Cannot seed without DATABASE_URL in environment variables!");
        process.exit(1);
    }

    // Connect to DB directly via Postgres library connection pool
    const client = postgres(process.env.DATABASE_URL, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
    });

    const db = drizzle(client, { schema });

    // Read data from local JSON storage
    let storageData: any;
    try {
        const dataPath = path.resolve(process.cwd(), "server", "data", "storage.json");
        if (!fs.existsSync(dataPath)) {
            console.error("Error: Could not locate storage.json at path: " + dataPath);
            process.exit(1);
        }
        const rawData = fs.readFileSync(dataPath, "utf-8");
        storageData = JSON.parse(rawData);
        console.log("Successfully parsed storage.json from disk.");
    } catch (error) {
        console.error("Failed to read storage.json dump:", error);
        process.exit(1);
    }

    // Iterate over extracted storage entries and attempt to seed them
    try {
        // 1. Seed Companies
        const companiesToInsert = storageData.companies.map((entry: any) => entry[1]);
        if (companiesToInsert.length > 0) {
            console.log(`Seeding ${companiesToInsert.length} companies...`);
            for (const comp of companiesToInsert) {
                await db.insert(schema.companies).values({
                    ...comp,
                    createdAt: new Date(comp.createdAt),
                    updatedAt: new Date(comp.updatedAt)
                }).onConflictDoNothing();
            }
        }

        // 2. Seed Users
        const usersToInsert = storageData.users.map((entry: any) => entry[1]);
        if (usersToInsert.length > 0) {
            console.log(`Seeding ${usersToInsert.length} users...`);
            for (const usr of usersToInsert) {
                await db.insert(schema.users).values({
                    ...usr,
                    createdAt: new Date(usr.createdAt),
                    updatedAt: new Date(usr.updatedAt),
                    lastLogin: usr.lastLogin ? new Date(usr.lastLogin) : null
                }).onConflictDoNothing();
            }
        }

        // 3. Seed Products in chunks!
        const productsToInsert = storageData.products.map((entry: any) => entry[1]);
        if (productsToInsert.length > 0) {
            console.log(`\nSeeding ${productsToInsert.length} products in batches of 50...`);
            const CHUNK_SIZE = 50;
            let processed = 0;

            for (let i = 0; i < productsToInsert.length; i += CHUNK_SIZE) {
                const chunk = productsToInsert.slice(i, i + CHUNK_SIZE);

                // Map the chunk precisely to the Drizzle schema constraints
                const mappedChunk = chunk.map((prod: any) => ({
                    ...prod,
                    price: String(prod.price),
                    cost: String(prod.cost),
                    createdAt: new Date(prod.createdAt),
                    updatedAt: new Date(prod.updatedAt)
                }));

                try {
                    await db.insert(schema.products).values(mappedChunk).onConflictDoNothing();
                    processed += chunk.length;
                    console.log(`[+] Uploaded ${processed} / ${productsToInsert.length} products...`);

                    // Artificial delay of 500ms between batches to prevent Render from resetting our local connection!
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (chunkErr) {
                    console.error(`[-] Failed inserting chunk at offset ${i}`, chunkErr);
                }
            }
        }

        console.log("✅ Seed complete! All demo products and data copied into remote Postgres.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Exception during db insertion!", error);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
