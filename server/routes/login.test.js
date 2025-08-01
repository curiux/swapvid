/**
 * Tests for the POST /login route of the server.
 * 
 * This file contains automated tests that verify the behavior of the user login endpoint.
 * 
 * The tests cover the following cases:
 * - Successful login with email and password, expecting a token in the response.
 * - Successful login with username and password, expecting a token in the response.
 * - Fails if email and username are missing.
 * - Fails if the password is incorrect.
 * - Fails if the email does not exist.
 * - Fails if the username does not exist.
 * - Fails if email is null.
 * - Fails if username is null.
 * 
 * After each test, all users are removed from the database to ensure a clean environment.
 */
import request from "supertest";
import app from "../server.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
});

beforeEach(async () => {
    await User.create({
        isVerified: true,
        email: "test@example.com",
        username: "usuario123",
        password: "Password123!"
    });
});

afterEach(async () => {
    await User.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("POST /login", () => {
    it("debería iniciar sesión con email y contraseña correctos", async () => {
        const res = await request(app).post("/login").send({
            email: "test@example.com",
            password: "Password123!"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it("debería iniciar sesión con nombre de usuario y contraseña correctos", async () => {
        const res = await request(app).post("/login").send({
            username: "usuario123",
            password: "Password123!"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    it("debería fallar si faltan email y nombre de usuario", async () => {
        const res = await request(app).post("/login").send({
            password: "Password123!"
        });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/credenciales/i);
    });

    it("debería fallar si la contraseña es incorrecta", async () => {
        const res = await request(app).post("/login").send({
            email: "test@example.com",
            password: "WrongPassword!"
        });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/credenciales/i);
    });

    it("debería fallar si el email no existe", async () => {
        const res = await request(app).post("/login").send({
            email: "noexiste@example.com",
            password: "Password123!"
        });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/credenciales/i);
    });

    it("debería fallar si el nombre de usuario no existe", async () => {
        const res = await request(app).post("/login").send({
            username: "noexiste",
            password: "Password123!"
        });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/credenciales/i);
    });

    it("debería fallar si el email es null", async () => {
        const res = await request(app).post("/login").send({
            email: null,
            password: "Password123!"
        });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/credenciales/i);
    });

    it("debería fallar si el nombre de usuario es null", async () => {
        const res = await request(app).post("/login").send({
            username: null,
            password: "Password123!"
        });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/credenciales/i);
    });
});
