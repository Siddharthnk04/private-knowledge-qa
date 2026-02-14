import axios from 'axios';
import fs from 'fs';

async function testRetrieval() {
    const question = "Info about sick leave";
    const logFile = 'retrieval_test_result.txt';
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    fs.writeFileSync(logFile, '--- Retrieval Test Script ---\n');
    log(`Question: "${question}"`);

    try {
        log('Calling /ask endpoint...');
        const response = await axios.post('http://localhost:3001/ask', {
            question
        });

        const { answer, sources } = response.data;
        log(`Status: ${response.status}`);
        log(`Answer length: ${answer?.length}`);
        log(`Sources returned: ${sources.length}`);

        let passed = true;

        if (sources.length === 0) {
            log('❌ No sources returned.');
            passed = false;
        }

        const productManualFound = sources.some((s: any) => s.documentName.toLowerCase().includes('product manual'));
        if (productManualFound) {
            log('❌ Irrelevant "Product Manual" found!');
            passed = false;
        } else {
            log('✅ "Product Manual" correctly filtered out.');
        }

        const highlights = sources[0]?.highlights || [];
        log(`Highlights: ${JSON.stringify(highlights)}`);

        // Smart highlighting check: look for a phrase
        const hasPhrase = highlights.some((h: string) => h.includes(' '));
        if (hasPhrase) {
            log('✅ Smart highlighting found phrases.');
        } else {
            log('⚠️ Only single words found in highlights? (This might be okay if answer is short/not matching, but expected phrases)');
        }

    } catch (error: any) {
        log(`❌ Request failed: ${error.message}`);
        if (error.response) {
            log(`Status: ${error.response.status}`);
            log(`Data: ${JSON.stringify(error.response.data)}`);
        }
    }
}

testRetrieval();
