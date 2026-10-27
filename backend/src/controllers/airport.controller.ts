import { Request, Response, NextFunction } from 'express';
import { airportService } from '../services/airport.service';
import { AppError } from '../middleware/error.middleware';

export class AirportController {
  /**
   * GET /api/airports/search?q=mum
   */
  search(req: Request, res: Response, next: NextFunction): void {
    try {
      const q = req.query.q as string;
      if (!q || !q.trim()) {
        throw new AppError('Search query parameter "q" is required.', 400, 'MISSING_QUERY');
      }

      const results = airportService.searchAirports(q);
      res.json({
        success: true,
        count: results.length,
        airports: results,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/airports
   * Returns all supported airports
   */
  getAll(_req: Request, res: Response, next: NextFunction): void {
    try {
      const all = airportService.getAllAirports();
      res.json({
        success: true,
        count: all.length,
        airports: all,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/airports/hierarchy
   * Demonstrates DSA 4: TREE
   */
  getHierarchy(_req: Request, res: Response, next: NextFunction): void {
    try {
      const hierarchy = airportService.getDestinationHierarchy();
      res.json({
        success: true,
        hierarchy,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const airportController = new AirportController();
