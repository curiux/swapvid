/**
 * Tests for the POST /reset-password route of the server.
 *
 * This file contains automated tests that verify the behavior of the password reset endpoint.
 *
 * The tests cover the following cases:
 * - Success with valid token and valid password.
 * - Fails if the token is invalid or expired.
 * - Fails if the password does not meet validation.
 * - Fails if an unexpected error occurs.
 *
 * After each test, all users are removed from the database to ensure a clean environment.
 */
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import resetPasswordRouter from "./reset-password.js";
import User from "../models/User.js";

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
    app = express();
    app.use(express.json());
    app.use("/reset-password", resetPasswordRouter);
});

afterEach(async () => {
    await User.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("POST /reset-password", () => {
    it("restablece la contraseña con token válido y contraseña válida", async () => {
        const token = "validtoken";
        const expiration = Date.now() + 60 * 60 * 1000;
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!",
            resetToken: token,
            resetTokenExpires: expiration
        });
        const res = await request(app)
            .post("/reset-password")
            .send({ token, password: "NuevaPassword123!" });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({});
        const user = await User.findOne({ email: "test@example.com" });
        expect(user.resetToken).toBeUndefined();
        expect(user.resetTokenExpires).toBeUndefined();
    });

    it("devuelve 400 si el token es inválido o ha expirado", async () => {
        const token = "expiredtoken";
        const expiration = Date.now() - 1000; // Expired
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!",
            resetToken: token,
            resetTokenExpires: expiration
        });
        const res = await request(app)
            .post("/reset-password")
            .send({ token, password: "NuevaPassword123!" });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("devuelve 400 si la contraseña no cumple validación", async () => {
        const token = "validtoken2";
        const expiration = Date.now() + 60 * 60 * 1000;
        // Assuming the User model requires at least 8 characters
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!",
            resetToken: token,
            resetTokenExpires: expiration
        });
        const res = await request(app)
            .post("/reset-password")
            .send({ token, password: "123" }); // Demasiado corta
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("devuelve 500 si ocurre un error inesperado", async () => {
        // Simulate error by making User.findOne throw exception
        const origFindOne = User.findOne;
        User.findOne = vi.fn().mockRejectedValue(new Error("DB error"));
        const res = await request(app)
            .post("/reset-password")
            .send({ token: "token", password: "NuevaPassword123!" });
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("error");
        User.findOne = origFindOne;
    });
});
