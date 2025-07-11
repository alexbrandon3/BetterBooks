import express from 'express';
import { closeBooks, previewClosingEntries } from '../controllers/books.controller';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types/express';

const router = express.Router();

// Debug middleware for books routes
router.use((_, __, next) => {
  console.log(`📚 BOOKS ROUTE DEBUG - ${_.method} ${_.path}`);
  console.log(`🔍 Books route hit: ${_.originalUrl}`);
  next();
});

// Test endpoint to verify books routes are mounted
router.get('/test', (_, res) => {
  console.log(`✅ BOOKS TEST ENDPOINT - Hit successfully`);
  res.json({ 
    message: 'Books routes are working!', 
    timestamp: new Date().toISOString(),
    availableEndpoints: ['/api/books/preview', '/api/books/close', '/api/books/test']
  });
});

// POST /books/close - Close books for a period
router.post('/close', authenticate, (req, res) => {
  console.log(`🔐 CLOSE BOOKS - Authenticated request received`);
  closeBooks(req as AuthenticatedRequest, res);
});

// POST /books/preview - Preview closing entries before posting
router.post('/preview', authenticate, (req, res) => {
  console.log(`🔐 PREVIEW CLOSING - Authenticated request received`);
  previewClosingEntries(req as AuthenticatedRequest, res);
});

export default router; 