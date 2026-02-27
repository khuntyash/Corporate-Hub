import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function inspect(url: string) {
    const r = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(r.data);
    const lines: string[] = [];

    lines.push('NAME: ' + $('h1').first().text().trim());

    // Method 1: row > col-4 + col-8
    lines.push('\n--- Method1: row->col4+col8 ---');
    $('div.row').each((_, row) => {
        const lbl = $(row).find('> div.col-4, > div[class="col-4 pr-0"], > label').first().text().trim();
        const val = $(row).find('> div.col-8, > div[class*="col-8"]').first().text().trim();
        if (lbl && val && lbl.length < 40) {
            lines.push(`  [${lbl}] => [${val.substring(0, 60)}]`);
        }
    });

    // Method 2: sibling approach - find label, then next sibling
    lines.push('\n--- Method2: find col-4 text then sibling ---');
    $('div.col-4, div[class*="col-4"], label').each((_, el) => {
        const txt = $(el).text().trim();
        if (txt && txt.length < 40 && !txt.includes('\n')) {
            const next = $(el).next('div, span');
            const val = next.text().trim();
            lines.push(`  [${txt}] => [${val.substring(0, 60)}]`);
        }
    });

    // Save raw HTML section with Mol Formula
    const bodyHtml = r.data as string;
    const molIdx = bodyHtml.indexOf('Mol. Formula');
    if (molIdx > 0) {
        lines.push('\n--- RAW HTML around Mol. Formula (first occurrence) ---');
        lines.push(bodyHtml.substring(molIdx - 200, molIdx + 400));
    }

    const output = lines.join('\n');
    fs.writeFileSync('scripts/selector-test-output.txt', output, 'utf8');
    console.log('written to selector-test-output.txt');
}

const url = process.argv[2] || 'https://www.ottokemi.com/arginine/l-arginine-99.aspx';
inspect(url).catch(console.error);
