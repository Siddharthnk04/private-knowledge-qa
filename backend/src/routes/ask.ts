import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import natural from 'natural';
import axios from 'axios';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'Question is required' });
    }

    try {
        // 1. Fetch all chunks
        const chunks = await prisma.chunk.findMany({
            include: {
                document: true,
            }
        });

        if (chunks.length === 0) {
            return res.status(404).json({ error: 'No documents found to answer from.' });
        }

        // 2. TF-IDF Ranking
        // Prepare keywords for search and highlighting
        const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'about', 'info', 'information', 'how', 'what', 'where', 'when', 'why', 'who', 'please', 'tell', 'me']);

        const terms = question
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));

        const searchQuery = terms.join(' ');
        const queryToUse = terms.length > 0 ? searchQuery : question;

        const tfidf = new natural.TfIdf();

        // maintain partial mapping of index to chunk
        chunks.forEach(chunk => {
            tfidf.addDocument(chunk.chunk_text);
        });

        // Get scores
        const scores: { index: number; score: number }[] = [];
        tfidf.tfidfs(queryToUse, (i, measure) => {
            scores.push({ index: i, score: measure });
        });

        // Sort by score desc and take top 3
        scores.sort((a, b) => b.score - a.score);

        // Filter out low scores (threshold 0.1) and take top 3
        const top3Indices = scores
            .filter(s => s.score > 0.1)
            .slice(0, 3)
            .map(s => s.index);

        // Minimum Term Match Strategy
        // If the query has multiple terms, enforce that the document matches at least 2 of them
        // This prevents "Product Manual" (matching only "annually") from appearing for "How many paid sick leaves annually?"
        let finalIndices = top3Indices;
        if (terms.length > 2) {
            finalIndices = top3Indices.filter(index => {
                const chunkTextLower = chunks[index].chunk_text.toLowerCase();
                // Count how many unique query terms appear in the chunk
                const matchCount = terms.reduce((count, term) => {
                    return count + (chunkTextLower.includes(term) ? 1 : 0);
                }, 0);
                return matchCount >= 2;
            });
        }

        if (finalIndices.length === 0) {
            return res.json({
                answer: "I couldn't find any relevant information in the uploaded documents.",
                context: []
            });
        }

        const relevantChunks = finalIndices.map(index => chunks[index]);

        // 3. Construct Prompt
        const contextText = relevantChunks.map((c, i) => `[Source ${i + 1}]: ${c.chunk_text}`).join('\n\n');

        const systemPrompt = `You are a helpful assistant. Use ONLY the provided context to answer the user's question.
If the answer is not found in the context, say "Answer not found in uploaded documents."
Do not make up information.
`;

        const userPrompt = `Context:
${contextText}

Question: ${question}
`;

        // 4. Call Groq API
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            console.warn("GROQ_API_KEY is missing");
            // Fallback or error? For now error.
            return res.status(500).json({ error: "LLM service not configured." });
        }

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1 // Low temp for factual answers
            },
            {
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000 // 15s timeout to avoid hanging requests
            }
        );

        // Robust extraction of answer text to avoid uncaught exceptions
        let answer: string | undefined;
        try {
            answer = response?.data?.choices?.[0]?.message?.content;
        } catch (err) {
            // fallback to other common shapes
            answer = response?.data?.choices?.[0]?.text || response?.data?.answer || undefined;
        }
        if (!answer && response && response.data) {
            // If we can't find a clean answer, stringify a short excerpt for debugging
            try {
                const s = JSON.stringify(response.data);
                answer = s.length > 2000 ? s.substring(0, 2000) + '...' : s;
            } catch (e) {
                answer = undefined;
            }
        }

        // Return chunks with metadata for citation
        const sources = relevantChunks.map(c => {
            // Smart Highlighting Logic
            // Start with empty array (user requested strictly answer phrases only)
            const highlights: string[] = [];

            if (answer && typeof answer === 'string') {
                // Try to find phrases from the answer in the source text
                // Split answer into clean words
                const answerWords = answer.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
                const sourceLower = c.chunk_text.toLowerCase();

                // Look for sequences of 3+ words
                for (let len = 6; len >= 3; len--) { // Check lengths 6 down to 3
                    for (let i = 0; i <= answerWords.length - len; i++) {
                        const phrase = answerWords.slice(i, i + len).join(' ');
                        // If phrase is in source and longer than 10 chars
                        if (sourceLower.includes(phrase) && phrase.length > 10) {
                            highlights.push(phrase);
                        }
                    }
                }
            }

            // Deduplicate highlights
            const uniqueHighlights = Array.from(new Set(highlights));

            return {
                documentName: c.document.name,
                chunkText: c.chunk_text,
                highlights: uniqueHighlights
            };
        });

        res.json({
            answer,
            sources
        });

    } catch (error: any) {
        console.error('Ask error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to process question' });
    }
});

export default router;
