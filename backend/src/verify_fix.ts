import axios from 'axios';
import fs from 'fs';

async function testRetrieval() {
    const question = "How many paid sick leaves annually?";
    const logFile = 'retrieval_verification.txt';
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    fs.writeFileSync(logFile, '--- Retrieval Verification Script ---\n');
    log(`Question: "${question}"`);

    try {
        log('Calling /ask endpoint (port 3001)...');
        const response = await axios.post('http://localhost:3001/ask', {
            question
        });

        const { answer, sources } = response.data;
        log(`Status: ${response.status}`);

        if (!sources || sources.length === 0) {
            log('❌ No sources returned.');
        } else {
            log(`Sources returned: ${sources.length}`);
            sources.forEach((s: any, i: number) => {
                log(`[${i + 1}] ${s.documentName}`);
            });

            const productManualFound = sources.some((s: any) => s.documentName.toLowerCase().includes('product manual'));
            if (productManualFound) {
                log('❌ FAIL: Irrelevant "Product Manual" STILL found!');
            } else {
                log('✅ PASS: "Product Manual" correctly filtered out.');
            }
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
