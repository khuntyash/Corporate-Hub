/**
 * fix-product-images.cjs
 *
 * Replaces watermarked Ottokemi product images with clean, watermark-free
 * images from the NCI Cactus Chemical Structure API.
 *
 * For products WITH a CAS number:
 *   → https://cactus.nci.nih.gov/chemical/structure/{CAS}/image
 * For products WITHOUT a CAS number:
 *   → keeps the existing image or clears it to show a placeholder
 *
 * Usage: node scripts/fix-product-images.cjs
 */

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../server/data/storage.json");
const CACTUS_BASE = "https://cactus.nci.nih.gov/chemical/structure";

function buildCleanImageUrl(casNumber) {
    if (!casNumber || !casNumber.trim()) return null;

    // Validate CAS format: digits-digits-digit(s)
    const casPattern = /^\d{2,7}-\d{2}-\d$/;
    if (!casPattern.test(casNumber.trim())) return null;

    return `${CACTUS_BASE}/${encodeURIComponent(casNumber.trim())}/image`;
}

function run() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error("Error: storage.json not found at", DATA_FILE);
        process.exit(1);
    }

    console.log("Loading storage.json...");
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    let data;
    try {
        data = JSON.parse(raw);
    } catch (e) {
        console.error("Error parsing storage.json:", e.message);
        process.exit(1);
    }

    const products = data.products || [];
    console.log(`Found ${products.length} product entries.\n`);

    let updated = 0;
    let skipped = 0;
    let cleared = 0;

    for (const entry of products) {
        // Each entry is [key, productObject]
        const product = entry[1];
        const casNumber = product.casNumber || "";
        const newImageUrl = buildCleanImageUrl(casNumber);

        if (newImageUrl) {
            product.images = [newImageUrl];
            updated++;
        } else {
            // No valid CAS — clear the watermarked image so a placeholder shows instead
            if (product.images && product.images.length > 0 && product.images[0].includes("ottokemi")) {
                product.images = [];
                cleared++;
            } else {
                skipped++;
            }
        }
    }

    console.log(`✔ Updated images: ${updated}`);
    console.log(`✔ Cleared watermarked images (no CAS): ${cleared}`);
    console.log(`- Skipped (already clean or no image): ${skipped}`);
    console.log("\nSaving updated storage.json...");

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    console.log("Done! Restart the dev server to see the changes.");
}

run();
