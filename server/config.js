import { config } from "dotenv";
config();

export const PORT = 5050;

export const MONGODB_URI = process.env.MONGODB_URI;