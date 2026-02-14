import axios from 'axios';
import fs from 'fs';

async function testHighlighting() {
    const question = "How many paid sick leaves annually?";
    const logFile = 'highlighting_verification.txt';
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    fs.writeFileSync(logFile, '--- Highlighting Verification Script ---\n');
    log(`Question: "${question}"`);

    try {
        const response = await axios.post('http://localhost:3001/ask', {
            question
        });

        const { sources } = response.data;

        if (!sources || sources.length === 0) {
            log('❌ No sources returned.');
            return;
        }

        const source = sources[0];
        const highlights = source.highlights || [];
        log(`Highlights found: ${JSON.stringify(highlights)}`);

        // Check 1: No scattered keywords (e.g. "how", "many")
        const forbiddenWords = ["how", "many"];
        const hasForbidden = highlights.some((h: string) => forbiddenWords.includes(h.toLowerCase()));

        if (hasForbidden) {
            log('❌ FAIL: Simple keywords still being highlighted!');
        } else {
            log('✅ PASS: No simple question keywords found in highlights.');
        }

        // Check 2: Phrases
        const hasPhrase = highlights.some((h: string) => h.includes(' '));
        if (hasPhrase) {
            log('✅ Smart highlighting found phrases.');
        } else {
            log('⚠️ No phrases found? (Acceptable if answer didn\'t match source text closely enough)');
        }

    } catch (error: any) {
        log(`❌ Request failed: ${error.message}`);
    }
}

testHighlighting();
