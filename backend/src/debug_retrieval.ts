import prisma from './utils/prisma';
import natural from 'natural';

async function main() {
    const question = "How many paid sick leaves annually?";
    console.log(`Question: "${question}"`);

    // 1. Fetch all chunks
    const chunks = await prisma.chunk.findMany({
        include: {
            document: true,
        }
    });

    console.log(`Total chunks: ${chunks.length}`);

    // Filter Logic from ask.ts
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'about', 'info', 'information', 'how', 'what', 'where', 'when', 'why', 'who']);
    const terms = question
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));

    const searchQuery = terms.join(' ');
    const queryToUse = terms.length > 0 ? searchQuery : question;

    console.log(`Filtered Query: "${queryToUse}"`);
    console.log(`Terms: ${JSON.stringify(terms)}`);

    // 2. TF-IDF Ranking
    const tfidf = new natural.TfIdf();
    chunks.forEach(chunk => {
        tfidf.addDocument(chunk.chunk_text);
    });

    const scores: { index: number; score: number; text: string; docName: string }[] = [];
    tfidf.tfidfs(queryToUse, (i, measure) => {
        scores.push({
            index: i,
            score: measure,
            text: chunks[i].chunk_text.substring(0, 50) + "...",
            docName: chunks[i].document.name
        });
    });

    scores.sort((a, b) => b.score - a.score);

    console.log("\n--- Top Scores ---");
    scores.slice(0, 5).forEach(s => {
        const chunkLower = chunks[s.index].chunk_text.toLowerCase();
        // Check for terms presence efficiently
        const foundTerms = terms.filter(t => chunkLower.includes(t));
        console.log(`[Score: ${s.score.toFixed(4)}] ${s.docName}`);
        console.log(`   Terms Found (${foundTerms.length}/${terms.length}): ${JSON.stringify(foundTerms)}`);
    });

}

main();
