"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT || '5000', 10);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Request logging middleware
app.use((req, res, next) => {
    console.log(`[request]: ${req.method} ${req.path}`);
    next();
});
// Lazy load routes after app is created
let routesLoaded = false;
const loadRoutes = () => __awaiter(void 0, void 0, void 0, function* () {
    if (routesLoaded)
        return;
    routesLoaded = true;
    try {
        console.log('[routes]: Loading routes...');
        const uploadRouter = (yield Promise.resolve().then(() => __importStar(require('./routes/upload')))).default;
        const askRouter = (yield Promise.resolve().then(() => __importStar(require('./routes/ask')))).default;
        const documentsRouter = (yield Promise.resolve().then(() => __importStar(require('./routes/documents')))).default;
        app.use('/upload', uploadRouter);
        app.use('/ask', askRouter);
        app.use('/documents', documentsRouter);
        console.log('[routes]: All routes loaded successfully');
    }
    catch (err) {
        console.error('[routes]: Failed to load routes:', err.message, err.stack);
    }
});
// Load routes immediately after creating app
loadRoutes().catch(err => {
    console.error('[routes]: Unexpected error loading routes:', err);
});
// Database Health Check (Simple)
const prisma_1 = __importDefault(require("./utils/prisma"));
app.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[route]: /status endpoint hit');
    let dbStatus = 'disconnected';
    try {
        yield prisma_1.default.$queryRaw `SELECT 1`;
        dbStatus = 'connected';
    }
    catch (e) {
        dbStatus = 'error';
    }
    // Check LLM Reachability (Mock for now, will implement properly)
    const llmStatus = 'reachable'; // We will verify this properly later
    res.json({
        backend: 'healthy',
        database: dbStatus,
        llm: llmStatus
    });
}));
// Simple test endpoint
app.get('/test', (req, res) => {
    console.log('[route]: /test endpoint hit');
    res.json({ message: 'test ok' });
});
// Start server immediately - let Node.js bind to all available interfaces
const server = app.listen(port, () => {
    const addr = server.address();
    console.log(`[server]: Server listening on:`, addr);
});
server.on('error', (err) => {
    console.error('[server]: Server error event:', err.message, err.code);
    if (err.code === 'EADDRINUSE') {
        console.error('[server]: Port already in use');
        process.exit(1);
    }
});
server.on('error', (err) => {
    console.error('[server]: Listen error:', err.message);
    process.exit(1);
});
// Keep server alive - prevent premature exit
setInterval(() => {
    console.log('[server]: Keep-alive ping at', new Date().toISOString());
}, 30000);
// Test Prisma connection in background
console.log('[db]: Starting Prisma connection...');
prisma_1.default.$connect()
    .then(() => {
    console.log('[db]: Prisma connected successfully');
})
    .catch((err) => {
    console.error('[db]: Failed to connect to Prisma:', err.message);
    console.error('[db]: Stack:', err.stack);
});
process.on('unhandledRejection', (reason) => {
    console.error('[error]: Unhandled rejection:', reason);
    console.error('[error]: Stack:', reason instanceof Error ? reason.stack : 'No stack');
});
process.on('uncaughtException', (err) => {
    console.error('[error]: Uncaught exception:', err.message);
    console.error('[error]: Stack:', err.stack);
});
