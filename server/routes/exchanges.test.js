/**
 * Tests for the /request route of the exchanges API.
 *
 * This file contains automated tests that verify the behavior of the exchange request endpoint.
 *
 * The tests cover the following cases:
 * POST /exchanges/request:
 *   - Successful creation of an exchange request with valid data and authentication.
 *   - Fails if token is missing.
 *   - Fails if token is invalid.
 *   - Fails if responder username does not exist.
 *   - Fails if responderVideo is missing.
 *   - Fails if responderVideo does not belong to responder.
 *
 * After each test, all users and exchanges are removed from the database to ensure a clean environment.
 */
import request from "supertest";
import app from "../server.js";
import User from "../models/User.js";
import Exchange from "../models/Exchange.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { generateToken } from "../lib/jwt.js";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

let mongoServer;
let initiatorId, responderId, token;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
});

beforeEach(async () => {
    // Create initiator and responder users
    const initiator = await User.create({
        email: "initiator@example.com",
        username: "initiator",
        password: "Password123!"
    });
    initiatorId = initiator._id;
    token = generateToken({ _id: initiator._id });

    const responder = await User.create({
        email: "responder@example.com",
        username: "responder",
        password: "Password123!"
    });
    responderId = responder._id;
});

afterEach(async () => {
    await User.deleteMany();
    await Exchange.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("POST /exchanges/request", () => {
    it("debería crear una solicitud de intercambio con datos y autenticación válidos", async () => {
        // Create a dummy video owned by responder
        const Video = (await import("../models/Video.js")).default;
        const video = await Video.create({
            title: "Video de prueba",
            description: "Descripción de prueba",
            category: "entretenimiento",
            keywords: ["prueba"],
            users: [responderId],
            url: "http://test.com/video.mp4"
        });
        await User.findByIdAndUpdate(responderId, { $push: { videos: video._id } });

        const res = await request(app)
            .post("/exchanges/request")
            .set("Authorization", `Bearer ${token}`)
            .send({ username: "responder", videoId: video._id.toString() });
        expect(res.statusCode).toBe(201);
        const exchange = await Exchange.findOne({ responder: responderId });
        expect(exchange).toBeTruthy();
        expect(exchange.initiator.toString()).toBe(initiatorId.toString());
        expect(exchange.responder.toString()).toBe(responderId.toString());
        expect(exchange.responderVideo.toString()).toBe(video._id.toString());
    });

    it("debería fallar si falta el token", async () => {
        const res = await request(app)
            .post("/exchanges/request")
            .send({ username: "responder", videoId: "someid" });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el token es inválido", async () => {
        const res = await request(app)
            .post("/exchanges/request")
            .set("Authorization", "Bearer invalidtoken")
            .send({ username: "responder", videoId: "someid" });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el nombre de usuario del receptor no existe", async () => {
        const res = await request(app)
            .post("/exchanges/request")
            .set("Authorization", `Bearer ${token}`)
            .send({ username: "noexiste", videoId: "someid" });
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/no existe/i);
    });

    it("debería fallar si falta responderVideo", async () => {
        const res = await request(app)
            .post("/exchanges/request")
            .set("Authorization", `Bearer ${token}`)
            .send({ username: "responder" });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si responderVideo no pertenece al receptor", async () => {
        // Create a dummy video not owned by responder
        const Video = (await import("../models/Video.js")).default;
        const video = await Video.create({
            title: "Video ajeno",
            description: "Descripción de prueba",
            category: "entretenimiento",
            keywords: ["prueba"],
            users: [initiatorId],
            url: "http://test.com/video.mp4"
        });
        const res = await request(app)
            .post("/exchanges/request")
            .set("Authorization", `Bearer ${token}`)
            .send({ username: "responder", videoId: video._id.toString() });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/no pertenece/i);
    });
});
