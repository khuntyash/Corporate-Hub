const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeProductDetails(url) {
    console.log(`Fetching product page from ${url}`);

    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        let details = {
            casNumber: "",
            hsnCode: "",
            molFormula: "",
            molWeight: "",
            synonyms: "",
            imageUrl: ""
        };

        const imgEl = $('img').filter((i, el) => {
            const src = $(el).attr('src');
            return src && src.includes('product') && !src.includes('logo');
        }).first();

        if (imgEl.length) {
            let src = imgEl.attr('src');
            if (src && !src.startsWith('http')) {
                src = "https://www.ottokemi.com" + (src.startsWith('/') ? '' : '/') + src;
            }
            details.imageUrl = src;
        }

        // Loop through labels and grab the adjacent value
        $('label.col-form-label').each((i, el) => {
            const labelText = $(el).text().trim().toLowerCase();
            // The value is usually in the next element, a div
            const valueText = $(el).next('div').text().trim();

            if (labelText.includes('cas')) details.casNumber = valueText;
            if (labelText.includes('hsn')) details.hsnCode = valueText;
            if (labelText.includes('mol. formula') || labelText.includes('molecular formula')) details.molFormula = valueText;
            if (labelText.includes('mol. weight') || labelText.includes('molecular weight')) details.molWeight = valueText;
            if (labelText.includes('synonyms')) details.synonyms = valueText;
        });

        console.log("Extracted Data:", details);
        return details;

    } catch (error) {
        console.error("Error:", error.message);
    }
}

scrapeProductDetails('https://www.ottokemi.com/protein-chromatography/dimethylpolysiloxane-viscosity-50-cst-d-2070.aspx');
