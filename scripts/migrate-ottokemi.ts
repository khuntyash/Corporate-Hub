import { demoStorage as storage } from "../server/demo-storage";
import axios from 'axios';
import * as cheerio from 'cheerio';

const OTTOKEMI_BASE = "https://www.ottokemi.com";
const DELAY_MS = 400;

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

const get = async (url: string) => {
    await sleep(DELAY_MS);
    const r = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        timeout: 15000
    });
    return r.data as string;
};

const toAbs = (href: string) =>
    href.startsWith('http') ? href : OTTOKEMI_BASE + (href.startsWith('/') ? '' : '/') + href;

async function ingestProduct(url: string, category: string, subCategory: string, seen: Set<string>) {
    if (seen.has(url)) return;
    seen.add(url);

    try {
        const html = await get(url);
        const $ = cheerio.load(html);

        // ── Name ──────────────────────────────────────────────
        const name = $('h1').first().text().trim();
        if (!name) return;

        // ── Code: look for "Code: X 0000" in h6/h5/small/span ──
        let code = '';
        $('h6, h5, small, .product-code, span').each((_, el) => {
            const txt = $(el).text().trim();
            if (!code && /^Code:\s*[A-Z]\s*\d+/i.test(txt)) {
                code = txt.replace(/^Code:\s*/i, '').trim();
            }
        });
        if (!code) return; // Not a real product page

        // ── Chemical structure IMAGE ──────────────────────────
        let imageUrl = '';
        $('img').each((_, el) => {
            const src = $(el).attr('src') || '';
            if (!imageUrl && src.includes('structures.ashx')) {
                imageUrl = src.startsWith('http') ? src : OTTOKEMI_BASE + '/' + src.replace(/^\.\.\//, '');
            }
        });
        if (!imageUrl) {
            // Construct from code as fallback
            imageUrl = `${OTTOKEMI_BASE}/product/structures.ashx?imagepath=products/structure/${encodeURIComponent(code)}.png`;
        }

        // ── CAS: link text matching CAS pattern ───────────────
        let cas = '';
        $('a').each((_, el) => {
            const href = $(el).attr('href') || '';
            const txt = $(el).text().trim();
            if (!cas && href.includes('search=') && /^\d+-\d+-\d+$/.test(txt)) {
                cas = txt;
            }
        });

        // ── Synonyms ──────────────────────────────────────────
        let synonyms = '';
        // Look for a paragraph or div containing "Synonyms:" right below the code
        $('p, span, div').each((_, el) => {
            const txt = $(el).text().trim();
            if (!synonyms && txt.startsWith('Synonyms:') && $(el).children().length < 3) {
                synonyms = txt.replace(/^Synonyms:\s*/i, '').trim();
            }
        });

        // ── Properties grid: col-4 (label) + col-8 (value) ───
        let molFormula = '';
        let molWeight = '';
        let hsnCode = '';
        let grade = '';
        let purity = '';
        let packingType = 'Vial / Bottle';
        const properties: Record<string, string> = {};
        const seenLabels = new Set<string>();

        // The properties are in rows with label-value columns (usually col-4/col-8 or col-5/col-7)
        // But they're duplicated in the page (desktop + mobile). Use first occurrence only.
        $('div.row').each((_, row) => {
            const label = $(row).find('label, .col-4, .col-5, [class*="col-4"], [class*="col-5"]').first().text().trim().replace(/:$/, '');
            const valueEl = $(row).find('div.col-8, div.col-7, [class*="col-8"], [class*="col-7"]').first();
            const valueHtml = valueEl.html() || '';
            const valueText = cleanHtml(valueHtml).trim();

            if (!label || !valueText || seenLabels.has(label)) return;

            const lc = label.toLowerCase();
            seenLabels.add(label);

            if (lc === 'cas' || lc.includes('cas number')) {
                if (!cas) cas = valueText;
            } else if (lc.includes('mol') && lc.includes('formula')) {
                molFormula = valueText;
            } else if (lc.includes('mol') && lc.includes('weight')) {
                molWeight = valueText;
            } else if (lc === 'hsn code' || lc === 'hsn') {
                hsnCode = valueText;
            } else if (lc === 'grade') {
                grade = valueText;
            } else if (lc === 'purity' || lc === 'assay') {
                purity = valueText;
                properties[label] = valueText;
            } else if (lc === 'packing') {
                packingType = valueText || packingType;
            } else if (lc !== 'gst tax rate' && lc !== 'categories' && lc !== 'product code' && valueText.length < 500) {
                properties[label] = valueText;
            }
        });

        // ── Description & Application ──────────────────────────
        let description = '';
        let application = '';
        $('h5').each((_, el) => {
            const header = $(el).text().trim().toUpperCase();
            if (header === 'DESCRIPTION' || header === 'DESCRIPTION:') {
                const next = $(el).next();
                const descHtml = next.html() || next.text() || '';
                if (descHtml) description = cleanHtml(descHtml);
            } else if (header === 'APPLICATION' || header === 'APPLICATION:') {
                const next = $(el).next();
                const appHtml = next.html() || next.text() || '';
                if (appHtml) application = cleanHtml(appHtml);
            }
        });

        if (application) {
            description = (description ? description + '\n\n' : '') + 'APPLICATION:\n' + application;
        }

        // ── Packings: class="pro_cost", take first table (INR), skip header row ─
        const packings: { size: string, price: string }[] = [];
        const firstPackingTable = $('table.pro_cost').first();
        if (firstPackingTable.length) {
            firstPackingTable.find('tr').each((_, el) => {
                const cells = $(el).find('td');
                if (cells.length >= 2) {
                    const size = $(cells[0]).text().trim();
                    const priceRaw = $(cells[1]).text().trim().replace(/Rs\.\s*/i, '').trim();
                    // Skip header row, skip empty, skip pure numbers (IDs)
                    if (size && priceRaw && size.length < 50 &&
                        size.toLowerCase() !== 'packings' &&
                        !/^\d+$/.test(size)) {
                        packings.push({ size, price: priceRaw });
                    }
                }
            });
        }

        const defaultPrice = packings.find(p => p.price !== 'POR')?.price || '0';

        console.log(`    ✔ ${name} [${code}] | CAS:${cas || '-'} | Formula:${molFormula || '-'} | Wt:${molWeight || '-'}`);

        // ── UPSERT: Check if exists by SKU ─────────────────────
        const existing = await storage.getProductBySku(code);
        const productData = {
            name,
            sku: code,
            category,
            subCategory,
            casNumber: cas,
            price: defaultPrice,
            stockQuantity: 100,
            productPackings: packings.length ? packings : [{ size: 'Custom size', price: 'POR' }],
            description,
            isActive: true,
            packingType,
            gstTaxRate: '18%',
            images: [imageUrl],
            minStockLevel: 0,
            properties: JSON.stringify(properties),
            synonyms,
            molFormula,
            molWeight,
            hsnCode,
            cost: '0',
        };

        if (existing) {
            await storage.updateProduct(existing.id, productData);
            console.log(`    ↻ Updated: ${name} [${code}]`);
        } else {
            await storage.createProduct(productData);
            console.log(`    + Created: ${name} [${code}]`);
        }

    } catch (e) {
        console.error(`    ✗ ${url}: ${(e as Error).message}`);
    }
}

async function crawlLeaf(leafUrl: string, catName: string, subCatName: string, seen: Set<string>) {
    try {
        const html = await get(leafUrl);
        const $ = cheerio.load(html);
        const productUrls: string[] = [];

        $('a[href*=".aspx"]').each((_, el) => {
            const href = $(el).attr('href') || '';
            if (
                href.match(/\.aspx$/i) &&
                !href.includes('/subcategory/') &&
                !href.includes('/research-lab-chemicals/') &&
                !href.includes('/research-laboratory-chemicals/') &&
                !href.includes('/product/') &&
                !href.includes('/offers/') &&
                !href.includes('/sitemap') &&
                !href.includes('/about') &&
                !href.includes('/contact') &&
                !href.includes('/download') &&
                !href.includes('/blog') &&
                !href.includes('/resources') &&
                !href.includes('/industries') &&
                !href.includes('/clients') &&
                !href.includes('/category/') &&
                !href.includes('/specsheet') &&
                !href.includes('/documents')
            ) {
                const full = toAbs(href);
                if (!productUrls.includes(full)) productUrls.push(full);
            }
        });

        console.log(`  [${subCatName}] ${productUrls.length} products`);
        for (const pUrl of productUrls) {
            await ingestProduct(pUrl, catName, subCatName, seen);
        }
    } catch (e) {
        console.error(`  ✗ Leaf ${leafUrl}: ${(e as Error).message}`);
    }
}

async function crawlCategory(catName: string, catUrl: string, seen: Set<string>) {
    console.log(`\n📂 ${catName}`);
    const fullUrl = toAbs(catUrl);

    try {
        const html = await get(fullUrl);
        const $ = cheerio.load(html);
        const leafUrls: string[] = [];

        $('a[href*="research-lab-chemicals"]').each((_, el) => {
            const href = $(el).attr('href') || '';
            if (href.match(/\.aspx$/i)) {
                const full = toAbs(href);
                if (!leafUrls.includes(full)) leafUrls.push(full);
            }
        });

        if (leafUrls.length === 0) {
            await crawlLeaf(fullUrl, catName, "General", seen);
        } else {
            for (const leafUrl of leafUrls) {
                const subCatName = decodeURIComponent(leafUrl.replace(/.*\/([^/]+)\.aspx$/i, '$1').replace(/-/g, ' '));
                await crawlLeaf(leafUrl, catName, subCatName, seen);
            }
        }
    } catch (e) {
        console.error(`✗ Category ${catName}: ${(e as Error).message}`);
    }
}

async function runMigration() {
    console.log("🚀 Full Ottokemi Migration — High-Fidelity v2");

    const categories = [
        { name: "Amino acids", url: "/subcategory/amino-acid.aspx" },
        { name: "Analytical reagents", url: "/subcategory/analytical-reagents.aspx" },
        { name: "Antibiotics", url: "/research-laboratory-chemicals/antibioticsantibiotics.aspx" },
        { name: "Biological buffers", url: "/subcategory/biological-buffers.aspx" },
        { name: "Biological stains", url: "/subcategory/biological-stains.aspx" },
        { name: "Essential chemicals", url: "/subcategory/essential-chemicals.aspx" },
        { name: "Indicators", url: "/subcategory/indicators.aspx" },
        { name: "Inorganic chemicals", url: "/subcategory/inorganic-chemicalsindia.aspx" },
        { name: "Organic acids", url: "/research-laboratory-chemicals/organic-acids.aspx" },
        { name: "Solvents", url: "/subcategory/solvents1.aspx" },
        { name: "Vitamins", url: "/research-laboratory-chemicals/vitamins.aspx" },
        { name: "Metallic salts", url: "/subcategory/metallic-salts.aspx" },
        { name: "Protein chromatography", url: "/research-laboratory-chemicals/protein-chromatography.aspx" },
        { name: "pH Indicators", url: "/research-laboratory-chemicals/ph-indicators-solids.aspx" },
        { name: "Biochemicals & reagents", url: "/subcategory/biochemicals-and-reagents.aspx" },
        { name: "Laboratory chemicals", url: "/subcategory/laboratory-chemicals.aspx" },
        { name: "Carbonyl compounds", url: "/subcategory/carbonyl-compounds.aspx" },
        { name: "Nitrogen compounds", url: "/subcategory/nitrogen-compounds.aspx" },
        { name: "Oxygen compounds", url: "/subcategory/oxygen-compounds.aspx" },
    ];

    const struct: Record<string, string[]> = {};
    categories.forEach(c => struct[c.name] = ["General"]);
    await storage.updateSiteContent("category_structure", JSON.stringify(struct));

    const seen = new Set<string>();
    for (const cat of categories) {
        await crawlCategory(cat.name, cat.url, seen);
    }

    const allProducts = await storage.getAllProducts();
    console.log(`\n✅ Done! Total products: ${allProducts.length}`);
    process.exit(0);
}

runMigration().catch(e => {
    console.error("Fatal:", e);
    process.exit(1);
});
