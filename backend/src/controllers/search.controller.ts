import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service';
import { airportService } from '../services/airport.service';
import { AppError } from '../middleware/error.middleware';

export class SearchController {
  /**
   * GET /api/searches/recent
   * Returns recent searches stored in the Stack (DSA 1).
   */
  getRecent(_req: Request, res: Response, next: NextFunction): void {
    try {
      const searches = searchService.getRecentSearches();
      res.json({
        success: true,
        count: searches.length,
        searches,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/searches
   * Stores a search in the Stack.
   */
  saveSearch(req: Request, res: Response, next: NextFunction): void {
    try {
      const { from, to, date } = req.body;

      if (!from || !to || !date) {
        throw new AppError(
          'Missing required search parameters: from, to, and date are required.',
          400,
          'INVALID_SEARCH'
        );
      }

      const fromCode = String(from).trim().toUpperCase();
      const toCode = String(to).trim().toUpperCase();

      if (fromCode === toCode) {
        throw new AppError(
          'Departure and arrival airports must be different.',
          400,
          'INVALID_SEARCH'
        );
      }

      if (!airportService.getAirportByIata(fromCode)) {
        throw new AppError(`Invalid departure airport code "${fromCode}".`, 400, 'INVALID_AIRPORT');
      }

      if (!airportService.getAirportByIata(toCode)) {
        throw new AppError(`Invalid arrival airport code "${toCode}".`, 400, 'INVALID_AIRPORT');
      }

      const saved = searchService.addRecentSearch({
        from: fromCode,
        to: toCode,
        date: String(date).trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Search saved to recent searches',
        search: saved,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/searches/recent
   * Clears recent searches from the Stack.
   */
  clearRecent(_req: Request, res: Response, next: NextFunction): void {
    try {
      searchService.clearRecentSearches();
      res.json({
        success: true,
        message: 'Recent searches cleared',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();
