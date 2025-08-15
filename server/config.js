import { config } from "dotenv";
config();

export const PORT = 5050;

export const HOST = process.env.HOST;

export const API_HOST = process.env.API_HOST;

export const MONGODB_URI = process.env.MONGODB_URI;

export const JWT_SECRET = process.env.JWT_SECRET;

export const SIGHTENGINE_API_SECRET = process.env.SIGHTENGINE_API_SECRET;

import cloudinary from "cloudinary";

export const CLOUDINARY_CLOUD_NAME = "dbxhjyaiv";
export const CLOUDINARY_API_KEY = "167147264937737";
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

export { cloudinary };

export const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

export const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;

export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

export const TEST_EMAIL = process.env.TEST_EMAIL || "";

export const isProduction = process.env.NODE_ENV === "production";