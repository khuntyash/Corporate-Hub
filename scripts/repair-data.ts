
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "server", "data", "storage.json");

function repairData() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error("Data file not found:", DATA_FILE);
        return;
    }

    try {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const data = JSON.parse(raw);

        // 1. Find the Admin Company ID
        const companies = data.companies || [];
        let adminCompanyEntry = companies.find((entry: any) => {
            const company = entry[1];
            return company.name === "Dual Life Chemicals" || company.name === "Corporate Hub Admin";
        });

        if (!adminCompanyEntry && companies.length > 0) {
            console.log("Specific admin company not found, using first available company.");
            adminCompanyEntry = companies[0];
        }

        if (!adminCompanyEntry) {
            console.error("No companies found! Cannot repair.");
            return;
        }

        const adminCompanyId = adminCompanyEntry[0];
        console.log("Found Admin Company ID:", adminCompanyId);

        // 2. Fix Products with null sellerCompanyId
        let fixedCount = 0;
        const products = data.products || [];

        products.forEach((entry: any) => {
            const product = entry[1];
            if (!product.sellerCompanyId) {
                console.log(`Fixing product: ${product.name} (${product.id})`);
                product.sellerCompanyId = adminCompanyId;
                fixedCount++;
            }
        });

        if (fixedCount > 0) {
            // 3. Save back to file
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
            console.log(`Successfully repaired ${fixedCount} products.`);
        } else {
            console.log("No products needed repair.");
        }

    } catch (error) {
        console.error("Error repairing data:", error);
    }
}

repairData();
