import fs from 'fs';
import path from 'path';

const storagePath = path.resolve('c:/Users/yash/Downloads/Corporate-Hub/Corporate-Hub/server/data/storage.json');

try {
    console.log(`Reading storage from ${storagePath}...`);
    const rawData = fs.readFileSync(storagePath, 'utf8');
    const data = JSON.parse(rawData);

    console.log('Top-level keys found:', Object.keys(data));
    console.log('Type of companies key:', typeof data.companies);
    if (data.companies) console.log('Is companies an array?', Array.isArray(data.companies));

    if (!data.companies || !Array.isArray(data.companies)) {
        console.error('Available keys:', Object.keys(data));
        throw new Error('Invalid storage.json format: companies array missing or not an array');
    }

    const initialCount = data.companies.length;
    console.log(`Found ${initialCount} companies.`);

    // Remove company with ID 65e1f848-2ff9-4e30-acdd-8d9ecf75c8f0 (onfsn)
    data.companies = data.companies.filter(([id]: [string, any]) => {
        if (id === '65e1f848-2ff9-4e30-acdd-8d9ecf75c8f0') {
            console.log('Found target company ID.');
            return false;
        }
        return true;
    });

    const finalCount = data.companies.length;

    if (initialCount !== finalCount) {
        fs.writeFileSync(storagePath, JSON.stringify(data, null, 2));
        console.log(`Successfully removed ${initialCount - finalCount} gibberish company record(s).`);
    } else {
        console.log('No matching gibberish company found by ID.');
    }
} catch (error: any) {
    console.error('Error processing storage.json:', error.message || error);
    if (error.stack) console.error(error.stack);
    process.exit(1);
}
