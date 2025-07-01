import { config } from "dotenv";
config();

export const PORT = 5050;

export const HOST = process.env.HOST;

export const MONGODB_URI = process.env.MONGODB_URI;

export const JWT_SECRET = process.env.JWT_SECRET;

export const SIGHTENGINE_API_SECRET = process.env.SIGHTENGINE_API_SECRET;

import cloudinary from "cloudinary";

cloudinary.config({
  cloud_name: "dbxhjyaiv",
  api_key: "167147264937737",
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export { cloudinary };

export const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;