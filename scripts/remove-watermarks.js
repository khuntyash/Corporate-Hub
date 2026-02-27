import { Jimp } from "jimp";
import path from "path";
import fs from "fs";

// Configuration for colors to remove
// The watermark is a light blue color. 
// We want to target colors that are "bluish" and replace them with white.
async function processImage(inputPath, outputPath) {
    try {
        const image = await Jimp.read(inputPath);

        const width = image.bitmap.width;
        const height = image.bitmap.height;

        // Scan the image for pixels that match the watermark color profile
        image.scan(0, 0, width, height, function (x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            const alpha = this.bitmap.data[idx + 3];

            // Targeting light blue/cyan/grey colors that look like the watermark
            // The background is white (255, 255, 255)
            // The watermark is roughly (170, 200, 230) or similar
            // Also catching greyish tones that are light

            const isBluish = (blue > red + 10) && (blue > green + 5);
            const isLight = (red > 150 && green > 150 && blue > 180); // Keep original isLight for combination
            const isGreyishLight = (red > 180 && green > 180 && blue > 180);
            const isSpecificWatermark = (red > 150 && green > 180 && blue > 200);

            if ((isBluish && isLight) || isGreyishLight || isSpecificWatermark) {
                // Replace with white
                this.bitmap.data[idx + 0] = 255;
                this.bitmap.data[idx + 1] = 255;
                this.bitmap.data[idx + 2] = 255;
            }
        });

        await image.write(outputPath);
        console.log(`Processed: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
    } catch (err) {
        console.error(`Error processing ${inputPath}:`, err);
    }
}

// Batch process all images in the uploads folder
const uploadsDir = path.join(process.cwd(), "uploads");

async function runBatch() {
    try {
        const files = fs.readdirSync(uploadsDir);
        console.log(`Found ${files.length} files in uploads directory.`);

        for (const file of files) {
            // Process only common image formats
            const ext = path.extname(file).toLowerCase();
            if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
                // Skip previously generated dry run files
                if (file.startsWith("DRY_RUN_")) continue;

                const inputPath = path.join(uploadsDir, file);
                // Overwrite the original file
                const outputPath = inputPath;

                console.log(`Processing ${file}...`);
                await processImage(inputPath, outputPath);
            }
        }
        console.log("Batch processing complete.");
    } catch (err) {
        console.error("Batch processing failed:", err);
    }
}

runBatch();
