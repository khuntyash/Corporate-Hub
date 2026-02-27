const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeCategory(url) {
    console.log(`Fetching category page from ${url}`);

    // Sometimes the User-Agent is not enough of a disguise for CDNs. 
    // Usually Ottokemi is a simple ASP.NET site though.
    const response = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Look for product containers
    const firstProductBox = $('.product-box').first();
    if (firstProductBox.length) {
        console.log("Found .product-box! HTML snippet:");
        console.log(firstProductBox.html().substring(0, 500));
    } else {
        // Just print the first few links to see what is there
        console.log("No .product-box found. Found a tags:");
        $('a').slice(50, 60).each((i, el) => {
            console.log($(el).attr('href'), $(el).text());
        });
    }
}

scrapeCategory('https://www.ottokemi.com/subcategory/amino-acid.aspx');
