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
    lines.push('Name: ' + $('h1').first().text().trim());

    // Search for Headers (h1-h6) and their next elements
    lines.push('\n=== HEADERS AND NEXT ELEMENTS ===');
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const tagName = $(el).prop('tagName');
        const text = $(el).text().trim();
        lines.push(`\n${tagName}: "${text}"`);

        const next = $(el).next();
        if (next.length) {
            lines.push(`  Next Tag: ${next.prop('tagName')}.${next.attr('class') || ''}`);
            lines.push(`  Next Text (first 200 chars): ${next.text().trim().substring(0, 200)}`);
        }
    });

    // Specific check for div.row structure for properties
    lines.push('\n=== DIV.ROW ELEMENTS (Properties?) ===');
    $('div.row').each((i, el) => {
        const label = $(el).find('label, .col-4').text().trim();
        const value = $(el).find('.col-8').text().trim();
        if (label || value) {
            lines.push(`  Row ${i}: "${label}" -> "${value}"`);
        }
    });

    const out = lines.join('\n');
    fs.writeFileSync('scripts/sections-inspect.txt', out, 'utf8');
    console.log('Done. See scripts/sections-inspect.txt');
}

const url = 'https://www.ottokemi.com/arginine/l-arginine-99.aspx';
inspect(url).catch(console.error);
