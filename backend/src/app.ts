import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './utils/errors';
import authRoutes from './routes/routes';
import accountRoutes from './routes/account.routes';
import transactionRoutes from './routes/transaction.routes';
import recurringRoutes from './routes/recurring.routes';
import goalRoutes from './routes/routes';
import suggestionRoutes from './routes/suggestion.routes';
import reportRoutes from './routes/report.routes';

const app = express();

// Simple test endpoint - should be the first route
app.get('/test', (_, res) => {
  res.json({ message: 'Express server is working!', timestamp: new Date().toISOString() });
});

// Security middleware
app.use(helmet());

// CORS configuration - temporarily permissive for testing
app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins for now
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Logging middleware
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Debug middleware to log all requests
app.use((req, _res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${req.headers.origin || 'no origin'}`);
  console.log(`🔍 Request headers:`, req.headers);
  console.log(`🌐 Request IP: ${req.ip}`);
  next();
});

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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recurring-transactions', recurringRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found', path: req.originalUrl });
});

// Error handling middleware
app.use(errorHandler);

export default app; 