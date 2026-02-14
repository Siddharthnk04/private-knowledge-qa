import dotenv from 'dotenv';
import prisma from './utils/prisma';
import axios from 'axios';
import fs from 'fs';

dotenv.config();

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync('reproduction_result.txt', msg + '\n');
}

async function main() {
    fs.writeFileSync('reproduction_result.txt', '--- Reproduction Script Multi-Model Test ---\n');

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        log('❌ GROQ_API_KEY is missing');
        return;
    }

    const models = [
        'llama-3.3-70b-versatile',
        'llama-3.1-70b-versatile',
        'llama-3.1-8b-instant',
        'gemma2-9b-it',
        'mixtral-8x7b-32768' // Just to confirm failure
    ];

    log('Testing models...');

    for (const model of models) {
        try {
            log(`Testing model: ${model}...`);
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: model,
                    messages: [{ role: 'user', content: 'Hello' }]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );
            log(`✅ SUCCESS: ${model} is working! Status: ${response.status}`);
            // Break after finding one working model? Or list all?
            // Let's break to save time/tokens.
            break;
        } catch (err: any) {
            if (err.response?.data?.error?.code === 'model_decommissioned') {
                log(`❌ FAILED: ${model} is decommissioned.`);
            } else {
                log(`❌ FAILED: ${model} error: ${err.message}`);
                if (err.response) {
                    log(`   Data: ${JSON.stringify(err.response.data).substring(0, 200)}`);
                }
            }
        }
    }
}

main()
    .catch((err) => log('FATAL: ' + err))
    .finally(async () => {
        await prisma.$disconnect();
    });
