import { Router } from 'express';
import { IndustryPackController } from '../controllers/industryPack.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const industryPackController = new IndustryPackController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Industry Pack Management
router.get('/packs', industryPackController.getIndustryPacks);
router.get('/settings', industryPackController.getIndustryPackSettings);
router.put('/settings', industryPackController.updateIndustryPackSettings);

// Analytics & Testing
router.get('/coverage', industryPackController.getIndustryPackCoverage);
router.get('/metrics', industryPackController.getShadowModeMetrics);
router.post('/test', industryPackController.testIndustryPackRules);

export default router;
