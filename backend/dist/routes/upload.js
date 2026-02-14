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
const multer_1 = __importDefault(require("multer"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/', upload.array('files'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    const processed = [];
    try {
        for (const file of files) {
            if (!file)
                continue;
            if (file.mimetype !== 'text/plain' && !file.originalname.toLowerCase().endsWith('.txt')) {
                // Skip invalid file and collect error response
                return res.status(400).json({ error: `Only .txt files are allowed. Invalid file: ${file.originalname}` });
            }
            const fileContent = file.buffer.toString('utf-8');
            if (!fileContent.trim()) {
                return res.status(400).json({ error: `File is empty: ${file.originalname}` });
            }
            // 1. Create Document
            const document = yield prisma_1.default.document.create({
                data: {
                    name: file.originalname,
                },
            });
            // 2. Chunking Logic (unchanged)
            const words = fileContent.split(/\s+/);
            const CHUNK_SIZE = 500;
            const chunks = [];
            for (let i = 0; i < words.length; i += CHUNK_SIZE) {
                const chunkText = words.slice(i, i + CHUNK_SIZE).join(' ');
                if (chunkText.trim().length > 0) {
                    chunks.push({
                        document_id: document.id,
                        chunk_text: chunkText,
                    });
                }
            }
            // 3. Store Chunks
            if (chunks.length > 0) {
                yield prisma_1.default.chunk.createMany({
                    data: chunks,
                });
            }
            processed.push({ name: file.originalname, documentId: document.id, chunks: chunks.length });
        }
        res.json({
            message: 'Files uploaded and processed successfully',
            processed,
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error processing files' });
    }
}));
exports.default = router;
