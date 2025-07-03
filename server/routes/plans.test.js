/**
 * Tests for the /plans route of the server.
 *
 * This file contains automated tests that verify the behavior of the plans endpoints.
 *
 * The tests cover the following cases:
 * GET /plans:
 *   - Returns all available plans.
 *   - Handles server/database errors gracefully.
 *
 * After each test, all plans are removed from the database to ensure a clean environment.
 */
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import plansRouter from "./plans.js";
import Plan from "../models/Plan.js";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

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
    app.use("/plans", plansRouter);
});

afterEach(async () => {
    await Plan.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("GET /plans", () => {
    it("devuelve todos los planes disponibles", async () => {
        await Plan.create([
            {
                name: "basic",
                monthlyPrice: 10,
                libraryStorage: 1000000000,
                librarySize: 10,
                videoMaxSize: 50000000,
                exchangeLimit: 5,
                stats: false,
                exchangePriority: false,
                searchPriority: false,
                supportPriority: false,
                preApprovalId: "pre-123"
            },
            {
                name: "premium",
                monthlyPrice: 20,
                libraryStorage: 5000000000,
                librarySize: 50,
                videoMaxSize: 100000000,
                exchangeLimit: 20,
                stats: true,
                exchangePriority: true,
                searchPriority: true,
                supportPriority: true,
                preApprovalId: "pre-456"
            }
        ]);
        const res = await request(app).get("/plans");
        expect(res.statusCode).toBe(200);
        expect(res.body.plans).toBeInstanceOf(Array);
        expect(res.body.plans.length).toBe(2);
        expect(res.body.plans[0]).not.toHaveProperty("__v");
        expect(res.body.plans[0]).toHaveProperty("name");
        expect(res.body.plans[0]).toHaveProperty("monthlyPrice");
    });

    it("maneja errores del servidor", async () => {
        // Simulate a database error
        vi.spyOn(Plan, "find").mockImplementationOnce(() => { throw new Error("DB error"); });
        const res = await request(app).get("/plans");
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toMatch(/error/i);
    });
});
