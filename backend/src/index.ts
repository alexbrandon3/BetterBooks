import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import accountRoutes from './routes/accountRoutes';
import { AppDataSource } from './config/database';
import { errorHandler } from './utils/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    logger.info('Database connection established');

    // Register routes
    app.use('/api/accounts', accountRoutes);

    // Error handling middleware
    app.use(errorHandler);

    // Basic route for testing
    app.get('/', (req, res) => {
      res.json({ message: 'Welcome to BetterBooks API' });
    });

    // Start server
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    logger.error('Error during database initialization:', error);
    process.exit(1);
  }); 