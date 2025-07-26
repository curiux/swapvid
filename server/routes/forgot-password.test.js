/**
 * Tests for the POST /forgot-password route of the server.
 *
 * This file contains automated tests that verify the behavior of the password recovery endpoint.
 *
 * The tests cover the following cases:
 * - Always returns 200, regardless of whether the email exists.
 * - Returns 500 on server error.
 *
 * After each test, all users are removed from the database to ensure a clean environment.
 */
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import forgotPasswordRouter from "./forgot-password.js";
import User from "../models/User.js";

let mongoServer;
let app;

// Mock Mailgun to avoid sending real emails
vi.mock("mailgun.js", () => {
  return {
    default: function () {
      return {
        client: () => ({ messages: { create: vi.fn() } })
      };
    }
  };
});

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
    app = express();
    app.use(express.json());
    app.use("/forgot-password", forgotPasswordRouter);
});

afterEach(async () => {
    await User.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("POST /forgot-password", () => {
    it("devuelve 200 para un email válido (usuario existe)", async () => {
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!"
        });
        const res = await request(app)
            .post("/forgot-password")
            .send({ email: "test@example.com" });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({});
    });

    it("devuelve 200 para un email inexistente", async () => {
        const res = await request(app)
            .post("/forgot-password")
            .send({ email: "noexiste@example.com" });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({});
    });

    it("devuelve 500 si ocurre un error en el servidor", async () => {
        // Simulate error by making User.findOne throw
        const origFindOne = User.findOne;
        User.findOne = vi.fn().mockRejectedValue(new Error("DB error"));
        const res = await request(app)
            .post("/forgot-password")
            .send({ email: "test@example.com" });
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("error");
        User.findOne = origFindOne;
    });
});
