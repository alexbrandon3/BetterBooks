import { errorHandler } from "./utils/errors";
import app from "./app";  // Import the configured app
import dotenv from "dotenv";
import path from "path";
import { AppDataSource } from "./config/data-source";
import { startRecurringTransactionJob } from "./services/recurringTransactionJob";

// Force-load the .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Environment variables check
console.log("📝 Environment Variables Check:");
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
// console.log("DB_HOST:", process.env.DB_HOST);
// console.log("DB_PORT:", process.env.DB_PORT);
// console.log("DB_USER:", process.env.DB_USER);
// console.log("DB_PASS:", process.env.DB_PASS);
// console.log("DB_NAME:", process.env.DB_NAME);

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set in .env file");
  process.exit(1);
}

// More flexible port detection
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 10000;

console.log(`🔧 Starting server on port: ${PORT}`);
// console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
// console.log(`🔧 Process ID: ${process.pid}`);
console.log(`🔧 All environment variables:`, Object.keys(process.env).filter(key => key.includes('PORT') || key.includes('RENDER')));

// Initialize Database Connection
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connection established successfully.");
    
    // Start the server only after database connection is established
    const server = app.listen(PORT, '0.0.0.0', () => {
      const address = server.address();
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🔍 Server address:`, address);
      console.log(`🌐 Server is listening on all interfaces`);
      console.log(`📡 Ready to accept connections`);
    });
    
    // Add error handling for the server
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });
    
    server.on('connection', (socket) => {
      console.log('🔌 New connection from:', socket.remoteAddress);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    // Start recurring transaction job
    startRecurringTransactionJob();
    console.log("✅ Recurring transaction job started");
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  });

// Global error handler (must be last)
app.use(errorHandler);
