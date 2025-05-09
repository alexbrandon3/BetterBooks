// app.ts

import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { AppDataSource } from "./config/data-source";
import routes from "./routes/routes";
import reportRoutes from "./routes/report.routes";
dotenv.config();

console.log("📝 .env Path Check:", require("path").resolve(".env"));

console.log("🔍 Environment Variables Check:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS);
console.log("DB_NAME:", process.env.DB_NAME);

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} request to ${req.originalUrl}`);
  next();
});

app._router.stack.forEach(function (r: any) {
  ``;
  if (r.route && r.route.path) {
    console.log(`🔥 Registered Route: ${r.route.path}`);
  }
});

console.log("🔥 Routes being registered:");
app._router.stack.forEach((r: any) => {
  if (r.route && r.route.path) {
    console.log(`➡️ ${r.route.path}`);
  }
});

console.log("🔥 All Registered Routes:");
app._router.stack.forEach((r: any) => {
  if (r.route && r.route.path) {
    console.log(`➡️ ${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
  }
});

app.use("/api", routes);

console.log("🔥 Mounted Routes:");
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    console.log(
      `➡️ ${Object.keys(middleware.route.methods).join(", ").toUpperCase()} ${
        middleware.route.path
      }`
    );
  }
});

console.log("🔥 Final Route List:");
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    console.log(
      `➡️ [${Object.keys(middleware.route.methods).join(", ").toUpperCase()}] ${
        middleware.route.path
      }`
    );
  }
});

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
