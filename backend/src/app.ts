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

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173',
    'https://betterbooks-frontend.onrender.com',
    'https://*.onrender.com'
  ], // Allow both React dev server, Vite, and Render domains
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recurring-transactions', recurringRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'OK', message: 'BetterBooks API is running' });
});

// Error handling middleware
app.use(errorHandler);

export default app; 