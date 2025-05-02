import { Router } from 'express';
import { suggestAccount } from '../controllers/suggestion.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, suggestAccount);

export default router;
