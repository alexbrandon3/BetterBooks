import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './utils/errors';
import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';
import transactionRoutes from './routes/transaction.routes';
import recurringRoutes from './routes/recurring.routes';
import goalRoutes from './routes/routes';
import suggestionRoutes from './routes/suggestion.routes';
import reportRoutes from './routes/report.routes';
import booksRoutes from './routes/books.routes';

const app = express();

// Simple test endpoint - should be the first route
app.get('/test', (_, res) => {
  res.json({ message: 'Express server is working!', timestamp: new Date().toISOString() });
});

// Security middleware
app.use(helmet());

// CORS configuration - restrict to frontend URL only
const allowedOrigins = [
  'https://betterbooks-frontend.onrender.com',
  'http://localhost:3000', // For local development
  'http://localhost:5173'  // Vite dev server
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Logging middleware
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Remove debug middleware in production
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`🔍 ROUTE DEBUG - ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint for debugging
app.get('/', (_, res) => {
  res.json({ message: 'BetterBooks API is running', endpoints: ['/health', '/api/auth', '/api/accounts', '/api/transactions'] });
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'OK', message: 'BetterBooks API is running' });
});

// Test endpoint to manually trigger recurring transaction job
app.get('/test-recurring-job', (_, res) => {
  const { RecurringTransactionJob } = require('./services/recurringTransactionJob');
  const job = new RecurringTransactionJob();
  job['processRecurringTransactions']().then(() => {
    res.json({ message: 'Recurring transaction job executed manually' });
  }).catch((error: any) => {
    res.status(500).json({ error: 'Failed to execute recurring transaction job', details: error.message });
  });
});

// Handle preflight requests
app.options('*', cors());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recurring-transactions', recurringRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/books', booksRoutes);

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found', 
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use(errorHandler);

export default app; 