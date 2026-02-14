"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const natural_1 = __importDefault(require("natural"));
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { question } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'Question is required' });
    }
    try {
        // 1. Fetch all chunks
        const chunks = yield prisma_1.default.chunk.findMany({
            include: {
                document: true,
            }
        });
        if (chunks.length === 0) {
            return res.status(404).json({ error: 'No documents found to answer from.' });
        }
        // 2. TF-IDF Ranking
        const tfidf = new natural_1.default.TfIdf();
        // maintain partial mapping of index to chunk
        chunks.forEach(chunk => {
            tfidf.addDocument(chunk.chunk_text);
        });
        // Get scores
        const scores = [];
        tfidf.tfidfs(question, (i, measure) => {
            scores.push({ index: i, score: measure });
        });
        // Sort by score desc and take top 3
        scores.sort((a, b) => b.score - a.score);
        const top3Indices = scores.slice(0, 3).filter(s => s.score > 0).map(s => s.index);
        if (top3Indices.length === 0) {
            return res.json({
                answer: "I couldn't find any relevant information in the uploaded documents.",
                context: []
            });
        }
        const relevantChunks = top3Indices.map(index => chunks[index]);
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
        const response = yield axios_1.default.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'mixtral-8x7b-32768',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.1 // Low temp for factual answers
        }, {
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000 // 15s timeout to avoid hanging requests
        });
        // Robust extraction of answer text to avoid uncaught exceptions
        let answer;
        try {
            answer = (_d = (_c = (_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content;
        }
        catch (err) {
            // fallback to other common shapes
            answer = ((_g = (_f = (_e = response === null || response === void 0 ? void 0 : response.data) === null || _e === void 0 ? void 0 : _e.choices) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.text) || ((_h = response === null || response === void 0 ? void 0 : response.data) === null || _h === void 0 ? void 0 : _h.answer) || undefined;
        }
        if (!answer && response && response.data) {
            // If we can't find a clean answer, stringify a short excerpt for debugging
            try {
                const s = JSON.stringify(response.data);
                answer = s.length > 2000 ? s.substring(0, 2000) + '...' : s;
            }
            catch (e) {
                answer = undefined;
            }
        }
        // Return chunks with metadata for citation
        const sources = relevantChunks.map(c => ({
            documentName: c.document.name,
            chunkText: c.chunk_text
        }));
        res.json({
            answer,
            sources
        });
    }
    catch (error) {
        console.error('Ask error:', ((_j = error.response) === null || _j === void 0 ? void 0 : _j.data) || error.message);
        res.status(500).json({ error: 'Failed to process question' });
    }
}));
exports.default = router;
