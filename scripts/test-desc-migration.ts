import { storage } from "../server/storage-factory";
import axios from 'axios';
import * as cheerio from 'cheerio';

const OTTOKEMI_BASE = "https://www.ottokemi.com";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const autoSubscript = (text: string) => {
    return text.replace(/([A-Z][a-z]?|\))(\d+)(?![.\d])/g, '$1<sub>$2</sub>');
};

const cleanHtml = (html: string) => {
    let cleaned = html.replace(/<sub[^>]*>/gi, '<sub>')
        .replace(/<\/sub>/gi, '</sub>')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<(?!sub|\/sub)[^>]*>/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return autoSubscript(cleaned);
};

async function testIngest(url: string) {
    console.log('Fetching:', url);
    const r = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    const $ = cheerio.load(r.data);

    const name = $('h1').first().text().trim();
    let code = '';
    $('h6, h5, small, .product-code, span').each((_, el) => {
        const txt = $(el).text().trim();
        if (!code && /^Code:\s*[A-Z]\s*\d+/i.test(txt)) {
            code = txt.replace(/^Code:\s*/i, '').trim();
        }
    });

    if (!code) throw new Error("Could not find product code");

    let cas = '';
    let molFormula = '';
    let molWeight = '';
    let hsnCode = '';
    const specifications: Record<string, string> = {};
    const seenLabels = new Set<string>();

    $('div.row').each((_, row) => {
        const label = $(row).find('label, .col-4, .col-5, [class*="col-4"], [class*="col-5"]').first().text().trim().replace(/:$/, '');
        const valueEl = $(row).find('div.col-8, div.col-7, [class*="col-8"], [class*="col-7"]').first();
        const valueText = cleanHtml(valueEl.html() || '').trim();

        if (!label || !valueText || seenLabels.has(label)) return;
        seenLabels.add(label);

        const lc = label.toLowerCase();
        if (lc === 'cas' || lc.includes('cas number')) cas = valueText;
        else if (lc.includes('mol') && lc.includes('formula')) molFormula = valueText;
        else if (lc.includes('mol') && lc.includes('weight')) molWeight = valueText;
        else if (lc === 'hsn code' || lc === 'hsn') hsnCode = valueText;
        else if (lc !== 'gst tax rate' && lc !== 'categories' && lc !== 'product code' && valueText.length < 500) {
            specifications[label] = valueText;
        }
    });

    let description = '';
    let application = '';
    $('h5').each((_, el) => {
        const header = $(el).text().trim().toUpperCase();
        if (header === 'DESCRIPTION' || header === 'DESCRIPTION:') {
            description = cleanHtml($(el).next().html() || '');
        } else if (header === 'APPLICATION' || header === 'APPLICATION:') {
            application = cleanHtml($(el).next().html() || '');
        }
    });

    if (application) {
        description = (description ? description + '\n\n' : '') + 'APPLICATION:\n' + application;
    }

    console.log('--- EXTRACTED DATA ---');
    console.log('Name:', name);
    console.log('SKU:', code);
    console.log('CAS:', cas);
    console.log('Description:', description);
    console.log('Specs Keys:', Object.keys(specifications));
    console.log('Specifications Example Table:', specifications);

    const existing = await storage.getProductBySku(code);
    if (existing) {
        await storage.updateProduct(existing.id, {
            description,
            casNumber: cas,
            molFormula,
            molWeight,
            hsnCode,
            productPackings: existing.productPackings, // Keep existing
            images: existing.images, // Keep existing
            price: existing.price, // Keep existing
            technicalSpecs: specifications
        });
        console.log('SUCCESS: Updated existing product');
    } else {
        console.log('ERROR: Product not found in DB, run full migration first');
    }
}

testIngest('https://www.ottokemi.com/arginine/l-arginine-99.aspx')
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
