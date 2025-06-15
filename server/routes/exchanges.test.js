/**
 * Tests for the /exchanges route of the server.
 * 
 * This file contains automated tests that verify the behavior of the exchange endpoints.
 * 
 * The tests cover the following cases:
 * POST /exchanges/request:
 *   - Successful creation of an exchange request with valid data and authentication.
 *   - Fails if token is missing.
 *   - Fails if token is invalid.
 *   - Fails if responder username does not exist.
 *   - Fails if responderVideo is missing.
 *   - Fails if responderVideo does not belong to responder.
 *   - Fails if a pending request already exists between users.
 * 
 * GET /exchanges/:id:
 *   - Allows initiator or responder to retrieve the exchange if authorized.
 *   - Fails if token is missing.
 *   - Fails if token is invalid.
 *   - Fails if user is not part of the exchange.
 *   - Fails if the exchange does not exist.
 *   - Fails if the user does not exist.
 *   - Fails if the id is invalid.
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

    it("debería fallar si ya existe una petición pendiente entre los usuarios", async () => {
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
        await Exchange.create({
            initiator: initiatorId,
            responder: responderId,
            responderVideo: video._id,
            status: "pending"
        });
        const res = await request(app)
            .post("/exchanges/request")
            .set("Authorization", `Bearer ${token}`)
            .send({ username: "responder", videoId: video._id.toString() });
        expect(res.statusCode).toBe(409);
        expect(res.body.error).toMatch(/pendiente/i);
    });
});

describe("GET /exchanges/:id", () => {
    let exchangeId, Video, video;
    beforeEach(async () => {
        Video = (await import("../models/Video.js")).default;
        video = await Video.create({
            title: "Video de prueba",
            description: "Descripción de prueba",
            category: "entretenimiento",
            keywords: ["prueba"],
            users: [responderId],
            url: "http://test.com/video.mp4"
        });
        await User.findByIdAndUpdate(responderId, { $push: { videos: video._id } });
        const exchange = await Exchange.create({
            initiator: initiatorId,
            responder: responderId,
            responderVideo: video._id,
            status: "pending"
        });
        exchangeId = exchange._id;
        await User.findByIdAndUpdate(initiatorId, { $push: { exchanges: exchange._id } });
        await User.findByIdAndUpdate(responderId, { $push: { exchanges: exchange._id } });
    });

    it("debería permitir al iniciador obtener el intercambio", async () => {
        const res = await request(app)
            .get(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.user).toBe("initiator");
        expect(res.body.data.responderVideo.toString()).toBe(video._id.toString());
    });

    it("debería permitir al receptor obtener el intercambio", async () => {
        const responderToken = generateToken({ _id: responderId });
        const res = await request(app)
            .get(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${responderToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.user).toBe("responder");
    });

    it("debería fallar si falta el token", async () => {
        const res = await request(app).get(`/exchanges/${exchangeId}`);
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el token es inválido", async () => {
        const res = await request(app)
            .get(`/exchanges/${exchangeId}`)
            .set("Authorization", "Bearer tokeninvalido");
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el usuario no es parte del intercambio", async () => {
        const outsider = await User.create({
            email: "outsider@example.com",
            username: "outsider",
            password: "Password123!"
        });
        const outsiderToken = generateToken({ _id: outsider._id });
        const res = await request(app)
            .get(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${outsiderToken}`);
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/acceso/i);
    });

    it("debería fallar si el intercambio no existe", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/exchanges/${fakeId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/no existe/i);
    });

    it("debería fallar si el usuario no existe", async () => {
        const fakeToken = generateToken({ _id: new mongoose.Types.ObjectId() });
        const res = await request(app)
            .get(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${fakeToken}`);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/no existe/i);
    });

    it("debería fallar si el id es inválido", async () => {
        const res = await request(app)
            .get("/exchanges/invalidid")
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/inválido/i);
    });
});
