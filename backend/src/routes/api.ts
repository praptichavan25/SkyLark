import { Router, Request, Response } from 'express';
import { DESTINATIONS, FLEET, FEATURED_FLIGHTS, FlightRoute } from '../data/mockData';

const router = Router();

// Health Check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'Skylark Private Flight Discovery API'
  });
});

// Root API discovery
router.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Skylark Private Flight Discovery API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      fleet: 'GET /api/fleet',
      fleetById: 'GET /api/fleet/:id',
      destinations: 'GET /api/destinations',
      flights: 'GET /api/flights?origin=&destination=&emptyLegOnly=',
      inquiries: 'POST /api/inquiries'
    }
  });
});

// Fleet endpoints
router.get('/fleet', (_req: Request, res: Response) => {
  res.json({
    count: FLEET.length,
    data: FLEET
  });
});

router.get('/fleet/:id', (req: Request, res: Response): void => {
  const targetId = String(req.params.id).toLowerCase();
  const aircraft = FLEET.find(a => a.id.toLowerCase() === targetId);
  if (!aircraft) {
    res.status(404).json({ error: 'Aircraft not found in SkyLark fleet' });
    return;
  }
  res.json({ data: aircraft });
});

// Destinations endpoints
router.get('/destinations', (_req: Request, res: Response) => {
  res.json({
    count: DESTINATIONS.length,
    data: DESTINATIONS
  });
});

// Flights search endpoint
router.get('/flights', (req: Request, res: Response) => {
  const { origin, destination, emptyLegOnly } = req.query;

  let results: FlightRoute[] = [...FEATURED_FLIGHTS];

  if (origin && typeof origin === 'string') {
    const oLower = origin.toLowerCase();
    results = results.filter(
      f =>
        f.origin.code.toLowerCase() === oLower ||
        f.origin.city.toLowerCase().includes(oLower) ||
        f.origin.icao.toLowerCase() === oLower
    );
  }

  if (destination && typeof destination === 'string') {
    const dLower = destination.toLowerCase();
    results = results.filter(
      f =>
        f.destination.code.toLowerCase() === dLower ||
        f.destination.city.toLowerCase().includes(dLower) ||
        f.destination.icao.toLowerCase() === dLower
    );
  }

  if (emptyLegOnly === 'true') {
    results = results.filter(f => f.emptyLeg);
  }

  res.json({
    count: results.length,
    data: results
  });
});

// Charter Inquiry / Booking Request
router.post('/inquiries', (req: Request, res: Response): void => {
  const { name, email, origin, destination, preferredDate, passengers, aircraftPreference, notes } = req.body;

  if (!name || !email || !origin || !destination) {
    res.status(400).json({
      error: 'Missing required inquiry details: name, email, origin, and destination are mandatory.'
    });
    return;
  }

  const inquiryId = `INQ-${Date.now().toString(36).toUpperCase()}`;

  res.status(201).json({
    message: 'Flight inquiry received. A SkyLark flight concierge will contact you within 15 minutes.',
    inquiry: {
      id: inquiryId,
      name,
      email,
      origin,
      destination,
      preferredDate: preferredDate || null,
      passengers: passengers ? Number(passengers) : 1,
      aircraftPreference: aircraftPreference || 'Open Recommendation',
      notes: notes || '',
      receivedAt: new Date().toISOString(),
      status: 'Under Review'
    }
  });
});

export default router;
