import express from 'express';
import { closeBooks, previewClosingEntries } from '../controllers/books.controller';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types/express';

const router = express.Router();

// POST /books/close - Close books for a period
router.post('/close', authenticate, (req, res) => closeBooks(req as AuthenticatedRequest, res));

// POST /books/preview - Preview closing entries before posting
router.post('/preview', authenticate, (req, res) => previewClosingEntries(req as AuthenticatedRequest, res));

export default router; 