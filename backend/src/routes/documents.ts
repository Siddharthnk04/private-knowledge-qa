import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const chunks = await prisma.chunk.findMany({
            where: { document_id: id },
            orderBy: { id: 'asc' } // Assuming insertion order or some order
        });

        if (!chunks || chunks.length === 0) {
            return res.status(404).json({ error: 'Document not found or empty' });
        }

        const fullText = chunks.map(c => c.chunk_text).join('\n\n');
        res.json({ content: fullText });
    } catch (error) {
        console.error('Error fetching document content:', error);
        res.status(500).json({ error: 'Failed to fetch document content' });
    }
});

router.get('/', async (req: Request, res: Response) => {
    try {
        const documents = await prisma.document.findMany({
            orderBy: { uploaded_at: 'desc' },
            select: {
                id: true,
                name: true,
                uploaded_at: true,
                _count: {
                    select: { chunks: true }
                }
            }
        });
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

export default router;
