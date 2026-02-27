const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = "https://www.ottokemi.com";
const CATEGORIES_URL = `${BASE_URL}/category/`;

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

async function scrapeCategories() {
    console.log(`Fetching main categories from ${CATEGORIES_URL}`);
    const html = await fetchHtml(CATEGORIES_URL);
    if (!html) return [];

    const $ = cheerio.load(html);
    const categories = [];

    $('a[href*="/subcategory/"], a[href*="/research-laboratory-chemicals/"]').each((i, el) => {
        const name = $(el).text().trim();
        const href = $(el).attr('href');
        if (name && href) {
            categories.push({
                name,
                url: href.startsWith('http') ? href : `${BASE_URL}${href}`
            });
        }
    });

    const uniqueCategories = [];
    const seen = new Set();
    for (const cat of categories) {
        if (!seen.has(cat.url) && cat.name.length > 2) {
            seen.add(cat.url);
            uniqueCategories.push(cat);
        }
    }

    console.log(`Found ${uniqueCategories.length} categories.`);
    return uniqueCategories;
}

scrapeCategories().then(cats => {
    if (cats.length > 0) console.log("First Category:", cats[0]);
});
