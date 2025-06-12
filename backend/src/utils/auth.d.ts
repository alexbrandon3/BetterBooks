import { Request } from "express";
import { User } from "../entities/User";

export declare function getUser(req: Request): Promise<User | null>; 