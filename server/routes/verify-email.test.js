/**
 * Tests for the POST /verify-email route of the server.
 *
 * This file contains automated tests that verify the behavior of the email verification endpoint.
 *
 * The tests cover the following cases:
 * - Returns 400 if the token is invalid or expired.
 * - Returns 400 if the user is already verified.
 * - Returns 200 and a JWT token if verification is successful.
 * - Returns 500 on server error.
 *
 * After each test, all users are removed from the database to ensure a clean environment.
 */
import request from "supertest";
import app from "../server.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
});

afterEach(async () => {
    await User.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("POST /verify-email", () => {
    it("devuelve 400 si el token es inválido o expiró", async () => {
        const res = await request(app)
            .post("/verify-email")
            .send({ token: "invalidtoken" });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("devuelve 400 si el usuario ya verificó su email", async () => {
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!",
            isVerified: true,
            verifyToken: "validtoken",
            verifyTokenExpires: Date.now() + 60 * 60 * 1000
        });
        const res = await request(app)
            .post("/verify-email")
            .send({ token: "validtoken" });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("devuelve 200 y un token si la verificación es exitosa", async () => {
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!",
            isVerified: false,
            verifyToken: "validtoken",
            verifyTokenExpires: Date.now() + 60 * 60 * 1000
        });
        const res = await request(app)
            .post("/verify-email")
            .send({ token: "validtoken" });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
    });

    it("devuelve 400 si el token expiró", async () => {
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!",
            isVerified: false,
            verifyToken: "expiredtoken",
            verifyTokenExpires: Date.now() - 1000
        });
        const res = await request(app)
            .post("/verify-email")
            .send({ token: "expiredtoken" });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("devuelve 500 si ocurre un error en el servidor", async () => {
        const origFindOne = User.findOne;
        User.findOne = vi.fn().mockRejectedValue(new Error("DB error"));
        const res = await request(app)
            .post("/verify-email")
            .send({ token: "anytoken" });
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("error");
        User.findOne = origFindOne;
    });
});
