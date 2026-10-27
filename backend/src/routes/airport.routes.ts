import { Router } from 'express';
import { airportController } from '../controllers/airport.controller';

const router = Router();

// GET /api/airports/search?q=mum
router.get('/search', airportController.search);

// GET /api/airports/hierarchy (DSA 4: Tree destination hierarchy)
router.get('/hierarchy', airportController.getHierarchy);

// GET /api/airports
router.get('/', airportController.getAll);

export default router;
