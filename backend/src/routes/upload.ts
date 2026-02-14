import { Router, Request, Response } from 'express';
import multer from 'multer';
import prisma from '../utils/prisma';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.array('files'), async (req: Request, res: Response) => {
    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const processed: Array<{ name: string; documentId: string; chunks: number }> = [];

    try {
        for (const file of files) {
            if (!file) continue;

            if (file.mimetype !== 'text/plain' && !file.originalname.toLowerCase().endsWith('.txt')) {
                // Skip invalid file and collect error response
                return res.status(400).json({ error: `Only .txt files are allowed. Invalid file: ${file.originalname}` });
            }

            const fileContent = file.buffer.toString('utf-8');
            if (!fileContent.trim()) {
                return res.status(400).json({ error: `File is empty: ${file.originalname}` });
            }

            // 1. Create Document
            const document = await prisma.document.create({
                data: {
                    name: file.originalname,
                },
            });

            // 2. Chunking Logic (unchanged)
            const words = fileContent.split(/\s+/);
            const CHUNK_SIZE = 500;
            const chunks: Array<{ document_id: string; chunk_text: string }> = [];

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
                await prisma.chunk.createMany({
                    data: chunks,
                });
            }

            processed.push({ name: file.originalname, documentId: document.id, chunks: chunks.length });
        }

        res.json({
            message: 'Files uploaded and processed successfully',
            processed,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error processing files' });
    }
});

export default router;
