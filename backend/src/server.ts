import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[request]: ${req.method} ${req.path}`);
    next();
});

// Lazy load routes after app is created
let routesLoaded = false;
const loadRoutes = async () => {
    if (routesLoaded) return;
    routesLoaded = true;
    
    try {
        console.log('[routes]: Loading routes...');
        const uploadRouter = (await import('./routes/upload')).default;
        const askRouter = (await import('./routes/ask')).default;
        const documentsRouter = (await import('./routes/documents')).default;
        
        app.use('/upload', uploadRouter);
        app.use('/ask', askRouter);
        app.use('/documents', documentsRouter);
        console.log('[routes]: All routes loaded successfully');
    } catch (err: any) {
        console.error('[routes]: Failed to load routes:', err.message, err.stack);
    }
};

// Load routes immediately after creating app
loadRoutes().catch(err => {
    console.error('[routes]: Unexpected error loading routes:', err);
});

// Database Health Check (Simple)
import prisma from './utils/prisma';

app.get('/status', async (req: Request, res: Response) => {
    console.log('[route]: /status endpoint hit');
    let dbStatus = 'disconnected';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (e) {
        dbStatus = 'error';
    }

    // Check LLM Reachability (Mock for now, will implement properly)
    const llmStatus = 'reachable'; // We will verify this properly later

    res.json({
        backend: 'healthy',
        database: dbStatus,
        llm: llmStatus
    });
});

// Simple test endpoint
app.get('/test', (req: Request, res: Response) => {
    console.log('[route]: /test endpoint hit');
    res.json({ message: 'test ok' });
});

// Start server immediately - let Node.js bind to all available interfaces
const server = app.listen(port, () => {
    const addr = server.address();
    console.log(`[server]: Server listening on:`, addr);
});

server.on('error', (err: any) => {
    console.error('[server]: Server error event:', err.message, err.code);
    if (err.code === 'EADDRINUSE') {
        console.error('[server]: Port already in use');
        process.exit(1);
    }
});

server.on('error', (err: any) => {
    console.error('[server]: Listen error:', err.message);
    process.exit(1);
});

// Keep server alive - prevent premature exit
setInterval(() => {
    console.log('[server]: Keep-alive ping at', new Date().toISOString());
}, 30000);

// Test Prisma connection in background
console.log('[db]: Starting Prisma connection...');
prisma.$connect()
    .then(() => {
        console.log('[db]: Prisma connected successfully');
    })
    .catch((err: any) => {
        console.error('[db]: Failed to connect to Prisma:', err.message);
        console.error('[db]: Stack:', err.stack);
    });

process.on('unhandledRejection', (reason: any) => {
    console.error('[error]: Unhandled rejection:', reason);
    console.error('[error]: Stack:', reason instanceof Error ? reason.stack : 'No stack');
});

process.on('uncaughtException', (err: Error) => {
    console.error('[error]: Uncaught exception:', err.message);
    console.error('[error]: Stack:', err.stack);
});
