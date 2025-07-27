/**
 * Tests for the POST /send-email-link route of the server.
 *
 * This file contains automated tests that verify the behavior of the email verification link endpoint.
 *
 * The tests cover the following cases:
 * - Returns 404 if the user does not exist.
 * - Returns 400 if the user is already verified.
 * - Returns 400 if a token was already sent and is not expired.
 * - Returns 200 and sends a verification email if all is valid.
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

// Mock sendVerificationEmail to avoid sending real emails
vi.mock("../lib/utils.js", async () => {
    const actual = await vi.importActual("../lib/utils.js");
    return {
        ...actual,
        sendVerificationEmail: vi.fn()
    };
});

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

describe("POST /send-email-link", () => {
    it("devuelve 404 si el usuario no existe", async () => {
        const res = await request(app)
            .post("/send-email-link")
            .send({ email: "noexiste@example.com" });
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty("error");
    });

    it("devuelve 400 si el usuario ya verificó su email", async () => {
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!",
            isVerified: true
        });
        const res = await request(app)
            .post("/send-email-link")
            .send({ email: "test@example.com" });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("devuelve 400 si ya se envió un token y no expiró", async () => {
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!",
            isVerified: false,
            verifyToken: "sometoken",
            verifyTokenExpires: Date.now() + 60 * 60 * 1000
        });
        const res = await request(app)
            .post("/send-email-link")
            .send({ email: "test@example.com" });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body).toHaveProperty("expires");
    });

    it("devuelve 200 y envía el email si todo es válido", async () => {
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!",
            isVerified: false
        });
        const res = await request(app)
            .post("/send-email-link")
            .send({ email: "test@example.com" });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({});
    });

    it("devuelve 500 si ocurre un error en el servidor", async () => {
        const origFindOne = User.findOne;
        User.findOne = vi.fn().mockRejectedValue(new Error("DB error"));
        const res = await request(app)
            .post("/send-email-link")
            .send({ email: "test@example.com" });
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("error");
        User.findOne = origFindOne;
    });
});
