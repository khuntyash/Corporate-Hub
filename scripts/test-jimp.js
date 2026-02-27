import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
    try {
        const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const image = await Jimp.read(base64Image);
        console.log("Image loaded, dimensions:", image.bitmap.width, "x", image.bitmap.height);

        const testPath = path.resolve(__dirname, 'test-output.png');
        console.log("Attempting to write to:", testPath);

        // Try write
        if (typeof image.write === 'function') {
            await image.write(testPath);
            console.log("Success with image.write!");
        } else {
            console.log("image.write is NOT a function");
            console.log("Available methods:", Object.keys(image).filter(k => typeof image[k] === 'function'));
            console.log("Prototype methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(image)).filter(k => typeof image[k] === 'function'));
        }
    } catch (e) {
        console.error("Error in Jimp test:", e);
    }
}
test();
