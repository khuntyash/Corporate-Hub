import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function inspect() {
    const r = await axios.get('https://www.ottokemi.com/arginine/l-arginine-99.aspx', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(r.data);

    const lines: string[] = [];

    lines.push('=== SPANS with ID ===');
    $('span[id], div[id*="lbl"], a[id*="lbl"]').each((i, e) => {
        const id = $(e).attr('id') || '';
        const val = $(e).text().trim().substring(0, 50);
        if (id && val) lines.push(`  ${id} | ${val}`);
    });

    lines.push('\n=== IMAGES ===');
    $('img').each((i, e) => {
        const src = $(e).attr('src') || '';
        if (src) lines.push(`  ${src}`);
    });

    lines.push('\n=== TABLE rows (first 20) ===');
    $('table tr').slice(0, 20).each((i, e) => {
        const cells = $(e).find('td');
        if (cells.length >= 2) {
            lines.push(`  "${$(cells[0]).text().trim()}" | "${$(cells[1]).text().trim().substring(0, 30)}"`);
        }
    });

    lines.push('\n=== col-4 labels ===');
    $('[class*="col-4"], [class*="col-sm-4"]').each((i, e) => {
        const txt = $(e).text().trim().substring(0, 50);
        if (txt && i < 30) lines.push(`  "${txt}"`);
    });

    lines.push('\n=== Parity check - look for 174 (mol weight) ===');
    $('*').each((i, e) => {
        const txt = $(e).text().trim();
        if (txt === '174.20' || txt.includes('C6H14') || txt.includes('29224990')) {
            lines.push(`  tag:${$(e).prop('tagName')} id:${$(e).attr('id')} class:${$(e).attr('class')} | "${txt.substring(0, 80)}"`);
        }
    });

    // Output and save
    const out = lines.join('\n');
    fs.writeFileSync('scripts/inspect-output.txt', out, 'utf8');
    console.log(out);
}

inspect().catch(console.error);
