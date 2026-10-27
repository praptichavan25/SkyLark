import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config/index';
import healthRoutes from './routes/health.routes';
import airportRoutes from './routes/airport.routes';
import flightRoutes from './routes/flight.routes';
import searchRoutes from './routes/search.routes';
import routeRoutes from './routes/route.routes';
import apiRouter from './routes/api';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const isProduction = config.nodeEnv === 'production';

// ── SECURITY HEADERS ──────────────────────────────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production, frontend and backend share the same origin — CORS not needed.
// In development, allow the Vite dev server origin.
if (!isProduction) {
  const allowedOrigins = [
    config.corsOrigin,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in local dev
        }
      },
      credentials: true,
    })
  );
}

// ── BODY PARSING ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── API ROUTES ────────────────────────────────────────────────────────────────
// All /api/* routes are registered before static serving so they are never
// accidentally caught by the SPA fallback handler.
app.use('/api/health', healthRoutes);
app.use('/api/airports', airportRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/searches', searchRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api', apiRouter);

// Return JSON 404 for any unknown /api subpaths — never serve index.html for API
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'API_NOT_FOUND',
      message: 'API endpoint not found.',
    },
  });
});

// ── STATIC FRONTEND SERVING (PRODUCTION) ─────────────────────────────────────
// In production, Express serves the Vite build from frontend/dist.
// In development, Vite's own dev server handles the frontend on port 5173.
if (isProduction) {
  const distPath = config.frontendDistPath;
  const indexHtml = path.join(distPath, 'index.html');

  if (fs.existsSync(distPath) && fs.existsSync(indexHtml)) {
    // Serve static assets (JS, CSS, images, etc.)
    app.use(express.static(distPath, { index: false }));

    // SPA fallback: serve index.html for any non-API, non-static route
    app.use((_req: Request, res: Response) => {
      res.sendFile(indexHtml);
    });

    console.log(`🎨 Serving frontend from: ${distPath}`);
  } else {
    console.warn(
      `⚠️  Frontend dist not found at ${distPath}. Run "npm run build:frontend" first.`
    );

    // Fallback: return a clear error instead of crashing
    app.use((_req: Request, res: Response) => {
      res.status(503).json({
        success: false,
        error: {
          code: 'FRONTEND_NOT_BUILT',
          message: 'Frontend build not found. Run "npm run build" and restart the server.',
        },
      });
    });
  }
} else {
  // Development: the Vite dev server handles the frontend.
  // Expose a simple root response so the API is still discoverable.
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Skylark API — development mode',
      status: 'online',
      docs: '/api/health',
      note: 'Frontend served by Vite dev server on port 5173',
    });
  });
}

// ── CENTRALIZED ERROR HANDLER ─────────────────────────────────────────────────
app.use(errorHandler);

// ── SERVER STARTUP ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(config.port, config.host, () => {
    console.log(
      `✈️  Skylark API running on http://${config.host}:${config.port} [${config.nodeEnv}]`
    );
    console.log(`   Health: http://${config.host}:${config.port}/api/health`);
    if (isProduction) {
      console.log(`   Frontend: http://${config.host}:${config.port}/`);
    }
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${config.port} is already in use. Set a different PORT in your environment.`
      );
    } else {
      console.error('❌ Server startup error:', err.message);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ Server closed.');
      process.exit(0);
    });
    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;