/**
 * fill-formulas.cjs
 * Fetches missing molecular formulas and weights from PubChem
 * using the existing CAS numbers stored in storage.json.
 */
const fs = require("fs");
const https = require("https");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../server/data/storage.json");

function fetchJson(url) {
    return new Promise((resolve) => {
        https.get(url, { timeout: 12000 }, (res) => {
            if (res.statusCode !== 200) return resolve(null);
            let body = "";
            res.setEncoding("utf8");
            res.on("data", (c) => (body += c));
            res.on("end", () => {
                try { resolve(JSON.parse(body)); } catch { resolve(null); }
            });
        }).on("error", () => resolve(null))
            .on("timeout", () => resolve(null));
    });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    const needFormula = data.products.filter(
        ([, p]) => p.casNumber && p.casNumber !== "N/A" && !p.molFormula
    );

    console.log("Products needing formula:", needFormula.length);

    let done = 0;
    let filled = 0;

    for (const [, p] of needFormula) {
        done++;
        await sleep(220);

        const url =
            "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/" +
            encodeURIComponent(p.casNumber) +
            "/property/MolecularFormula,MolecularWeight/JSON";

        const result = await fetchJson(url);
        const props = result?.PropertyTable?.Properties?.[0];
        if (props) {
            if (!p.molFormula && props.MolecularFormula) {
                p.molFormula = props.MolecularFormula;
                filled++;
            }
            if (!p.molWeight && props.MolecularWeight) {
                p.molWeight = String(props.MolecularWeight);
            }
        }

        if (done % 50 === 0) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
            console.log("[" + done + "/" + needFormula.length + "] Filled so far: " + filled);
        }
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log("Done. Filled formulas: " + filled + " / " + needFormula.length);
}

run().catch((e) => { console.error(e); process.exit(1); });
