import { Router } from 'express';
import { flightController } from '../controllers/flight.controller';

const router = Router();

// POST /api/flights/search (DSA 2: Queue processing)
router.post('/search', flightController.search);

// GET /api/flights/:id/intelligence (DSA 3: LinkedList journey)
router.get('/:id/intelligence', flightController.getIntelligence);

// GET /api/flights/:id
router.get('/:id', flightController.getById);

export default router;
