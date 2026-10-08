import 'express-async-errors';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ENV } from './config/env.js';
import { connectDB, setShuttingDown } from './config/db.js';
import { initializeSystem } from './config/init.js';
import { startBackgroundJobs } from './jobs/expiryWorker.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Trust reverse proxy (Cloudflare Tunnel, trycloudflare, Nginx, Heroku)
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // For seamless SPA, external fonts, and ImgBB images
    crossOriginEmbedderPolicy: false,
  })
);

// CORS - Standard same-origin support with permissive access for mobile APK / WebViews
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Rate Limiting & Routes (mounted before frontend)
app.use('/api', apiLimiter, apiRoutes);

// Frontend Setup: Vite dev middleware in development; Static dist in production
async function setupFrontend(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    // SPA fallback for HTML requests in dev
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // In production or when client is built, serve dist/client or dist
    const distClientPath = path.resolve(process.cwd(), 'dist/client');
    const distFallbackPath = path.resolve(process.cwd(), 'dist');
    const clientDistPath = fs.existsSync(distClientPath) ? distClientPath : distFallbackPath;

    if (fs.existsSync(clientDistPath)) {
      app.use(express.static(clientDistPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.sendFile(path.join(clientDistPath, 'index.html'));
      });
    }
  }

  // Central Error Handler
  app.use(errorHandler);
}

// Server startup sequence
async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting Multi-Library Unified Server...');
    await connectDB();
    await initializeSystem();
    startBackgroundJobs();
    await setupFrontend();

    server.listen(ENV.PORT, () => {
      console.log(`\n======================================================`);
      console.log(`  🎉 Server running on port ${ENV.PORT}`);
      console.log(`  🌐 App & Client: http://localhost:${ENV.PORT}`);
      console.log(`  🌐 API Base URL: http://localhost:${ENV.PORT}/api`);
      console.log(`  🔐 SuperAdmin:   ${ENV.SUPERADMIN_EMAIL}`);
      console.log(`======================================================\n`);
    });

    const shutdown = async () => {
      console.log('\n🛑 Gracefully shutting down Server...');
      setShuttingDown(true);
      server.close(async () => {
        console.log('✅ HTTP server closed.');
        try {
          const mongoose = (await import('mongoose')).default;
          await mongoose.disconnect();
          console.log('✅ MongoDB disconnected cleanly.');
        } catch (_) {}
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️ [Server Safety] Unhandled Rejection intercepted:', reason?.message || reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('⚠️ [Server Safety] Uncaught Exception intercepted:', err.message);
});

// Start if not in test
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
