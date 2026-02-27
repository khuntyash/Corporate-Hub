const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = "https://www.ottokemi.com";

async function fetchHtml(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

async function scrapeCategory(url) {
    console.log(`Fetching category page from ${url}`);
    const html = await fetchHtml(url);
    if (!html) return;

    const $ = cheerio.load(html);
    const products = [];

    // The products on ottokemi category pages usually appear in tables or product cards
    // Let's inspect the HTML by dumping a snippet or parsing generic product links

    // Looks for links that might be products (they usually don't contain category/subcategory)
    // Common pattern for products is /product-name.aspx
    $('a').each((i, el) => {
        const title = $(el).attr('title');
        const href = $(el).attr('href');

        // Products often have a title attribute with their name and a link ending in .aspx
        if (title && href && href.endsWith('.aspx') && !href.includes('category') && !href.includes('subcategory') && !href.includes('resources')) {
            products.push({
                name: title.trim(),
                url: href.startsWith('http') ? href : `${BASE_URL}${href}`
            });
        }
    });

    const uniqueProducts = [];
    const seen = new Set();
    for (const p of products) {
        if (!seen.has(p.url)) {
            seen.add(p.url);
            uniqueProducts.push(p);
        }
    }

    console.log(`Found ${uniqueProducts.length} potential products.`);
    if (uniqueProducts.length > 0) {
        console.log("First Product:", uniqueProducts[0]);
    } else {
        // If it failed to find links, maybe it's in a specific div. Let's dump some text to see.
        console.log("Failed to find explicit products. Raw text snippet from body:");
        console.log($('body').text().substring(0, 500).replace(/\s+/g, ' '));
    }

    return uniqueProducts;
}

scrapeCategory('https://www.ottokemi.com/subcategory/amino-acid.aspx');
