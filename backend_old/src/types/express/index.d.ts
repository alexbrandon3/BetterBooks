// src/types/express/index.d.ts
import { User } from "../../entities/User";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
