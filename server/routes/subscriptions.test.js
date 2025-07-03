/**
 * Tests for the /subscriptions route of the server.
 *
 * This file contains automated tests that verify the behavior of the subscriptions endpoints.
 *
 * The tests cover the following cases:
 * POST /subscriptions:
 *   - Creates a new subscription for a user.
 *   - Handles missing user, missing plan, already subscribed, and MercadoPago errors.
 * PUT /subscriptions:
 *   - Cancels the user's current subscription and reverts to the basic plan.
 *   - Handles missing user, missing active subscription, and MercadoPago errors.
 *
 * After each test, all users and plans are removed from the database to ensure a clean environment.
 */
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import subscriptionsRouter from "./subscriptions.js";
import Plan from "../models/Plan.js";
import User from "../models/User.js";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { generateToken } from "../lib/jwt.js";

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
    app.use("/subscriptions", subscriptionsRouter);
});

afterEach(async () => {
    await User.deleteMany();
    await Plan.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("POST /subscriptions", () => {
    it("crea una nueva suscripción para el usuario", async () => {
        const plan = await Plan.create({
            name: "premium",
            monthlyPrice: 20,
            libraryStorage: 5000000000,
            librarySize: 50,
            videoMaxSize: 100000000,
            exchangeLimit: 20,
            stats: false,
            exchangePriority: false,
            searchPriority: false,
            supportPriority: false,
            preApprovalId: "pre-456"
        });
        const user = await User.create({
            email: "test@example.com",
            username: "testuser",
            password: "Password1!",
            videos: [],
            exchanges: [],
            subscription: { plan: null, subscriptionId: null }
        });
        const token = generateToken({ _id: user._id });
        // Mock MercadoPago
        const mockCreate = vi.spyOn(require("mercadopago").PreApproval.prototype, "create").mockResolvedValue({ subscription_id: "sub-123" });
        const res = await request(app)
            .post("/subscriptions")
            .set("Authorization", `Bearer ${token}`)
            .send({ planId: plan._id, email: user.email, cardTokenId: "tok_visa" });
        expect(res.statusCode).toBe(200);
        mockCreate.mockRestore();
    });

    it("devuelve 404 si el usuario no existe", async () => {
        const plan = await Plan.create({ name: "premium", monthlyPrice: 20, libraryStorage: 1, librarySize: 1, videoMaxSize: 1, exchangeLimit: 1, stats: false, exchangePriority: false, searchPriority: false, supportPriority: false, preApprovalId: "pre-456" });
        const fakeId = new mongoose.Types.ObjectId();
        const token = generateToken({ _id: fakeId });
        const res = await request(app)
            .post("/subscriptions")
            .set("Authorization", `Bearer ${token}`)
            .send({ planId: plan._id, email: "no@user.com", cardTokenId: "tok_visa" });
        expect(res.statusCode).toBe(404);
    });

    it("devuelve 400 si el plan no existe", async () => {
        const user = await User.create({ email: "test@example.com", username: "testuser", password: "Password1!", videos: [], exchanges: [], subscription: { plan: null, subscriptionId: null } });
        const token = generateToken({ _id: user._id });
        const res = await request(app)
            .post("/subscriptions")
            .set("Authorization", `Bearer ${token}`)
            .send({ planId: new mongoose.Types.ObjectId(), email: user.email, cardTokenId: "tok_visa" });
        expect(res.statusCode).toBe(400);
    });

    it("devuelve 409 si ya está suscrito a ese plan", async () => {
        const plan = await Plan.create({ name: "premium", monthlyPrice: 20, libraryStorage: 1, librarySize: 1, videoMaxSize: 1, exchangeLimit: 1, stats: false, exchangePriority: false, searchPriority: false, supportPriority: false, preApprovalId: "pre-456" });
        const user = await User.create({ email: "test@example.com", username: "testuser", password: "Password1!", videos: [], exchanges: [], subscription: { plan: plan._id, subscriptionId: null } });
        const token = generateToken({ _id: user._id });
        const res = await request(app)
            .post("/subscriptions")
            .set("Authorization", `Bearer ${token}`)
            .send({ planId: plan._id, email: user.email, cardTokenId: "tok_visa" });
        expect(res.statusCode).toBe(409);
    });

    it("maneja errores de MercadoPago", async () => {
        const plan = await Plan.create({ name: "premium", monthlyPrice: 1, libraryStorage: 1, librarySize: 1, videoMaxSize: 1, exchangeLimit: 1, stats: false, exchangePriority: false, searchPriority: false, supportPriority: false, preApprovalId: "pre-456" });
        const user = await User.create({ email: "test@example.com", username: "testuser", password: "Password1!", videos: [], exchanges: [], subscription: { plan: null, subscriptionId: null } });
        const token = generateToken({ _id: user._id });
        const mockCreate = vi.spyOn(require("mercadopago").PreApproval.prototype, "create").mockImplementation(() => { const err = new Error("MP error"); err.status = 402; throw err; });
        const res = await request(app)
            .post("/subscriptions")
            .set("Authorization", `Bearer ${token}`)
            .send({ planId: plan._id, email: user.email, cardTokenId: "tok_visa" });
        expect(res.statusCode).toBe(402);
        expect(res.body.mp).toBe(true);
        mockCreate.mockRestore();
    });
});

describe("PUT /subscriptions", () => {
    it("cancela la suscripción y vuelve al plan básico", async () => {
        const basicPlan = await Plan.create({ name: "basic", monthlyPrice: 0, libraryStorage: 1, librarySize: 1, videoMaxSize: 1, exchangeLimit: 1, stats: false, exchangePriority: false, searchPriority: false, supportPriority: false, preApprovalId: "pre-basic" });
        const plan = await Plan.create({ name: "premium", monthlyPrice: 20, libraryStorage: 1, librarySize: 1, videoMaxSize: 1, exchangeLimit: 1, stats: false, exchangePriority: false, searchPriority: false, supportPriority: false, preApprovalId: "pre-456" });
        const user = await User.create({ email: "test@example.com", username: "testuser", password: "Password1!", videos: [], exchanges: [], subscription: { plan: plan._id, subscriptionId: "sub-123" } });
        const token = generateToken({ _id: user._id });
        // Mock MercadoPago
        const mockUpdate = vi.spyOn(require("mercadopago").PreApproval.prototype, "update").mockResolvedValue({});
        const res = await request(app)
            .put("/subscriptions")
            .set("Authorization", `Bearer ${token}`)
            .send();
        expect(res.statusCode).toBe(200);
        mockUpdate.mockRestore();
    });

    it("devuelve 404 si el usuario no existe", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const token = generateToken({ _id: fakeId });
        const res = await request(app)
            .put("/subscriptions")
            .set("Authorization", `Bearer ${token}`)
            .send();
        expect(res.statusCode).toBe(404);
    });

    it("devuelve 400 si el usuario no tiene suscripción activa", async () => {
        const user = await User.create({ email: "test@example.com", username: "testuser", password: "Password1!", videos: [], exchanges: [], subscription: { plan: null, subscriptionId: null } });
        const token = generateToken({ _id: user._id });
        const res = await request(app)
            .put("/subscriptions")
            .set("Authorization", `Bearer ${token}`)
            .send();
        expect(res.statusCode).toBe(400);
    });

    it("maneja errores de MercadoPago", async () => {
        const plan = await Plan.create({ name: "premium", monthlyPrice: 20, libraryStorage: 1, librarySize: 1, videoMaxSize: 1, exchangeLimit: 1, stats: false, exchangePriority: false, searchPriority: false, supportPriority: false, preApprovalId: "pre-456" });
        const user = await User.create({ email: "test@example.com", username: "testuser", password: "Password1!", videos: [], exchanges: [], subscription: { plan: plan._id, subscriptionId: "sub-123" } });
        const token = generateToken({ _id: user._id });
        const mockUpdate = vi.spyOn(require("mercadopago").PreApproval.prototype, "update").mockImplementation(() => { const err = new Error("MP error"); err.status = 402; throw err; });
        const res = await request(app)
            .put("/subscriptions")
            .set("Authorization", `Bearer ${token}`)
            .send();
        expect(res.statusCode).toBe(402);
        expect(res.body.mp).toBe(true);
        mockUpdate.mockRestore();
    });
});
