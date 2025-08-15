import { Router } from "express";
import User from "../models/User.js";
import Video from "../models/Video.js";
import auth from "../middleware/auth.js";
import { cloudinary } from "../config.js";
import { ITEMS_PER_PAGE } from "../lib/constants.js";
import { addVideoView, cancelPendingExchanges, sightEngineValidation } from "../lib/utils.js";
import axios from "axios";
import Exchange from "../models/Exchange.js";
import { verifyToken } from "../lib/jwt.js";
import Report from "../models/Report.js";

const router = Router();

/**
 * Returns a paginated list of videos matching the search query and filters.
 * - Accepts query parameters: 'q' (search), 'category', 'order', 'sensitive', 'page'.
 * - Applies filters and sorting based on query parameters.
 * - Returns video data with user info and thumbnail for each video.
 * - Responds with: videos (current page), totalPages.
 * - 500 for unexpected errors.
 */
router.get("/", async (req, res) => {
    try {
        const q = req.query.q;

        const page = parseInt(req.query.page) || 0;
        const limit = ITEMS_PER_PAGE;
        const skip = page * limit;

        const regex = new RegExp(q, "i");

        const orConditions = [
            { title: { $regex: regex } },
            { description: { $regex: regex } },
            { keywords: { $in: [regex] } }
        ];

        const filters = {
            $or: orConditions
        };

        if (req.query.category) filters.category = req.query.category;
        let sensitiveContent = false;
        if (req.query.sensitive) {
            sensitiveContent = JSON.parse(req.query.sensitive);
        }
        if (!sensitiveContent) filters.isSensitiveContent = false;

        const sortOrder = req.query.order === "newFirst" ? -1 : 1;

        const videosCount = await Video.countDocuments(filters);
        const totalPages = Math.ceil(videosCount / limit);

        const pageVideos = await Video.find(filters)
            .sort({ "rating.value": -1, "rating.count": -1, uploadedDate: sortOrder })
            .skip(skip)
            .limit(limit);

        const videos = await Promise.all(pageVideos.map(async (video) => {
            const { users, hash, __v, ...videoData } = video.toJSON();
            const user = await User.findById(video.getCurrentUser());
            if (!user) return null;
            videoData.user = user.username;
            videoData.thumbnail = video.createThumbnail();

            return videoData;
        }));

        return res.status(200).send({
            videos: videos.filter(v => v !== null),
            totalPages
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

/**
 * GET /:id
 * Fetches video details by ID for authenticated or unauthenticated users.
 * - Returns 404 if the user or video does not exist.
 * - If authenticated, determines if the user is the owner:
 *   - Owner: returns secure video URL.
 *   - Not owner: returns preview URL and exchange request status.
 * - Response includes video info, owner username, thumbnail, and authentication status.
 * - Handles invalid IDs and errors.
 */
router.get("/:id", async (req, res) => {
    try {
        let authenticated = true;

        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            authenticated = false;
        }

        let user;
        if (authenticated) {
            const token = authHeader.split(" ")[1];
            try {
                const decoded = await verifyToken(token);
                user = await User.findById(decoded._id);
                if (!user) {
                    return res.status(404).send({
                        error: "El usuario no existe",
                        type: "user"
                    });
                }
            } catch (err) {
                authenticated = false;
            }
        }

        const video = await Video.findById(req.params.id).populate("users");
        if (!video) {
            return res.status(404).send({
                error: "El video no existe",
                type: "video"
            });
        }
        const { users, hash, __v, ...videoData } = video.toJSON();

        const currentUser = video.getCurrentUser();
        videoData.user = currentUser.username;
        videoData.isOwner = authenticated ? currentUser._id == String(user._id) : false;
        if (!videoData.isOwner) {
            if (authenticated) {
                videoData.hasRequested = await Exchange.exists({
                    initiator: user._id,
                    responderVideo: videoData._id,
                    status: "pending"
                });
            }
            videoData.url = await video.createPreviewUrl();
            const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
            addVideoView(video._id, ip);
        } else {
            videoData.url = video.createSecureUrl();
        }
        videoData.thumbnail = video.createThumbnail();

        return res.status(200).send({ data: videoData, isAuth: authenticated });
    } catch (e) {
        if (e.name == "CastError") {
            res.status(400).send({
                error: "Id inválido."
            });
        } else {
            console.log(e);
            res.status(500).send({
                error: "Ha ocurrido un error inesperado"
            });
        }
    }
});

/**
 * DELETE /:id
 * Deletes a video by its ID for the authenticated owner.
 * - Returns 404 if the user or video does not exist.
 * - Only allows deletion if the current user is the owner.
 * - Removes the video from Cloudinary and the user's video list, then deletes the video document.
 * - Returns 200 on success, 403 if not owner, or appropriate error response.
 */
router.delete("/:id", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe",
                type: "user"
            });
        }

        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).send({
                error: "El video no existe",
                type: "video"
            });
        }

        if (video.getCurrentUser() == String(user._id)) {
            await cloudinary.v2.uploader.destroy(`videos/${String(video._id)}`,
                {
                    resource_type: "video",
                    type: "private"
                }
            );

            const videoId = video._id;
            await user.updateOne({
                videos: user.videos.filter(v => !v.equals(videoId))
            });
            await video.deleteOne();

            cancelPendingExchanges(videoId);

            return res.status(200).send({});
        }

        return res.status(403).send({
            error: "No tienes acceso a este video."
        });
    } catch (e) {
        if (e.name == "CastError") {
            res.status(400).send({
                error: "Id inválido."
            });
        } else {
            console.log(e);
            res.status(500).send({
                error: "Ha ocurrido un error inesperado"
            });
        }
    }
});

/**
 * PATCH /:id
 * Edits a video by its ID for the authenticated owner.
 * - Returns 404 if the user or video does not exist.
 * - Only allows editing if the current user is the owner.
 * - Accepts changes to title, description, category, keywords, and isSensitiveContent.
 * - Handles validation and updates sensitive content status if needed.
 * - Returns 200 on success, 403 if not owner, or appropriate error response.
 */
router.patch("/:id", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe",
                type: "user"
            });
        }

        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).send({
                error: "El video no existe",
                type: "video"
            });
        }

        if (video.getCurrentUser() == String(user._id)) {
            if (!req.body || !req.body.data) {
                return res.status(400).send({
                    error: "No se ha ingresado ningún valor para modificar."
                });
            }

            const data = req.body.data;
            const dataChanged = {};

            if (data.title)
                dataChanged.title = data.title;

            if (data.description)
                dataChanged.description = data.description;

            if (data.category)
                dataChanged.category = data.category;

            try {
                dataChanged.keywords = JSON.parse(data.keywords);
            } catch (e) { }

            if (data.isSensitiveContent != undefined)
                dataChanged.isSensitiveContent = data.isSensitiveContent;

            await video.updateOne(dataChanged, {
                runValidators: true
            });

            if (data.isSensitiveContent != undefined) {
                const isSensitiveContent = JSON.parse(dataChanged.isSensitiveContent);
                if (video.isSensitiveContent && !isSensitiveContent) {
                    const url = cloudinary.v2.url(`videos/${String(video._id)}`, {
                        resource_type: "video",
                        type: "private",
                        format: "mp4",
                        sign_url: true
                    });
                    const response = await axios.get(url, {
                        responseType: "arraybuffer",
                    });
                    const buffer = Buffer.from(response.data);
                    sightEngineValidation(buffer, String(video._id));
                }
            }

            return res.status(200).send({});
        }

        return res.status(403).send({
            error: "No tienes acceso a este video."
        });
    } catch (e) {
        if (e.name == "CastError") {
            res.status(400).send({
                error: "Dato inválido."
            });
        } else if (e.name == "ValidationError") { // Schema validations
            let message = "";
            for (const error in e.errors) {
                message += e.errors[error].message + "\n";
            }
            res.status(400).send({ error: message });
        } else {
            console.log(e);
            res.status(500).send({
                error: "Ha ocurrido un error inesperado"
            });
        }
    }
});

/**
 * POST /:id/report
 * Creates a report for a specific video by its ID.
 * - Requires authentication.
 * - The authenticated user cannot report their own video.
 * - Accepts report data in the request body (reason, otherReason, details, etc.).
 * - Automatically sets the reporterId to the authenticated user and reportedVideoId to the video being reported.
 * - Validates input and creates a new Report document.
 * - Returns 201 on success, 400 if user tries to report their own video, or appropriate error response.
 */
router.post("/:id/report", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe",
                type: "user"
            });
        }

        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).send({
                error: "El video no existe",
                type: "video"
            });
        }

        if (video.getCurrentUser() == String(user._id)) {
            return res.status(400).send({
                error: "No puedes reportar tu propio video."
            });
        }

        const { status, createdAt, reporterId, ...reportData } = req.body;

        reportData.reporterId = user._id;
        reportData.reportedVideoId = video._id;

        await Report.create(reportData);

        return res.status(201).send({});
    } catch (e) {
        if (e.name == "CastError") {
            res.status(400).send({
                error: "Dato inválido."
            });
        } else if (e.name == "ValidationError") { // Schema validations
            let message = "";
            for (const error in e.errors) {
                message += e.errors[error].message + "\n";
            }
            res.status(400).send({ error: message });
        } else {
            console.log(e);
            res.status(500).send({
                error: "Ha ocurrido un error inesperado"
            });
        }
    }
});

/**
 * POST /upload
 * Finalizes the video upload process and performs content validation.
 * - Receives video metadata from the client after a successful upload to Cloudinary (public_id, duration, URL).
 * - Extracts the video ID from the Cloudinary public_id and updates the corresponding Video document with the duration.
 * - If the video is not already marked as sensitive, sends the video URL to Sightengine for content moderation.
 * - Responds with 204 No Content on success.
 * - Returns 500 for unexpected errors and logs them.
 */
router.post("/upload", async (req, res) => {
    try {
        const videoId = req.body.public_id.split("videos/")[1];
        const duration = req.body.duration;
        const video = await Video.findById(videoId);
        if (!video) return;

        video.duration = duration;
        await video.save();

        if (!video.isSensitiveContent) await sightEngineValidation(req.body.url);

        res.status(204).send();
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

/**
 * POST /sightengine
 * Processes analysis results from Sightengine to detect sensitive content in videos.
 * - Expects JSON payload from Sightengine webhook with 'data' and 'frames' arrays.
 * - Recursively scans all numeric values in nudity, weapon, drugs, medical, gore, self-harm, and violence categories.
 * - Marks the video as sensitive if any value exceeds the defined threshold.
 * - Updates the Video document's isSensitiveContent field in the database.
 * - Responds with 204 No Content on success, or 500 on error.
 */
router.post("/sightengine", async (req, res) => {
    try {
        if (!req.body || !req.body.data || typeof req.body.data !== "object") {
            throw new Error("Datos de entrada inválidos");
        }
        if (req.body.data && req.body.data.status == "finished") {
            let sensitive = false;
            for (const frame of req.body.data.frames) {
                if (
                    checkValues(frame.nudity) ||
                    checkValues(frame.weapon) ||
                    checkValues(frame.recreational_drug) ||
                    checkValues(frame.medical) ||
                    checkValues(frame.gore) ||
                    checkValues(frame['self-harm']) ||
                    checkValues(frame.violence)
                ) {
                    sensitive = true;
                }
            }

            if (sensitive) {
                const videoId = req.body.media.uri.split(".")[2].split("videos/")[1];
                await Video.findByIdAndUpdate(videoId, {
                    isSensitiveContent: true
                });
            }
        }
        res.status(204).send();
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

const threshold = 0.2;
// Recursively checks all numeric values in an object, returning true if any exceed the threshold.
const checkValues = obj => {
    if (!obj || typeof obj !== "object") return false;
    return Object.values(obj).some(value =>
        typeof value === "number" ? value > threshold : checkValues(value)
    );
};

export default router;