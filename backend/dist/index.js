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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
const upload_1 = __importDefault(require("./routes/upload"));
const ask_1 = __importDefault(require("./routes/ask"));
const documents_1 = __importDefault(require("./routes/documents"));
app.use('/upload', upload_1.default);
app.use('/ask', ask_1.default);
app.use('/documents', documents_1.default);
// Database Health Check (Simple)
const prisma_1 = __importDefault(require("./utils/prisma"));
app.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
