import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Import utilities and services
import { errorHandler, asyncHandler } from './utils/errorHandler.js';
import { sharedStore as store } from './store.js';
// Import middlewares
import { securityHeaders, apiLimiter } from './middlewares/security.js';
// Import routes
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import mediaRoutes from './routes/media.js';
import subscriptionRoutes from './routes/subscription.js';
import userRoutes from './routes/user.js';
import { authenticate, requireRole } from './middlewares/auth.js';
import { UserRole } from '../types.js';
// Import utilities
import { load } from 'cheerio';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const PORT = Number(process.env.PORT ?? 5174);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
function extractText(html) {
    const $ = load(html);
    $('script,style,noscript').remove();
    return $('body').text().replace(/\s+/g, ' ').trim();
}
async function fetchPageText(url, limit) {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'vartmaan-sarokaar-bot/1.0' },
        redirect: 'follow'
    });
    const html = await response.text();
    return {
        html,
        text: extractText(html).slice(0, limit)
    };
}
async function start() {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await store.init();
    const app = express();
    // Security middleware
    app.use(securityHeaders);
    // CORS configuration
    const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.use(cors({
        origin: process.env.NODE_ENV === 'production'
            ? (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin))
            : true,
        credentials: true
    }));
    // General rate limiting
    app.use('/api', apiLimiter);
    // Body parsing
    app.use(express.json({ limit: '15mb' }));
    // Static files
    app.use('/uploads', express.static(UPLOADS_DIR));
    // Health check
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
    });
    app.get('/api/health', (req, res) => {
        res.json({
            success: true,
            message: 'Health check passed.',
            data: {
                ok: true,
                storage: 'file',
                databaseFile: store.getDatabaseFilePath(),
                openAiConfigured: Boolean(OPENAI_API_KEY)
            }
        });
    });
    // App state
    app.get('/api/app-state', (req, res) => {
        res.json({
            success: true,
            message: 'App state loaded.',
            data: store.getPublicAppState()
        });
    });
    // Mount routes
    app.use('/api/auth', authRoutes);
    app.use('/api', contentRoutes);
    app.use('/api', mediaRoutes);
    app.use('/api', subscriptionRoutes);
    app.use('/api', userRoutes);
    app.get('/api/dashboard/stats', authenticate, (req, res) => {
        res.json({
            success: true,
            message: 'Dashboard stats loaded.',
            data: { stats: store.getDashboardStats(req.user) }
        });
    });
    app.get('/api/audit-logs', authenticate, requireRole(UserRole.SUPER_ADMIN), (_req, res) => {
        res.json({
            success: true,
            message: 'Audit logs loaded.',
            data: { logs: store.listAuditLogs() }
        });
    });
    // Web scraping utility
    app.get('/api/scrape', asyncHandler(async (req, res) => {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'A url query parameter is required.',
                error: 'Missing URL'
            });
        }
        const { html, text } = await fetchPageText(url, 200000);
        const $ = load(html);
        const title = $('title').first().text().trim();
        res.json({
            success: true,
            message: 'Website content scraped.',
            data: { title, text }
        });
    }));
    // Chat functionality
    app.post('/api/chat', asyncHandler(async (req, res) => {
        const { url, message } = req.body;
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'A message is required.',
                error: 'Missing message'
            });
        }
        if (!OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'OPENAI_API_KEY is not configured.',
                error: 'OpenAI not configured'
            });
        }
        let pageText = '';
        if (url) {
            try {
                const scraped = await fetchPageText(url, 15000);
                pageText = scraped.text;
            }
            catch (error) {
                console.warn('Failed to scrape context for chat request:', error);
            }
        }
        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You answer questions about the provided website content when it is available. If the answer is not in the provided content, say so clearly.'
                    },
                    {
                        role: 'system',
                        content: `WEBSITE_CONTENT:\n${pageText}`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 800,
                temperature: 0.2
            })
        });
        const payload = await openAiResponse.json();
        if (!openAiResponse.ok) {
            const errorMessage = payload?.error?.message ?? 'OpenAI request failed.';
            return res.status(502).json({
                success: false,
                message: 'OpenAI request failed.',
                error: errorMessage
            });
        }
        res.json({
            success: true,
            message: 'Chat response generated.',
            data: {
                answer: payload?.choices?.[0]?.message?.content ?? ''
            }
        });
    }));
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint not found.'
        });
    });
    // Error handler (must be last)
    app.use(errorHandler);
    app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
        console.log(`File-backed data store: ${store.getDatabaseFilePath()}`);
    });
}
start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
