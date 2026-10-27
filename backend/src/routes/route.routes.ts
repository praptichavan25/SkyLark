import { Router, Request, Response, NextFunction } from 'express';
import { airportService } from '../services/airport.service';
import { routeEngineService, RouteCalculationInput } from '../services/routeEngine.service';
import { FLEET } from '../data/mockData';

const router = Router();

/**
 * GET /api/routes
 * Demonstrates DSA 5: GRAPH
 * Returns airport vertices (nodes) and direct flight connections (edges).
 */
router.get('/', (_req: Request, res: Response, next: NextFunction): void => {
  try {
    const graphData = airportService.getRouteGraph();
    res.json({
      success: true,
      nodes: graphData.nodes,
      edges: graphData.edges,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/routes/aircraft
 * Returns the 3 canonical aircraft models with complete technical specifications.
 */
router.get('/aircraft', (_req: Request, res: Response): void => {
  const selectableFleet = FLEET.slice(0, 3);
  res.json({
    success: true,
    count: selectableFleet.length,
    aircraft: selectableFleet,
  });
});

/**
 * POST /api/routes/calculate
 * Validates the ordered route sequence and generates consecutive flight legs.
 * Supports zero, one, two, or multiple stopovers with strict sequence ordering.
 */
router.post('/calculate', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { origin, destination, stopovers, aircraftId } = req.body as RouteCalculationInput;

    if (!origin || typeof origin !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_ORIGIN',
          message: 'Origin airport IATA code is required.',
        },
      });
      return;
    }

    if (!destination || typeof destination !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DESTINATION',
          message: 'Destination airport IATA code is required.',
        },
      });
      return;
    }

    const route = routeEngineService.buildOrderedRoute({
      origin,
      destination,
      stopovers,
      aircraftId,
    });

    res.json({
      success: true,
      route,
    });
  } catch (err: any) {
    const message = err.message || 'Route calculation failed.';
    let code = 'ROUTE_CALCULATION_ERROR';
    let statusCode = 400;

    if (message.includes('INVALID_AIRPORT')) code = 'INVALID_AIRPORT';
    else if (message.includes('INVALID_AIRCRAFT')) code = 'INVALID_AIRCRAFT';
    else if (message.includes('CONSECUTIVE_DUPLICATES')) code = 'CONSECUTIVE_DUPLICATES';
    else if (message.includes('INSUFFICIENT_STOPS')) code = 'INSUFFICIENT_STOPS';

    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }
});

/**
 * POST /api/routes/save
 * Persists an ordered route into the server store.
 */
router.post('/save', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const input = req.body as RouteCalculationInput;
    const route = routeEngineService.buildOrderedRoute(input);
    res.status(201).json({
      success: true,
      message: 'Route configuration persisted successfully.',
      route,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ROUTE_SAVE_ERROR',
        message: err.message,
      },
    });
  }
});

/**
 * GET /api/routes/:id
 * Retrieves a persisted ordered route by ID.
 */
router.get('/:id', (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const route = routeEngineService.getRouteById(id);

  if (!route) {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route with ID "${id}" was not found.`,
      },
    });
    return;
  }

  res.json({
    success: true,
    route,
  });
});

export default router;
