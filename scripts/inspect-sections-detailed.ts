import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function inspect(url: string) {
    console.log('Fetching:', url);
    const r = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(r.data);
    const lines: string[] = [];

    lines.push('URL: ' + url);

    // Look for all H5 and dump their next sibling HTML
    $('h5').each((i, el) => {
        const text = $(el).text().trim();
        lines.push(`\nH5: "${text}"`);

        let next = $(el).next();
        if (next.length) {
            lines.push(`  Next HTML: ${next.html()?.trim().substring(0, 1000)}`);
        }
    });

    // Special check for properties table
    const propsHeader = $('h5:contains("Properties")');
    if (propsHeader.length) {
        lines.push('\n=== PROPERTIES TABLE DETAILS ===');
        const container = propsHeader.next();
        container.find('div.row').each((i, row) => {
            const html = $(row).html() || '';
            lines.push(`  Row ${i} HTML: ${html.trim()}`);
            const label = $(row).find('label, .col-4').text().trim();
            const value = $(row).find('.col-8').text().trim();
            lines.push(`    Parsed: "${label}" -> "${value}"`);
        });
    }

    const out = lines.join('\n');
    fs.writeFileSync('scripts/sections-inspect-detailed.txt', out, 'utf8');
    console.log('Done. See scripts/sections-inspect-detailed.txt');
}

const url = 'https://www.ottokemi.com/arginine/l-arginine-99.aspx';
inspect(url).catch(console.error);
