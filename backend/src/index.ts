import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source';
import accountRoutes from './routes/account.routes';
import authRoutes from './routes/auth.routes';

// load the root .env file one level up`



const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api', authRoutes); // Handles /register and /login

// Health check
app.get('/api/ping', (_, res) => res.send('pong'));

// Start server
const PORT = parseInt(process.env.PORT || '3004', 10);

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
  });
