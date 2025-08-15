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
 * PATCH /exchanges/:id:
 *   - Allows responder to accept or reject an exchange.
 *   - Fails if token is missing.
 *   - Fails if token is invalid.
 *   - Fails if the user is not the responder.
 *   - Fails if the exchange is not pending.
 *   - Fails if video is missing when accepting.
 *   - Fails if status is invalid.
 *   - Fails if the exchange does not exist.
 *   - Fails if the user does not exist.
 * 
 * DELETE /exchanges/:id:
 *   - Allows initiator to delete a pending exchange.
 *   - Fails if token is missing.
 *   - Fails if token is invalid.
 *   - Fails if the user is not the initiator.
 *   - Fails if the exchange is not pending.
 *   - Fails if the exchange does not exist.
 *   - Fails if the user does not exist.
 * 
 * POST /exchanges/:id/report:
 *   - Allows initiator or responder to report the exchanged video with a valid reason.
 *   - Supports all valid reasons: inappropriate_unmarked, irrelevant_or_empty, unauthorized_content, duplicate_video, other (with otherReason).
 *   - Fails if token is missing.
 *   - Fails if token is invalid.
 *   - Fails if user is not part of the exchange.
 *   - Fails if the exchange is not accepted.
 *   - Fails if the reason is missing or invalid.
 *   - Fails if the user does not exist.
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
import Plan from "../models/Plan.js";

let mongoServer;
let initiatorId, responderId, token;
let plan;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
});

beforeEach(async () => {
    await (await import("../models/User.js")).default.deleteMany();
    await Exchange.deleteMany();
    await Plan.deleteMany();
    plan = await Plan.create({
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
    // Create initiator and responder users
    const User = (await import("../models/User.js")).default;
    const initiator = await User.create({
        email: "initiator@example.com",
        username: "initiator",
        password: "Password123!",
        subscription: { plan: plan._id }
    });
    initiatorId = initiator._id;
    token = generateToken({ _id: initiator._id });

    const responder = await User.create({
        email: "responder@example.com",
        username: "responder",
        password: "Password123!",
        subscription: { plan: plan._id }
    });
    responderId = responder._id;
});

afterEach(async () => {
    await (await import("../models/User.js")).default.deleteMany();
    await Exchange.deleteMany();
    await Plan.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("POST /exchanges/request", () => {
    it("debería crear una solicitud de intercambio con datos y autenticación válidos", async () => {
        const Video = (await import("../models/Video.js")).default;

        const initiatorVideo = await Video.create({
            title: "Video del iniciador",
            description: "Video del usuario iniciador",
            category: "entertainment",
            keywords: ["iniciador"],
            users: [initiatorId],
            url: "http://test.com/video-iniciador.mp4",
            size: 54321,
            duration: 100
        });
        await User.findByIdAndUpdate(initiatorId, { $push: { videos: initiatorVideo._id } });

        const video = await Video.create({
            title: "Video de prueba",
            description: "Descripción de prueba",
            category: "entertainment",
            keywords: ["prueba"],
            users: [responderId],
            url: "http://test.com/video.mp4",
            size: 12345,
            duration: 100
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

        const initiatorVideo = await Video.create({
            title: "Video del iniciador",
            description: "Video del usuario iniciador",
            category: "entertainment",
            keywords: ["iniciador"],
            users: [initiatorId],
            url: "http://test.com/video-iniciador.mp4",
            size: 54321,
            duration: 100
        });
        await User.findByIdAndUpdate(initiatorId, { $push: { videos: initiatorVideo._id } });

        const video = await Video.create({
            title: "Video ajeno",
            description: "Descripción de prueba",
            category: "entertainment",
            keywords: ["prueba"],
            users: [initiatorId],
            url: "http://test.com/video.mp4",
            size: 12345,
            duration: 100
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

        const initiatorVideo = await Video.create({
            title: "Video del iniciador",
            description: "Video del usuario iniciador",
            category: "entertainment",
            keywords: ["iniciador"],
            users: [initiatorId],
            url: "http://test.com/video-iniciador.mp4",
            size: 54321,
            duration: 100
        });
        await User.findByIdAndUpdate(initiatorId, { $push: { videos: initiatorVideo._id } });

        const video = await Video.create({
            title: "Video de prueba",
            description: "Descripción de prueba",
            category: "entertainment",
            keywords: ["prueba"],
            users: [responderId],
            url: "http://test.com/video.mp4",
            size: 12345,
            duration: 100
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
            category: "entertainment",
            keywords: ["prueba"],
            users: [responderId],
            url: "http://test.com/video.mp4",
            size: 12345,
            duration: 100
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

describe("PATCH /exchanges/:id", () => {
    let exchangeId, Video, responderToken, video;
    beforeEach(async () => {
        Video = (await import("../models/Video.js")).default;
        video = await Video.create({
            title: "Video de prueba",
            description: "Descripción de prueba",
            category: "entertainment",
            keywords: ["prueba"],
            users: [responderId],
            url: "http://test.com/video.mp4",
            size: 12345,
            duration: 100
        });
        await User.findByIdAndUpdate(responderId, { $push: { videos: video._id } });
        const exchange = await Exchange.create({
            initiator: initiatorId,
            responder: responderId,
            responderVideo: video._id,
            status: "pending"
        });
        exchangeId = exchange._id;
        responderToken = generateToken({ _id: responderId });
        await User.findByIdAndUpdate(initiatorId, { $push: { exchanges: exchange._id } });
        await User.findByIdAndUpdate(responderId, { $push: { exchanges: exchange._id } });
    });

    it("debería permitir al receptor aceptar el intercambio con un video", async () => {
        // Create a video for initiator to exchange
        const initiatorVideo = await Video.create({
            title: "Video del iniciador",
            description: "Otro video",
            category: "entertainment",
            keywords: ["prueba"],
            users: [initiatorId],
            url: "http://test.com/video2.mp4",
            size: 12345,
            duration: 100
        });
        await User.findByIdAndUpdate(initiatorId, { $push: { videos: initiatorVideo._id } });
        responderToken = generateToken({ _id: responderId });
        const res = await request(app)
            .patch(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${responderToken}`)
            .send({ status: "accepted", videoId: initiatorVideo._id.toString() });
        expect(res.statusCode).toBe(200);
        const updated = await Exchange.findById(exchangeId);
        expect(updated.status).toBe("accepted");
        expect(updated.initiatorVideo.toString()).toBe(initiatorVideo._id.toString());
    });

    it("debería permitir al receptor rechazar el intercambio", async () => {
        const res = await request(app)
            .patch(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${responderToken}`)
            .send({ status: "rejected" });
        expect(res.statusCode).toBe(200);
        const updated = await Exchange.findById(exchangeId);
        expect(updated.status).toBe("rejected");
    });

    it("debería fallar si el usuario autenticado no es el receptor", async () => {
        const res = await request(app)
            .patch(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "rejected" });
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/no puedes/i);
    });

    it("debería fallar si el intercambio no está pendiente", async () => {
        await Exchange.findByIdAndUpdate(exchangeId, { status: "accepted" });
        const res = await request(app)
            .patch(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${responderToken}`)
            .send({ status: "rejected" });
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/no está pendiente/i);
    });

    it("debería fallar si falta el token", async () => {
        const res = await request(app)
            .patch(`/exchanges/${exchangeId}`)
            .send({ status: "rejected" });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el token es inválido", async () => {
        const res = await request(app)
            .patch(`/exchanges/${exchangeId}`)
            .set("Authorization", "Bearer tokeninvalido")
            .send({ status: "rejected" });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si falta el video al aceptar", async () => {
        const res = await request(app)
            .patch(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${responderToken}`)
            .send({ status: "accepted" });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/video/i);
    });

    it("debería fallar si el estado es inválido", async () => {
        const res = await request(app)
            .patch(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${responderToken}`)
            .send({ status: "otro" });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/no es válido/i);
    });

    it("debería fallar si el intercambio no existe", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .patch(`/exchanges/${fakeId}`)
            .set("Authorization", `Bearer ${responderToken}`)
            .send({ status: "rejected" });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/no existe/i);
    });

    it("debería fallar si el usuario no existe", async () => {
        const fakeToken = generateToken({ _id: new mongoose.Types.ObjectId() });
        const res = await request(app)
            .patch(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${fakeToken}`)
            .send({ status: "rejected" });
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/no existe/i);
    });
});

describe("DELETE /exchanges/:id", () => {
    let exchangeId, Video, initiatorToken, responderToken, video;
    beforeEach(async () => {
        Video = (await import("../models/Video.js")).default;
        video = await Video.create({
            title: "Video de prueba",
            description: "Descripción de prueba",
            category: "entertainment",
            keywords: ["prueba"],
            users: [responderId],
            url: "http://test.com/video.mp4",
            size: 12345,
            duration: 100
        });
        await User.findByIdAndUpdate(responderId, { $push: { videos: video._id } });
        const exchange = await Exchange.create({
            initiator: initiatorId,
            responder: responderId,
            responderVideo: video._id,
            status: "pending"
        });
        exchangeId = exchange._id;
        initiatorToken = generateToken({ _id: initiatorId });
        responderToken = generateToken({ _id: responderId });
        await User.findByIdAndUpdate(initiatorId, { $push: { exchanges: exchange._id } });
        await User.findByIdAndUpdate(responderId, { $push: { exchanges: exchange._id } });
    });

    it("debería permitir al iniciador eliminar un intercambio pendiente", async () => {
        const res = await request(app)
            .delete(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${initiatorToken}`);
        expect(res.statusCode).toBe(200);
        const deleted = await Exchange.findById(exchangeId);
        expect(deleted).toBeNull();
    });

    it("debería fallar si el usuario autenticado no es el iniciador", async () => {
        const res = await request(app)
            .delete(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${responderToken}`);
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/no puedes/i);
    });

    it("debería fallar si el intercambio no está pendiente", async () => {
        await Exchange.findByIdAndUpdate(exchangeId, { status: "accepted" });
        const res = await request(app)
            .delete(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${initiatorToken}`);
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/no se puede eliminar/i);
    });

    it("debería fallar si falta el token", async () => {
        const res = await request(app)
            .delete(`/exchanges/${exchangeId}`);
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el token es inválido", async () => {
        const res = await request(app)
            .delete(`/exchanges/${exchangeId}`)
            .set("Authorization", "Bearer tokeninvalido");
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el intercambio no existe", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .delete(`/exchanges/${fakeId}`)
            .set("Authorization", `Bearer ${initiatorToken}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/no existe/i);
    });

    it("debería fallar si el usuario no existe", async () => {
        const fakeToken = generateToken({ _id: new mongoose.Types.ObjectId() });
        const res = await request(app)
            .delete(`/exchanges/${exchangeId}`)
            .set("Authorization", `Bearer ${fakeToken}`);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/no existe/i);
    });
});

describe("POST /exchanges/:id/report", () => {
    let exchangeId, Video, initiatorToken, responderToken, video, initiatorVideo;
    beforeEach(async () => {
        Video = (await import("../models/Video.js")).default;
        // Create videos for both users
        video = await Video.create({
            title: "Video de prueba",
            description: "Descripción de prueba",
            category: "entertainment",
            keywords: ["prueba"],
            users: [responderId],
            url: "http://test.com/video.mp4",
            size: 12345,
            duration: 100
        });
        initiatorVideo = await Video.create({
            title: "Video del iniciador",
            description: "Video del usuario iniciador",
            category: "entertainment",
            keywords: ["iniciador"],
            users: [initiatorId],
            url: "http://test.com/video-iniciador.mp4",
            size: 54321,
            duration: 100
        });
        await User.findByIdAndUpdate(responderId, { $push: { videos: video._id } });
        await User.findByIdAndUpdate(initiatorId, { $push: { videos: initiatorVideo._id } });
        // Create accepted exchange
        const exchange = await Exchange.create({
            initiator: initiatorId,
            responder: responderId,
            responderVideo: video._id,
            initiatorVideo: initiatorVideo._id,
            status: "accepted"
        });
        exchangeId = exchange._id;
        initiatorToken = generateToken({ _id: initiatorId });
        responderToken = generateToken({ _id: responderId });
        await User.findByIdAndUpdate(initiatorId, { $push: { exchanges: exchange._id } });
        await User.findByIdAndUpdate(responderId, { $push: { exchanges: exchange._id } });
    });

    it("debería permitir al iniciador reportar el video del receptor", async () => {
        const res = await request(app)
            .post(`/exchanges/${exchangeId}/report`)
            .set("Authorization", `Bearer ${initiatorToken}`)
            .send({ reason: "inappropriate_unmarked", details: "Contenido inapropiado" });
        expect(res.statusCode).toBe(201);
    });

    it("debería permitir al receptor reportar el video del iniciador", async () => {
        const res = await request(app)
            .post(`/exchanges/${exchangeId}/report`)
            .set("Authorization", `Bearer ${responderToken}`)
            .send({ reason: "irrelevant_or_empty", details: "No tiene contenido relevante" });
        expect(res.statusCode).toBe(201);
    });

    it("debería permitir reportar con razón 'other' y campo otherReason", async () => {
        const res = await request(app)
            .post(`/exchanges/${exchangeId}/report`)
            .set("Authorization", `Bearer ${initiatorToken}`)
            .send({ reason: "other", otherReason: "Explicación personalizada", details: "Detalles adicionales" });
        expect(res.statusCode).toBe(201);
    });

    it("debería fallar si falta el token", async () => {
        const res = await request(app)
            .post(`/exchanges/${exchangeId}/report`)
            .send({ reason: "unauthorized_content" });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el token es inválido", async () => {
        const res = await request(app)
            .post(`/exchanges/${exchangeId}/report`)
            .set("Authorization", "Bearer tokeninvalido")
            .send({ reason: "duplicate_video" });
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
            .post(`/exchanges/${exchangeId}/report`)
            .set("Authorization", `Bearer ${outsiderToken}`)
            .send({ reason: "inappropriate_unmarked" });
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/no puedes/i);
    });

    it("debería fallar si el intercambio no está aceptado", async () => {
        await Exchange.findByIdAndUpdate(exchangeId, { status: "pending" });
        const res = await request(app)
            .post(`/exchanges/${exchangeId}/report`)
            .set("Authorization", `Bearer ${initiatorToken}`)
            .send({ reason: "irrelevant_or_empty" });
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/no fue aceptado/i);
    });

    it("debería fallar si falta la razón del reporte", async () => {
        const res = await request(app)
            .post(`/exchanges/${exchangeId}/report`)
            .set("Authorization", `Bearer ${initiatorToken}`)
            .send({});
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });
});