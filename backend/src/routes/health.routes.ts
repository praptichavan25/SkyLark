import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

/**
 * GET /api/health
 *
 * Used by Render as the health check endpoint.
 * Returns HTTP 200 with JSON payload while the server is running.
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'Skylark API',
    version: '1.0.0',
    environment: config.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    features: {
      routeEngine: true,
      aircraftFleet: 3,
      aviationstackConfigured: Boolean(
        config.aviationstackApiKey && config.aviationstackApiKey.trim().length > 0
      ),
    },
    persistence: {
      type: 'in-memory',
      note: 'Route data is stored in process memory and does not persist across restarts.',
    },
  });
});

export default router;
