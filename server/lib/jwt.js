import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

/**
 * Generates a JWT token for the given payload.
 * @param {Object} payload - The data to encode in the token.
 * @param {string|number} [expiresIn="1h"] - Token expiration time.
 * @returns {string} The generated JWT token.
 */
export function generateToken(payload, expiresIn = "1h") {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verifies a JWT token and returns the decoded payload if valid.
 * @param {string} token - The JWT token to verify.
 * @returns {Object|null} The decoded payload if valid, otherwise null.
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}