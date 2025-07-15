/**
 * Tests for the /ratings route of the server.
 *
 * This file contains automated tests that verify the behavior of the ratings endpoints.
 *
 * The tests cover the following cases:
 * POST /ratings:
 *   - Successful creation of a rating with valid data and authentication.
 *   - Fails if token is missing.
 *   - Fails if user already rated this exchange.
 *   - Fails if rating value is invalid.
 *   - Fails if comment is too short.
 *
 * GET /ratings:
 *   - Returns the rating for the authenticated user and exchange if it exists.
 *   - Fails if no rating exists for the given exchange and user.
 *
 * After each test, all users, videos, exchanges, and ratings are removed from the database to ensure a clean environment.
 */
import request from "supertest";
import app from "../server.js";
import User from "../models/User.js";
import Exchange from "../models/Exchange.js";
import Video from "../models/Video.js";
import Rating from "../models/Rating.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { generateToken } from "../lib/jwt.js";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

let mongoServer;
let userId, ratedUserId, token, exchangeId, videoId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoServer.getUri(), { dbName: "test" });
});

beforeEach(async () => {
    // Create users
    const user = await User.create({
        email: "user@example.com",
        username: "user1",
        password: "Password123!"
    });
    userId = user._id;
    token = generateToken({ _id: user._id });

    const ratedUser = await User.create({
        email: "rated@example.com",
        username: "rateduser",
        password: "Password123!"
    });
    ratedUserId = ratedUser._id;

    // Create video owned by ratedUser (for exchange)
    const responderVideo = await Video.create({
        title: "Video de prueba responder",
        description: "Descripción de prueba para rating.",
        category: "entertainment",
        keywords: ["prueba"],
        users: [ratedUserId],
        url: "http://test.com/video.mp4",
        size: 12345
    });
    await User.findByIdAndUpdate(ratedUserId, { $push: { videos: responderVideo._id } });

    // Create video owned by user (for rating)
    const userVideo = await Video.create({
        title: "Video de prueba user",
        description: "Descripción de prueba para rating user.",
        category: "entertainment",
        keywords: ["prueba"],
        users: [userId],
        url: "http://test.com/video2.mp4",
        size: 12345
    });
    videoId = userVideo._id;
    await User.findByIdAndUpdate(userId, { $push: { videos: userVideo._id } });

    // Create exchange
    const exchange = await Exchange.create({
        initiator: userId,
        responder: ratedUserId,
        responderVideo: responderVideo._id,
        status: "accepted"
    });
    exchangeId = exchange._id;
});

afterEach(async () => {
    await User.deleteMany();
    await Video.deleteMany();
    await Exchange.deleteMany();
    await Rating.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("POST /ratings", () => {
    it("debería crear una calificación con datos y autenticación válidos", async () => {
        const res = await request(app)
            .post("/ratings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                exchangeId: exchangeId.toString(),
                ratedUser: ratedUserId.toString(),
                video: videoId.toString(),
                rating: 4.5,
                comment: "Muy buen intercambio!"
            });
        expect(res.statusCode).toBe(201);
        const rating = await Rating.findOne({ exchangeId, ratingUser: userId });
        expect(rating).toBeTruthy();
        expect(rating.rating).toBe(4.5);
        expect(rating.comment).toBe("Muy buen intercambio!");
    });

    it("debería fallar si falta el token", async () => {
        const res = await request(app)
            .post("/ratings")
            .send({
                exchangeId: exchangeId.toString(),
                ratedUser: ratedUserId.toString(),
                video: videoId.toString(),
                rating: 4.5,
                comment: "Muy buen intercambio!"
            });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it("debería fallar si el usuario ya calificó este intercambio", async () => {
        await Rating.create({
            exchangeId,
            ratingUser: userId,
            ratedUser: ratedUserId,
            video: videoId,
            rating: 4,
            comment: "Comentario previo"
        });
        const res = await request(app)
            .post("/ratings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                exchangeId: exchangeId.toString(),
                ratedUser: ratedUserId.toString(),
                video: videoId.toString(),
                rating: 5,
                comment: "Intento duplicado"
            });
        expect(res.statusCode).toBe(409);
        expect(res.body.error).toMatch(/ya envió una calificación/i);
    });

    it("debería fallar si la calificación es inválida", async () => {
        const res = await request(app)
            .post("/ratings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                exchangeId: exchangeId.toString(),
                ratedUser: ratedUserId.toString(),
                video: videoId.toString(),
                rating: 6,
                comment: "Muy buen intercambio!"
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/calificación no es válida/i);
    });

    it("debería fallar si el comentario es muy corto", async () => {
        const res = await request(app)
            .post("/ratings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                exchangeId: exchangeId.toString(),
                ratedUser: ratedUserId.toString(),
                video: videoId.toString(),
                rating: 4,
                comment: "Corto"
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/comentario debe tener al menos 10 caracteres/i);
    });
});

describe("GET /ratings", () => {
    it("debería devolver la calificación del usuario autenticado para un intercambio", async () => {
        await Rating.create({
            exchangeId,
            ratingUser: userId,
            ratedUser: ratedUserId,
            video: videoId,
            rating: 5,
            comment: "Excelente!"
        });
        const res = await request(app)
            .get(`/ratings?exchangeId=${exchangeId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.rating).toBe(5);
        expect(res.body.data.comment).toBe("Excelente!");
    });

    it("debería fallar si no existe una calificación para ese intercambio", async () => {
        const res = await request(app)
            .get(`/ratings?exchangeId=${exchangeId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/no existe una calificación/i);
    });
});