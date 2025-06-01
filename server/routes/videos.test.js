/**
 * Tests for the /videos/sightengine route of the server.
 *
 * This file contains automated tests that verify the behavior of the video moderation endpoint.
 *
 * The tests cover the following cases:
 *   - Marks the video as sensitive if any frame is detected as such.
 *   - Does not mark the video if no frame is sensitive.
 *   - Responds with 204 if the analysis is not finished.
 *   - Responds with 500 in case of error or invalid data.
 *
 * After each test, all videos are removed from the database to ensure a clean environment.
 */

import request from "supertest";
import app from "../server.js";
import Video from "../models/Video.js";
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
    await Video.deleteMany();
});

afterEach(async () => {
    await Video.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe("POST /videos/sightengine", () => {
    it("debería marcar isSensitiveContent como true si algún frame es sensible", async () => {
        const video = await Video.create({
            title: "Video de prueba",
            description: "Descripción de prueba para video.",
            category: "entretenimiento",
            keywords: ["palabra", "clave"],
            users: [new mongoose.Types.ObjectId()],
            hash: "hash",
            isSensitiveContent: false
        });
        const res = await request(app)
            .post("/videos/sightengine")
            .send({
                data: {
                    status: "finished",
                    frames: [
                        {
                            nudity: { sexual_activity: 0.1, sexual_display: 0, erotica: 0 },
                            weapon: { classes: { weapon: 0 } },
                            recreational_drug: { prob: 0 },
                            medical: { prob: 0 },
                            gore: { prob: 0 },
                            "self-harm": { prob: 0 },
                            violence: { prob: 0 }
                        }
                    ]
                },
                media: { uri: video._id + ".mp4" }
            });
        expect(res.statusCode).toBe(204);
        const updated = await Video.findById(video._id);
        expect(updated.isSensitiveContent).toBe(true);
    });

    it("no debe marcar isSensitiveContent si ningún frame es sensible", async () => {
        const video = await Video.create({
            title: "Video de prueba",
            description: "Descripción de prueba para video.",
            category: "entretenimiento",
            keywords: ["palabra", "clave"],
            users: [new mongoose.Types.ObjectId()],
            hash: "hash",
            isSensitiveContent: false
        });
        const res = await request(app)
            .post("/videos/sightengine")
            .send({
                data: {
                    status: "finished",
                    frames: [
                        {
                            nudity: { sexual_activity: 0, sexual_display: 0, erotica: 0 },
                            weapon: { classes: { weapon: 0 } },
                            recreational_drug: { prob: 0 },
                            medical: { prob: 0 },
                            gore: { prob: 0 },
                            "self-harm": { prob: 0 },
                            violence: { prob: 0 }
                        }
                    ]
                },
                media: { uri: video._id + ".mp4" }
            });
        expect(res.statusCode).toBe(204);
        const updated = await Video.findById(video._id);
        expect(updated.isSensitiveContent).toBe(false);
    });

    it("debe responder 204 si el status no es 'finished'", async () => {
        const res = await request(app)
            .post("/videos/sightengine")
            .send({ data: { status: "pending" } });
        expect(res.statusCode).toBe(204);
    });

    it("debe responder 500 en caso de error", async () => {
        const res = await request(app)
            .post("/videos/sightengine")
            .send({ data: null });
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBeDefined();
    });
});
