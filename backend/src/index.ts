import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database.js';
import accountRoutes from './routes/accountRoutes.js';

const app = express();
const port = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/ping', (_req, res) => {
  res.json({ status: 'pong' });
});

// Routes
app.use('/api/accounts', accountRoutes);

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log('Database connection established');
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to database:', error);
  }); 