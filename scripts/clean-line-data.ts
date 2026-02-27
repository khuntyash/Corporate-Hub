import fs from 'fs';
import path from 'path';

const storagePath = path.resolve('c:/Users/yash/Downloads/Corporate-Hub/Corporate-Hub/server/data/storage.json');

try {
    const rawData = fs.readFileSync(storagePath, 'utf8');
    const lines = rawData.split('\n');
    let startLine = -1;
    let endLine = -1;

    // Find the start and end of the gibberish company "onfsn"
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('65e1f848-2ff9-4e30-acdd-8d9ecf75c8f0')) {
            // Found the ID line. Go back to find the start of the array element [
            let j = i;
            while (j >= 0 && !lines[j].trim().startsWith('[')) {
                j--;
            }
            startLine = j;

            // Go forward to find the end of the array element ]
            let k = i;
            let bracketCount = 0;
            while (k < lines.length) {
                bracketCount += (lines[k].match(/\[/g) || []).length;
                bracketCount -= (lines[k].match(/\]/g) || []).length;
                if (bracketCount === 0 && lines[k].includes(']')) {
                    endLine = k;
                    break;
                }
                k++;
            }
            break;
        }
    }

    if (startLine !== -1 && endLine !== -1) {
        console.log(`Removing lines ${startLine + 1} to ${endLine + 1}`);
        // Handle trailing comma if it's the last element or middle element
        // Since it's the second of two, we should remove the preceding comma or handle it.
        // Actually, simpler: remove the lines and then fix commas.
        const newLines = lines.slice(0, startLine).concat(lines.slice(endLine + 1));

        // Remove trailing comma from previous line if needed
        const prevIdx = startLine - 1;
        if (prevIdx >= 0 && newLines[prevIdx].trim().endsWith(',')) {
            newLines[prevIdx] = newLines[prevIdx].replace(/,$/, '');
        }

        fs.writeFileSync(storagePath, newLines.join('\n'));
        console.log('Successfully removed gibberish company via line processing.');
    } else {
        console.log('Could not find company lines via direct search.');
    }

} catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
}
