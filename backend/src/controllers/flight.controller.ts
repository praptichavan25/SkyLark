import { Request, Response, NextFunction } from 'express';
import { flightService } from '../services/flight.service';
import { searchService } from '../services/search.service';
import { AppError } from '../middleware/error.middleware';

export class FlightController {
  /**
   * POST /api/flights/search
   *
   * Validates:
   *  - from / origin required (3-letter IATA)
   *  - to / destination required (3-letter IATA)
   *  - date required (YYYY-MM-DD)
   *  - from and to cannot be identical
   *
   * Flow: Uses Queue during processing, records search in Stack.
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawFrom = req.body.from || req.body.origin;
      const rawTo = req.body.to || req.body.destination;
      const rawDate = req.body.date || req.body.departureDate;
      const { sortBy, airline, stops } = req.body;

      if (!rawFrom || typeof rawFrom !== 'string' || !rawFrom.trim()) {
        throw new AppError('Departure airport (from/origin) is required.', 400, 'INVALID_SEARCH');
      }

      if (!rawTo || typeof rawTo !== 'string' || !rawTo.trim()) {
        throw new AppError('Arrival airport (to/destination) is required.', 400, 'INVALID_SEARCH');
      }

      if (!rawDate || typeof rawDate !== 'string' || !rawDate.trim()) {
        throw new AppError('Departure date is required.', 400, 'INVALID_SEARCH');
      }

      const fromCode = rawFrom.trim().toUpperCase();
      const toCode = rawTo.trim().toUpperCase();

      if (fromCode === toCode) {
        throw new AppError(
          'Departure and arrival airports must be different.',
          400,
          'INVALID_SEARCH'
        );
      }

      // Validate 3-letter IATA format
      if (!/^[A-Z]{3}$/.test(fromCode)) {
        throw new AppError(
          `Invalid departure airport code "${fromCode}". Expected 3-letter IATA code.`,
          400,
          'INVALID_AIRPORT'
        );
      }

      if (!/^[A-Z]{3}$/.test(toCode)) {
        throw new AppError(
          `Invalid arrival airport code "${toCode}". Expected 3-letter IATA code.`,
          400,
          'INVALID_AIRPORT'
        );
      }

      // Validate date format (YYYY-MM-DD or standard parseable ISO)
      const parsedDate = new Date(rawDate.trim());
      if (isNaN(parsedDate.getTime())) {
        throw new AppError('Invalid date format. Expected YYYY-MM-DD.', 400, 'INVALID_DATE');
      }
      const formattedDate = rawDate.trim().includes('T')
        ? rawDate.trim().split('T')[0]
        : rawDate.trim();

      // Record to recent searches stack (DSA 1: Stack)
      searchService.addRecentSearch({ from: fromCode, to: toCode, date: formattedDate });

      // Process search asynchronously using Queue (DSA 2: Queue)
      const results = await flightService.searchFlights({
        from: fromCode,
        to: toCode,
        date: formattedDate,
        sortBy,
        airline,
        stops: typeof stops === 'number' ? stops : undefined,
      });

      res.json({
        success: true,
        provider: results.provider,
        query: {
          from: fromCode,
          to: toCode,
          date: formattedDate,
        },
        count: results.count,
        flights: results.flights,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/flights/:id
   */
  getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const flight = flightService.getFlightById(id);
      if (!flight) {
        throw new AppError(`Flight with ID "${id}" not found.`, 404, 'FLIGHT_NOT_FOUND');
      }

      res.json({
        success: true,
        flight,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/flights/:id/intelligence
   * Uses LinkedList (DSA 3) to represent journey
   */
  getIntelligence(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const intelligence = flightService.getFlightIntelligence(id);
      if (!intelligence) {
        throw new AppError(
          `Flight intelligence for ID "${id}" not found.`,
          404,
          'FLIGHT_NOT_FOUND'
        );
      }

      res.json({
        success: true,
        intelligence,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const flightController = new FlightController();
