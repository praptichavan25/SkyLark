import { Router } from 'express';
import { searchController } from '../controllers/search.controller';

const router = Router();

// GET /api/searches/recent (DSA 1: Stack)
router.get('/recent', searchController.getRecent);

// POST /api/searches (DSA 1: Stack)
router.post('/', searchController.saveSearch);

// DELETE /api/searches/recent (DSA 1: Stack)
router.delete('/recent', searchController.clearRecent);

export default router;
