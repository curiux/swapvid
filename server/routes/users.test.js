/**
 * Tests for the /me route of the server.
 * 
 * This file contains automated tests that verify the behavior of the user profile endpoint.
 * 
 * The tests cover the following cases:
 * GET /me:
 *   - Successful retrieval of user data with a valid token.
 *   - Fails if token is missing.
 *   - Fails if token is invalid.
 *   - Fails if user id in token is invalid.
 * 
 * DELETE /me:
 *   - Successful account deletion with a valid token.
 *   - Fails to delete if token is missing.
 *   - Fails to delete if token is invalid.
 *   - Fails to delete if user id in token is invalid.
 * 
 * After each test, all users are removed from the database to ensure a clean environment.
 */
import request from "supertest";
import app from "../server.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { generateToken } from "../lib/jwt.js";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

let mongoServer;
let userId;
let token;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
});

beforeEach(async () => {
    const user = await User.create({
        email: "test@example.com",
        username: "usuario123",
        password: "Password123!"
    });
    userId = user._id;
    token = generateToken({ _id: user._id });
});

afterEach(async () => {
    await User.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("GET /me", () => {
    it("debería devolver los datos del usuario con un token válido", async () => {
        const res = await request(app).get("/users/me").set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            email: "test@example.com",
            username: "usuario123",
            id: userId.toString()
        });
    });

    it("debería fallar si falta el token", async () => {
        const res = await request(app).get("/users/me");
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el token es inválido", async () => {
        const res = await request(app).get("/users/me").set("Authorization", "Bearer tokeninvalido");
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el id del usuario en el token es inválido", async () => {
        const fakeToken = generateToken({ _id: new mongoose.Types.ObjectId() });
        const res = await request(app).get("/users/me").set("Authorization", `Bearer ${fakeToken}`);
        expect(res.statusCode).toBe(404);
        console.log(res.body.error)
        expect(res.body.error).toMatch(/no existe/i);
    });
});

describe("DELETE /me", () => {
    it("debería eliminar la cuenta del usuario con un token válido", async () => {
        const res = await request(app).delete("/users/me").set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        const user = await User.findById(userId);
        expect(user).toBeNull();
    });

    it("debería fallar si falta el token", async () => {
        const res = await request(app).delete("/users/me");
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el token es inválido", async () => {
        const res = await request(app).delete("/users/me").set("Authorization", "Bearer tokeninvalido");
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el id del usuario en el token es inválido", async () => {
        const fakeToken = generateToken({ _id: new mongoose.Types.ObjectId() });
        const res = await request(app).delete("/users/me").set("Authorization", `Bearer ${fakeToken}`);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/no existe/i);
    });
});
