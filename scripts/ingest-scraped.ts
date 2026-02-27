import { storage } from "../server/storage-factory";
import axios from 'axios';
import * as cheerio from 'cheerio';

const scrapedData = {
    "categories_sample": [
        { "name": "Affinity chromatography", "url": "https://www.ottokemi.com/research-laboratory-chemicals/affinity-chromatography.aspx" },
        { "name": "Amino acids", "url": "https://www.ottokemi.com/subcategory/amino-acid.aspx" },
        { "name": "Analytical reagents", "url": "https://www.ottokemi.com/subcategory/analytical-reagents.aspx" },
        { "name": "Antibiotics", "url": "https://www.ottokemi.com/research-laboratory-chemicals/antibioticsantibiotics.aspx" },
        { "name": "Base ingredients", "url": "https://www.ottokemi.com/subcategory/baseingredients.aspx" },
        { "name": "Biochemicals & reagents", "url": "https://www.ottokemi.com/subcategory/biochemicals-and-reagents.aspx" },
        { "name": "Biochemicals found in plants", "url": "https://www.ottokemi.com/research-laboratory-chemicals/biochemicals-found-in-plants.aspx" },
        { "name": "Biological buffers", "url": "https://www.ottokemi.com/subcategory/biological-buffers.aspx" },
        { "name": "Biological stains", "url": "https://www.ottokemi.com/subcategory/biological-stains.aspx" },
        { "name": "Boc amino acid", "url": "https://www.ottokemi.com/research-laboratory-chemicals/boc-amino-acid.aspx" }
    ],
    "first_category_products_sample": [
        {
            "name": "Dimethylpolysiloxane, viscosity, 50 cSt",
            "url": "https://www.ottokemi.com/protein-chromatography/dimethylpolysiloxane-viscosity-50-cst-d-2070.aspx",
            "cas_number": "9016-00-6",
            "packings": [
                { "size": "100 mg", "price": "144.00" },
                { "size": "250 mg", "price": "POR" },
                { "size": "500 mg", "price": "190.00" }
            ],
            "sub_category": "Protein chromatography"
        },
        {
            "name": "Dimethylpolysiloxane, viscosity, 350 cSt",
            "url": "https://www.ottokemi.com/protein-chromatography/dimethylpolysiloxane-viscosity-350-cst.aspx",
            "cas_number": "9016-00-6",
            "packings": [
                { "size": "100 gm", "price": "130.00" },
                { "size": "500 gm", "price": "599.00" },
                { "size": "1 kg", "price": "POR" }
            ],
            "sub_category": "Protein chromatography"
        },
        {
            "name": "Dimethylpolysiloxane, viscosity, 10 cSt",
            "url": "https://www.ottokemi.com/protein-chromatography/dimethylpolysiloxane-viscosity-10-cst.aspx",
            "cas_number": "9016-00-6",
            "packings": [
                { "size": "10 ml", "price": "319.00" },
                { "size": "25 ml", "price": "POR" },
                { "size": "50 ml", "price": "POR" }
            ],
            "sub_category": "Silicone Oils"
        },
        {
            "name": "Acetic acid glacial, GR 99%+",
            "url": "https://www.ottokemi.com/ar-gr-chemical-solvents/acetic-acid-glacial-gr-a-1251.aspx",
            "cas_number": "64-19-7",
            "packings": [
                { "size": "500 ml", "price": "350.00" },
                { "size": "2.5 lt", "price": "1200.00" },
                { "size": "25 lt", "price": "POR" }
            ],
            "sub_category": "AR / GR Chemical & Solvents"
        }
    ]
};

async function seedData() {
    console.log("Starting data ingestion from scraping results using active storage...");

    try {
        // 1. Rebuild and insert category structure
        console.log("Updating category structure...");
        const structure: Record<string, string[]> = {};

        scrapedData.categories_sample.forEach(cat => {
            structure[cat.name] = [];
        });

        // Assign subcategories properly
        scrapedData.first_category_products_sample.forEach(prod => {
            const catName = prod.name.includes("Acetic") ? "Analytical reagents" : "Affinity chromatography";
            if (!structure[catName]) structure[catName] = [];
            if (!structure[catName].includes(prod.sub_category)) {
                structure[catName].push(prod.sub_category);
            }
        });

        const structureStr = JSON.stringify(structure);
        await storage.updateSiteContent("category_structure", structureStr);

        // 2. Insert Products
        console.log("Inserting scraped products and fetching full details from their URLs...");

        let count = 1;
        for (const prod of scrapedData.first_category_products_sample) {
            let defaultPrice = "0";
            for (const p of prod.packings) {
                if (p.price !== "POR") {
                    defaultPrice = p.price;
                    break;
                }
            }

            console.log(`Fetching details for ${prod.name}...`);
            let details = {
                casNumber: prod.cas_number || "",
                hsnCode: "",
                molFormula: "",
                molWeight: "",
                synonyms: "",
                imageUrl: "https://api.placeholder.com/200/200",
                description: "Scraped from Ottokemi",
                specifications: {} as Record<string, string>
            };

            try {
                const response = await axios.get(prod.url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    }
                });

                const html = response.data;
                const $ = cheerio.load(html);

                const imgEl = $('.bxslider img').first();
                if (imgEl.length) {
                    let src = imgEl.attr('src');
                    if (src && !src.startsWith('http')) {
                        src = "https://www.ottokemi.com" + (src.startsWith('/') ? '' : '/') + src;
                    }
                    if (src) details.imageUrl = src;
                } else {
                    const fallbackImg = $('img[src*="product"]').first();
                    if (fallbackImg.length) {
                        let src = fallbackImg.attr('src');
                        if (src && !src.startsWith('http')) {
                            src = "https://www.ottokemi.com" + (src.startsWith('/') ? '' : '/') + src;
                        }
                        if (src) details.imageUrl = src;
                    }
                }

                const autoSubscript = (text: string) => {
                    // Match digits following an uppercase letter, lowercase letter, or closing parenthesis
                    // Exclude digits followed by a dot or part of a decimal
                    return text.replace(/([A-Z][a-z]?|\))(\d+)(?![.\d])/g, '$1<sub>$2</sub>');
                };

                const cleanHtml = (html: string) => {
                    // Normalize existing sub tags and strip other HTML
                    let cleaned = html.replace(/<sub[^>]*>/gi, '<sub>')
                        .replace(/<\/sub>/gi, '</sub>')
                        .replace(/<(?!sub|\/sub)[^>]*>/gi, '')
                        .trim();
                    return autoSubscript(cleaned);
                };

                // --- Extract Description ---
                const descHeader = $('h5').filter((i: any, el: any) => $(el).text().trim().toUpperCase() === "DESCRIPTION");
                if (descHeader.length) {
                    const descHtml = descHeader.next('p').html() || descHeader.next('div').html() || "";
                    if (descHtml) details.description = cleanHtml(descHtml);
                }



                $('.row').each((i: any, el: any) => {
                    const row = $(el);
                    const label = row.find('label').first();
                    const value = row.find('div.col-8, div.col-7, div.col-lg-8, div.col-lg-7').first();

                    if (label.length && value.length) {
                        const labelText = label.text().trim().toLowerCase();
                        const valueHtml = value.html() || "";
                        const valueText = labelText.includes('formula') || labelText.includes('synonyms') || labelText.includes('description') || !['cas', 'hsn'].some(k => labelText.includes(k))
                            ? cleanHtml(valueHtml)
                            : value.text().trim();

                        if (labelText.includes('cas')) details.casNumber = valueText || details.casNumber;
                        else if (labelText.includes('hsn')) details.hsnCode = valueText;
                        else if (/mol.*formula/i.test(labelText) || labelText.includes('formula')) details.molFormula = valueText;
                        else if (/mol.*weight/i.test(labelText) || labelText.includes('weight')) details.molWeight = valueText;
                        else if (labelText.includes('synonyms')) details.synonyms = valueText;
                        else if (labelText !== '' && valueText !== '' && !labelText.includes('categories')) {
                            const cleanedLabel = label.text().trim().replace(':', '');
                            details.specifications[cleanedLabel] = valueText;
                            console.log(`  Found Prop: [${cleanedLabel}] = [${valueText}]`);
                        }
                    }
                });
            } catch (e) {
                console.error(`Failed to fetch details for ${prod.url}`, e);
            }

            // Fallback for missing string fields
            console.log(`Extracted Details for ${prod.name}: CAS=${details.casNumber}, HSN=${details.hsnCode || '-'}, Desc=${details.description.substring(0, 50)}...`);

            const catName = prod.name.includes("Acetic") ? "Analytical reagents" : "Affinity chromatography";

            await storage.createProduct({
                name: prod.name,
                sku: prod.name.includes("Acetic") ? "A 1251" : `D20${69 + count}`,
                category: catName,
                subCategory: prod.sub_category,
                casNumber: details.casNumber,
                price: defaultPrice,
                stockQuantity: 100,
                productPackings: prod.packings,
                description: details.description,
                isActive: true,
                packingType: "Vial / Bottle",
                gstTaxRate: "18%",
                images: [details.imageUrl],
                minStockLevel: 0,
                specifications: JSON.stringify(details.specifications),
                synonyms: details.synonyms,
                molFormula: details.molFormula,
                molWeight: details.molWeight,
                hsnCode: details.hsnCode,
                sellerCompanyId: undefined,
                cost: "0",
            });
            count++;
        }

        console.log("Data ingestion completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error ingesting data:", error);
        process.exit(1);
    }
}

seedData();
