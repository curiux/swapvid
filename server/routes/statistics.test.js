/**
 * Tests for the /statistics route of the server.
 *
 * This file contains automated tests that verify the behavior of the statistics endpoints.
 *
 * The tests cover the following cases:
 * GET /statistics:
 *   - Returns user statistics when authenticated.
 *   - Fails if token is missing.
 *   - Fails if token is invalid.
 *
 * After each test, all users and statistics are removed from the database to ensure a clean environment.
 */
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import statisticsRouter from "./statistics.js";
import User from "../models/User.js";
import Plan from "../models/Plan.js";
import Video from "../models/Video.js";
import { generateToken } from "../lib/jwt.js";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

let mongoServer;
let app;
let token;
let user;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
    app = express();
    app.use(express.json());
    app.use("/statistics", statisticsRouter);
});

beforeEach(async () => {
    const plan = await Plan.create({
        name: "premium",
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

    user = await User.create({
        email: "test@example.com",
        username: "testuser",
        password: "Password123!",
        subscription: {
            plan: plan._id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
    });
    token = generateToken({ _id: user._id });
});

afterEach(async () => {
    await User.deleteMany();
    await Plan.deleteMany();
    await Video.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("GET /statistics", () => {
    it("devuelve estadísticas del usuario cuando está autenticado", async () => {
        const res = await request(app)
            .get("/statistics")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("totalViews");
    });

    it("falla si falta el token", async () => {
        const res = await request(app).get("/statistics");
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("error");
    });

    it("falla si el token es inválido", async () => {
        const res = await request(app)
            .get("/statistics")
            .set("Authorization", "Bearer invalidtoken");
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("error");
    });
});

describe("GET /statistics/videos/:id", () => {
    it("devuelve estadísticas de un video cuando está autenticado", async () => {
        const video = await Video.create({
            title: "Test Video",
            description: "This is a test video description.",
            category: "education",
            keywords: ["test", "video"],
            size: 1024,
            duration: 120,
            users: [user._id]
        });

        const res = await request(app)
            .get(`/statistics/videos/${video._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("title", "Test Video");
        expect(res.body.data).toHaveProperty("exchangesCount", 0);
    });

    it("falla si el video no existe", async () => {
        const res = await request(app)
            .get("/statistics/videos/invalidid")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error", "Id inválido.");
    });

    it("falla si falta el token", async () => {
        const res = await request(app).get("/statistics/videos/12345");
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("error");
    });

    it("falla si el token es inválido", async () => {
        const res = await request(app)
            .get("/statistics/videos/12345")
            .set("Authorization", "Bearer invalidtoken");

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("error");
    });
});