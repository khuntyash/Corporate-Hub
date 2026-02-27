/**
 * enrich-from-ottokemi.cjs
 *
 * Fetches missing product data (CAS, mol. formula, mol. weight, structure image)
 * from ottokemi.com for products that are still incomplete after PubChem enrichment.
 *
 * Strategy:
 *  1. Find products in storage.json with missing data
 *  2. Search ottokemi.com by product SKU or cleaned name
 *  3. Scrape the product detail page (same logic as migrate-ottokemi)
 *  4. Fill in only the missing fields, do not overwrite existing good data
 *
 * Usage: node scripts/enrich-from-ottokemi.cjs
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const DATA_FILE = path.join(__dirname, "../server/data/storage.json");
const OTTOKEMI_BASE = "https://www.ottokemi.com";
const DELAY_MS = 500; // polite crawl rate
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

// --- HTTP helper ----------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            headers: { "User-Agent": UA },
            timeout: 20000,
        };
        https.get(options, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                const loc = res.headers.location;
                if (loc) return resolve(httpGet(loc.startsWith("http") ? loc : OTTOKEMI_BASE + loc));
            }
            if (res.statusCode === 404) return resolve(null);
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
            let body = "";
            res.setEncoding("utf8");
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => resolve(body));
        }).on("error", reject).on("timeout", () => reject(new Error("Timeout: " + url)));
    });
}

// --- Minimal HTML parser (no cheerio — uses regex) -----------------------

function extractText(html, pattern) {
    const m = html.match(pattern);
    return m ? m[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim() : null;
}

function extractMeta(html, label) {
    // Matches rows: <label>   <value> in property divs
    const re = new RegExp(`${label}[^<]*</(?:label|div|td)[^>]*>[\\s\\S]{0,200}?<(?:div|td)[^>]*>([^<]{1,200})`, "i");
    const m = html.match(re);
    return m ? m[1].trim() : null;
}

/** Given a product name, find it on ottokemi and return {cas, molFormula, molWeight, imageUrl} */
async function scrapeProductByName(name) {
    // 1. Build search URL — ottokemi uses a search query parameter
    const searchUrl = `${OTTOKEMI_BASE}/search.aspx?search=${encodeURIComponent(name)}`;
    const searchHtml = await httpGet(searchUrl);
    if (!searchHtml) return null;

    // Grab first .aspx product link from results (not subcategory/category)
    const linkRe = /href="([^"]*\.aspx)"/gi;
    let m;
    const productLinks = [];
    while ((m = linkRe.exec(searchHtml)) !== null) {
        const href = m[1];
        if (
            !href.includes("/subcategory/") &&
            !href.includes("/category/") &&
            !href.includes("/research-laboratory-chemicals/") &&
            !href.includes("search.aspx") &&
            !href.includes("/about") &&
            !href.includes("/contact") &&
            !href.includes("/blog") &&
            href.match(/\.aspx$/i)
        ) {
            const full = href.startsWith("http") ? href : OTTOKEMI_BASE + (href.startsWith("/") ? "" : "/") + href;
            if (!productLinks.includes(full)) productLinks.push(full);
        }
    }

    if (!productLinks.length) return null;

    // 2. Scrape the first matching product page
    await sleep(DELAY_MS);
    const productHtml = await httpGet(productLinks[0]);
    if (!productHtml) return null;

    // CAS — look for 10-digit CAS patterns in body
    let cas = null;
    const casMatch = productHtml.match(/\b(\d{2,7}-\d{2}-\d)\b/);
    if (casMatch) cas = casMatch[1];

    // Also try CAS from anchor tags (same approach as migrate-ottokemi.ts)
    const casAnchorRe = /href="[^"]*search=[^"]*"[^>]*>(\d{2,7}-\d{2}-\d)<\/a>/g;
    let am;
    while ((am = casAnchorRe.exec(productHtml)) !== null) {
        cas = am[1];
        break;
    }

    // Molecular formula — look for common pattern
    let molFormula = null;
    const mfMatch = productHtml.match(/Molecular Formula[^<]*<[^>]+>\s*([A-Z][a-zA-Z0-9<>/sub]+)/i);
    if (mfMatch) {
        molFormula = mfMatch[1].replace(/<[^>]+>/g, "").trim();
    }

    // Molecular weight
    let molWeight = null;
    const mwMatch = productHtml.match(/Molecular Weight[^<]*<[^>]+>\s*([\d.,]+)/i);
    if (mwMatch) molWeight = mwMatch[1].trim();

    // Structure image from structures.ashx
    let imageUrl = null;
    const imgMatch = productHtml.match(/src="([^"]*structures\.ashx[^"]*)"/i);
    if (imgMatch) {
        const raw = imgMatch[1];
        imageUrl = raw.startsWith("http") ? raw : OTTOKEMI_BASE + "/" + raw.replace(/^\.\.\//, "");
    }
    // Fallback: construct from code
    if (!imageUrl && cas) {
        imageUrl = `https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(cas)}/image`;
    }

    return { cas, molFormula, molWeight, imageUrl };
}

// --- Main ----------------------------------------------------------------

async function run() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error("storage.json not found:", DATA_FILE);
        process.exit(1);
    }

    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);

    // Products still missing essential info
    const toEnrich = data.products.filter(([, p]) =>
        !p.casNumber ||
        p.casNumber === "N/A" ||
        !p.molFormula ||
        !p.images?.length
    );

    console.log(`\nFound ${toEnrich.length} products to enrich from Ottokemi.\n`);

    let enriched = 0;
    let failed = 0;
    let i = 0;

    for (const entry of toEnrich) {
        const product = entry[1];
        i++;

        // Use clean name for search (strip trailing "99%+", grade info, SKU)
        const cleanName = product.name
            .replace(/,?\s*\d[\d.]*%[^,]*/g, "")     // strip "99%+" etc.
            .replace(/\[.*?\]/g, "")                   // strip "[S 1234]"
            .replace(/\(.*?grade.*?\)/gi, "")          // strip "(reagent grade)"
            .replace(/\s+/g, " ")
            .trim();

        process.stdout.write(`[${i}/${toEnrich.length}] ${cleanName.substring(0, 55).padEnd(55)} → `);

        try {
            await sleep(DELAY_MS);
            const result = await scrapeProductByName(cleanName);

            if (!result || (!result.cas && !result.molFormula && !result.imageUrl)) {
                console.log("❌ Not found");
                failed++;
                continue;
            }

            let changed = false;
            if (result.cas && (!product.casNumber || product.casNumber === "N/A")) {
                product.casNumber = result.cas;
                changed = true;
            }
            if (result.molFormula && !product.molFormula) {
                product.molFormula = result.molFormula;
                changed = true;
            }
            if (result.molWeight && !product.molWeight) {
                product.molWeight = result.molWeight;
                changed = true;
            }
            if (result.imageUrl && (!product.images || !product.images.length)) {
                product.images = [result.imageUrl];
                changed = true;
            }

            if (changed) {
                console.log(`✔ CAS:${product.casNumber ?? "-"} | ${product.molFormula ?? "-"}`);
                enriched++;
            } else {
                console.log("— No new data");
            }

            // Checkpoint save every 25
            if (i % 25 === 0) {
                fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
                console.log(`\n  [Checkpoint] Saved at ${i}/${toEnrich.length}.\n`);
            }
        } catch (err) {
            console.log(`⚠ ${err.message.substring(0, 60)}`);
            failed++;
        }
    }

    // Final save
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    console.log("\n=== Done ===");
    console.log(`✔ Enriched: ${enriched}`);
    console.log(`✗ Failed/Not found: ${failed}`);
    console.log(`  Total processed: ${toEnrich.length}`);
    console.log("\nRestart the dev server to see changes.");
}

run().catch((e) => { console.error("Fatal:", e); process.exit(1); });
