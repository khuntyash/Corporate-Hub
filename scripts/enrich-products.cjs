/**
 * enrich-products.cjs
 *
 * Fetches missing chemical data (CAS, molecular formula, molecular weight,
 * and a clean structure image URL) from PubChem for products that currently
 * have no CAS number, no formula, or empty images.
 *
 * PubChem API used:
 *   1. Search by name → get CID
 *   2. From CID → get MolecularFormula, MolecularWeight, first CAS (RN)
 *   3. Structure image: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/PNG
 *
 * Usage: node scripts/enrich-products.cjs
 * Rate limit: ~5 req/s (PubChem free tier)
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const DATA_FILE = path.join(__dirname, "../server/data/storage.json");
const DELAY_MS = 250; // 4 req/s to stay within PubChem limits
const PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound";

// --- Helpers -------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { timeout: 15000 }, (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
                if (res.statusCode === 404) return resolve(null);
                if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                resolve(body);
            });
        }).on("error", reject).on("timeout", () => reject(new Error("Timeout")));
    });
}

async function fetchJson(url) {
    const body = await httpsGet(url);
    if (!body) return null;
    try { return JSON.parse(body); } catch { return null; }
}

/** Search PubChem by compound name, return CID (integer) or null */
async function getCidByName(name) {
    // Use fastidentity/name endpoint — more lenient than exact match
    const url = `${PUBCHEM_BASE}/name/${encodeURIComponent(name)}/cids/JSON?name_type=complete`;
    const data = await fetchJson(url);
    const cid = data?.IdentifierList?.CID?.[0];
    if (cid) return cid;

    // Fallback: partial name search
    const url2 = `${PUBCHEM_BASE}/name/${encodeURIComponent(name)}/cids/JSON?name_type=word`;
    const data2 = await fetchJson(url2);
    return data2?.IdentifierList?.CID?.[0] ?? null;
}

/** Given a CID, get MolecularFormula, MolecularWeight, and first registry CAS */
async function getProperties(cid) {
    const propsUrl = `${PUBCHEM_BASE}/cid/${cid}/property/MolecularFormula,MolecularWeight/JSON`;
    const casUrl = `${PUBCHEM_BASE}/cid/${cid}/xrefs/RN/JSON`;

    const [propsData, casData] = await Promise.all([
        fetchJson(propsUrl),
        fetchJson(casUrl),
    ]);

    const props = propsData?.PropertyTable?.Properties?.[0] ?? {};
    const cas = casData?.InformationList?.Information?.[0]?.RN?.[0] ?? null;

    return {
        molFormula: props.MolecularFormula ?? null,
        molWeight: props.MolecularWeight ? String(props.MolecularWeight) : null,
        casNumber: cas,
        imageUrl: `${PUBCHEM_BASE}/cid/${cid}/PNG`,
    };
}

// --- Main ----------------------------------------------------------------

async function run() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error("storage.json not found:", DATA_FILE);
        process.exit(1);
    }

    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);

    // Find products that need enrichment
    const toEnrich = data.products.filter(([, p]) =>
        !p.casNumber || p.casNumber === "N/A" || !p.molFormula || !p.images?.length
    );

    console.log(`\nFound ${toEnrich.length} products to enrich.\n`);

    let enriched = 0;
    let failed = 0;
    let i = 0;

    for (const entry of toEnrich) {
        const product = entry[1];
        i++;
        // Strip bracketed suffixes for cleaner name lookup, e.g.  "Glycine, 99%+" → "Glycine"
        const searchName = product.name.replace(/,?\s*[\d.]+%.*$/, "").trim();

        process.stdout.write(`[${i}/${toEnrich.length}] ${product.name.substring(0, 55)}... `);

        try {
            await sleep(DELAY_MS);
            const cid = await getCidByName(searchName);
            if (!cid) {
                console.log("❌ CID not found");
                failed++;
                continue;
            }

            await sleep(DELAY_MS);
            const fetched = await getProperties(cid);

            // Only update fields that are missing/invalid
            if (fetched.casNumber && (!product.casNumber || product.casNumber === "N/A")) {
                product.casNumber = fetched.casNumber;
            }
            if (fetched.molFormula && !product.molFormula) {
                product.molFormula = fetched.molFormula;
            }
            if (fetched.molWeight && !product.molWeight) {
                product.molWeight = fetched.molWeight;
            }
            if (fetched.imageUrl && (!product.images || !product.images.length)) {
                product.images = [fetched.imageUrl];
            }

            // If we now have a CAS, also update the image to use Cactus (cleaner)
            if (product.casNumber && product.casNumber !== "N/A" && (!product.images || !product.images.length)) {
                product.images = [`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(product.casNumber)}/image`];
            }

            console.log(`✔ CID:${cid} | CAS:${product.casNumber ?? "-"} | ${product.molFormula ?? "-"}`);
            enriched++;

            // Save every 50 products to preserve progress
            if (enriched % 50 === 0) {
                fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
                console.log(`\n  [Checkpoint] Saved at ${enriched} enrichments.\n`);
            }
        } catch (err) {
            console.log(`⚠ Error: ${err.message}`);
            failed++;
        }
    }

    // Final save
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    console.log("\n=== Done ===");
    console.log(`✔ Enriched: ${enriched}`);
    console.log(`✗ Failed:   ${failed}`);
    console.log(`  Total:    ${toEnrich.length}`);
    console.log("\nRestart the dev server to see changes.");
}

run().catch((e) => { console.error("Fatal:", e); process.exit(1); });
