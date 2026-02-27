import { storage } from '../server/storage-factory';

async function test() {
    const r1 = await storage.searchProducts('74-79-3');
    console.log('CAS Search (74-79-3):', r1.length, 'results', r1[0] ? `- First: ${r1[0].name}` : '');

    const r2 = await storage.searchProducts('A 2585');
    console.log('SKU Search (A 2585):', r2.length, 'results', r2[0] ? `- First: ${r2[0].name}` : '');

    const r3 = await storage.searchProducts('Arginine');
    console.log('Name Search (Arginine):', r3.length, 'results', r3[0] ? `- First: ${r3[0].name}` : '');
}

test().catch(console.error);
