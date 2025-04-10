import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
} from '../controllers/documentController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);

export default router; 