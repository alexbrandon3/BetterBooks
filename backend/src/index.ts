import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { AppDataSource } from "./config/data-source";
import routes from "./routes/routes";
import { errorHandler } from "./utils/errors";

// Force-load the .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Environment variables check
console.log("📝 Environment Variables Check:");
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS);
console.log("DB_NAME:", process.env.DB_NAME);

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set in .env file");
  process.exit(1);
}

// Initialize Database Connection
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connection established successfully.");
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  });

// Initialize Express
const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use("/api", routes);

// Global error handler (must be last)
const errorHandlerMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  errorHandler(err, req, res, next);
};
app.use(errorHandlerMiddleware);

// Listen on the defined port
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
