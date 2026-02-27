const axios = require('axios');
const cheerio = require('cheerio');

async function inspect() {
    const r = await axios.get('https://www.ottokemi.com/arginine/l-arginine-99.aspx', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(r.data);

    console.log('=== H6 elements ===');
    $('h6, h5').each((i, e) => {
        console.log($(e).prop('tagName'), '|', $(e).text().trim().substring(0, 80));
    });

    console.log('\n=== SPANS with ID ===');
    $('span[id]').each((i, e) => {
        if (i < 30) console.log($(e).attr('id'), '|', $(e).html()?.substring(0, 100));
    });

    console.log('\n=== LABELS ===');
    $('label').each((i, e) => {
        if (i < 20) console.log('label attrs:', JSON.stringify($(e).attr()), '| text:', $(e).text().trim().substring(0, 50));
    });

    console.log('\n=== IMAGES ===');
    $('img').each((i, e) => {
        const src = $(e).attr('src');
        if (src) console.log(src);
    });

    console.log('\n=== TABLE ROWS ===');
    $('table tr').slice(0, 10).each((i, e) => {
        const cells = $(e).find('td');
        if (cells.length >= 2) {
            console.log(`Row ${i}: "${$(cells[0]).text().trim()}" | "${$(cells[1]).text().trim()}"`);
        }
    });

    console.log('\n=== ROW DIVS ===');
    $('.row').slice(0, 15).each((i, e) => {
        const text = $(e).text().replace(/\s+/g, ' ').trim().substring(0, 150);
        if (text.length > 5) console.log(`Row ${i}: ${text}`);
    });

    // Raw HTML of product info section
    console.log('\n=== PRODUCT INFO HTML snippet ===');
    const productSection = $('#ContentPlaceHolder1_divProductInfo, .product-info, .product-detail, [class*="product"]').first();
    if (productSection.length) {
        console.log(productSection.html()?.substring(0, 1000));
    } else {
        // Find a row containing CAS
        $('*').each((i, e) => {
            if ($(e).text().includes('Mol. Formula') && $(e).children().length < 5 && i < 2000) {
                console.log('Found Mol Formula container:', $(e).prop('tagName'), $(e).attr('class'), '|', $(e).parent().html()?.substring(0, 300));
                return false;
            }
        });
    }
}

inspect().catch(console.error);
