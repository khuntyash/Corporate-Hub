import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const BASE_URL = "https://www.ottokemi.com";
const CATEGORIES_URL = `${BASE_URL}/category/`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchHtml(url: string) {
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            }
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching ${url}:`, error.message);
        } else {
            console.error(`Error fetching ${url}:`, String(error));
        }
        return null;
    }
}

async function scrapeCategories() {
    console.log(`Fetching main categories from ${CATEGORIES_URL}`);
    const html = await fetchHtml(CATEGORIES_URL);
    if (!html) return [];

    const $ = cheerio.load(html);
    const categories: { name: string, url: string }[] = [];

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

async function runTestScrape() {
    const cats = await scrapeCategories();
    if (cats.length > 0) {
        console.log("First Category found:", cats[0]);
    }
}

runTestScrape();
