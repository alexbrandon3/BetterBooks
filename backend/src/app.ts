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
import booksRoutes from './routes/books.routes';

const app = express();

// Simple test endpoint - should be the first route
app.get('/test', (_, res) => {
  res.json({ message: 'Express server is working!', timestamp: new Date().toISOString() });
});

// Security middleware
app.use(helmet());

// CORS configuration - allow all origins for now to debug
app.use(cors({
  origin: true, // Allow all origins
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

// Debug middleware to log all requests
app.use((req, _res, next) => {
  console.log(`🔍 ROUTE DEBUG - ${req.method} ${req.originalUrl}`);
  console.log(`📨 Path: ${req.path}, Base URL: ${req.baseUrl}`);
  console.log(`🌐 Origin: ${req.headers.origin || 'no origin'}`);
  console.log(`🔑 Authorization: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  console.log(`📦 Body: ${JSON.stringify(req.body)}`);
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
console.log('🔧 Mounting books routes at /api/books');
app.use('/api/books', booksRoutes);
console.log('✅ Books routes mounted successfully');

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  console.log(`🔍 404 DEBUG - Path: ${req.path}, Base URL: ${req.baseUrl}`);
  console.log(`📋 404 DEBUG - Available routes: /api/auth, /api/accounts, /api/transactions, /api/recurring-transactions, /api/goals, /api/suggestions, /api/reports, /api/books`);
  res.status(404).json({ 
    message: 'Route not found', 
    path: req.originalUrl,
    method: req.method,
    availableRoutes: ['/api/auth', '/api/accounts', '/api/transactions', '/api/recurring-transactions', '/api/goals', '/api/suggestions', '/api/reports', '/api/books']
  });
});

// Error handling middleware
app.use(errorHandler);

export default app; 