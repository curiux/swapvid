/**
 * Tests for the POST /register route of the server.
 * 
 * This file contains automated tests that verify the behavior of the user registration endpoint.
 * 
 * The tests cover the following cases:
 * - Successful registration of a new user, expecting the user's email for sending a verification email.
 * - Fails if email is missing.
 * - Fails if the email is already registered.
 * - Fails if username is missing.
 * - Fails if the username is already registered.
 * - Fails if the password is too short.
 * - Fails if the email is not valid.
 * - Fails if all fields are empty.
 * - Fails if the email is null.
 * - Fails if the username is null.
 * 
 * After each test, all users are removed from the database to ensure a clean environment.
 */
import request from "supertest";
import app from "../server.js";
import User from "../models/User.js";
import Plan from "../models/Plan.js";
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
    await Plan.create({
        name: "basic",
        monthlyPrice: 0,
        libraryStorage: 1000000000,
        librarySize: 10,
        videoMaxSize: 50000000,
        exchangeLimit: 5,
        stats: false,
        exchangePriority: false,
        searchPriority: false,
        supportPriority: false
    });
});

afterEach(async () => {
    await User.deleteMany();
    await Plan.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("POST /register", () => {
    it("debería registrar un nuevo usuario", async () => {
        const res = await request(app).post("/register").send({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!"
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.email).toBeDefined();
    });

    it("debería fallar si falta el email", async () => {
        const res = await request(app).post("/register").send({
            username: "usuario123",
            password: "Password123!"
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/email/i);
    });

    it("debería fallar si el email ya está registrado", async () => {
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!"
        });

        const res = await request(app).post("/register").send({
            email: "test@example.com",
            username: "nuevo123",
            password: "Password123!"
        });

        expect(res.statusCode).toBe(409);
        expect(res.body.field).toBe("email");
    });

    it("debería fallar si falta el nombre de usuario", async () => {
        const res = await request(app).post("/register").send({
            email: "test@example.com",
            password: "Password123!"
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/nombre de usuario/i);
    });

    it("debería fallar si el nombre de usuario ya está registrado", async () => {
        await User.create({
            email: "test@example.com",
            username: "usuario123",
            password: "Password123!"
        });
        const res = await request(app).post("/register").send({
            email: "test2@example.com",
            username: "usuario123",
            password: "Password123!"
        });

        expect(res.statusCode).toBe(409);
        expect(res.body.field).toBe("username");
    });

    it("debería fallar si la contraseña es demasiado corta", async () => {
        const res = await request(app).post("/register").send({
            email: "test@example.com",
            username: "usuario123",
            password: "123"
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/contraseña/i);
    });

    it("debería fallar si el email no es válido", async () => {
        const res = await request(app).post("/register").send({
            email: "noesunemail",
            username: "usuario123",
            password: "Password123!"
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/email/i);
    });

    it("debería fallar si todos los campos están vacíos", async () => {
        const res = await request(app).post("/register").send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/email/i);
        expect(res.body.error).toMatch(/nombre de usuario/i);
        expect(res.body.error).toMatch(/contraseña/i);
    });

    it("debería fallar si el email es null", async () => {
        const res = await request(app).post("/register").send({
            email: null,
            username: "usuario123",
            password: "Password123!"
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/email/i);
    });

    it("debería fallar si el nombre de usuario es null", async () => {
        const res = await request(app).post("/register").send({
            email: "test@example.com",
            username: null,
            password: "Password123!"
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/nombre de usuario/i);
    });
});