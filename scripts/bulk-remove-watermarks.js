import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { Jimp } from 'jimp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_PATH = path.resolve(__dirname, '../server/data/storage.json');
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Reuse the cleaning logic
async function cleanImage(image) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    image.scan(0, 0, width, height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        // Light blue / Greyish blue range for Otto Chemical watermark
        const isBluish = (b > r + 10 && b > g + 5);
        const isLight = (r > 150 && g > 150 && b > 150);
        const isGreyishLight = (r > 180 && g > 180 && b > 180 && Math.abs(r - g) < 20 && Math.abs(r - b) < 20);

        // Target: Otto Chemical light blue
        const isSpecificWatermark = (r >= 160 && r <= 220 && g >= 180 && g <= 230 && b >= 200 && b <= 255);

        if ((isBluish && isLight) || isGreyishLight || isSpecificWatermark) {
            // Check if it's NOT a line (usually black/dark)
            const isDark = (r < 100 && g < 100 && b < 100);
            if (!isDark) {
                this.bitmap.data[idx + 0] = 255;
                this.bitmap.data[idx + 1] = 255;
                this.bitmap.data[idx + 2] = 255;
            }
        }
    });
    return image;
}

async function processProduct(p) {
    if (!p.images || p.images.length === 0) return null;

    const originalUrl = p.images[0];
    if (originalUrl.startsWith('/uploads/')) {
        // console.log(`Skipping ${p.sku} (already local)`);
        return originalUrl;
    }
    if (!originalUrl.startsWith('http')) return null; // Already local

    // Create a safe filename from SKU
    const safeSku = p.sku.replace(/[^a-z0-9]/gi, '_');
    const extMatch = originalUrl.match(/\.(png|jpg|jpeg|webp|gif)($|\?)/i);
    const ext = extMatch ? extMatch[1] : 'png';
    const filename = `${safeSku}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    try {
        console.log(`Downloading ${p.name} (${p.sku})...`);
        const response = await axios({
            url: originalUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log(`Cleaning ${filename} and saving to ${filePath}...`);
        const image = await Jimp.read(response.data);
        await cleanImage(image);
        await image.write(filePath);
        console.log(`Successfully saved ${filePath}`);

        return `/uploads/${filename}`;
    } catch (err) {
        console.error(`Failed to process ${p.sku}: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log(`Reading storage from: ${STORAGE_PATH}`);
    const rawData = fs.readFileSync(STORAGE_PATH, 'utf8');
    const data = JSON.parse(rawData);
    const products = data.products;
    let updatedCount = 0;
    let errorCount = 0;

    // Full run
    const productsToProcess = products;

    console.log(`Starting full process for ${productsToProcess.length} products...`);

    const BATCH_SIZE = 20;
    for (let i = 0; i < productsToProcess.length; i += BATCH_SIZE) {
        const batch = productsToProcess.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (entry) => {
            const [id, p] = entry;
            try {
                const localPath = await processProduct(p);
                if (localPath) {
                    p.images = [localPath];
                    updatedCount++;
                }
            } catch (e) {
                console.error(`Error processing ${p.sku}:`, e.message);
                errorCount++;
            }
        });

        await Promise.all(promises);
        console.log(`Progress: ${Math.min(i + BATCH_SIZE, productsToProcess.length)}/${productsToProcess.length} processed. Updated: ${updatedCount}, Errors: ${errorCount}`);

        fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
    }

    console.log(`Trial complete. Updated: ${updatedCount}, Errors: ${errorCount}`);
}

run().catch(err => {
    console.error("Critical error:", err);
    process.exit(1);
});
