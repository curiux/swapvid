import { Router } from "express";
import User from "../models/User.js";
import Video from "../models/Video.js";
import auth from "../middleware/auth.js";
import { cloudinary } from "../config.js";
import { ITEMS_PER_PAGE, sightEngineValidation } from "../lib/utils.js";
import axios from "axios";
import Exchange from "../models/Exchange.js";
import { verifyToken } from "../lib/jwt.js";

const router = Router();

/**
 * GET /
 * Fetches a paginated list of videos matching the search query.
 * - Accepts query parameters: 'q' for search term, 'page' for pagination.
 * - Searches videos by title, description, or keywords using a case-insensitive regex.
 * - Returns video data with user info and thumbnail for each video.
 * - Responds with total pages and videos for the current page.
 * - Returns 500 on unexpected errors.
 */
router.get("/", async (req, res) => {
    try {
        const query = req.query.q;

        const page = parseInt(req.query.page) || 0;
        const limit = ITEMS_PER_PAGE;

        const start = page * limit;
        const end = start + limit;

        const regex = new RegExp(query, "i");

        const allVideos = await Video.find({
            $or: [
                { title: { $regex: regex } },
                { description: { $regex: regex } },
                { keywords: { $in: [regex] } }
            ]
        });

        const totalVideos = allVideos.length;
        const totalPages = Math.ceil(totalVideos / limit);

        const videos = await Promise.all(allVideos.slice(start, end).map(async (video) => {
            const { users, hash, __v, ...videoData } = video.toJSON();
            const user = await User.findById(video.getCurrentUser());
            if (!user) return null;
            videoData.user = user.username;
            videoData.thumbnail = video.createThumbnail();

            return videoData;
        }));

        return res.status(200).send({
            videos,
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
 * Fetches a video by its ID for an authenticated or unauthenticated user.
 * - Returns 404 if the user or video does not exist.
 * - Determines if the current user is the owner of the video (if authenticated).
 *   - If owner: returns a secure video URL.
 *   - If not owner: returns a 'hasRequested' flag indicating if the user has already requested an exchange for this video (checked via the Exchange model).
 * - Populates thumbnail, user info, username, and ownership status in the response.
 * - Returns video data, authentication status, or appropriate error response.
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
            videoData.hasRequested = await Exchange.exists({
                initiator: currentUser._id,
                responderVideo: videoData._id,
                status: "pending"
            });
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

            await user.updateOne({
                videos: user.videos.filter(v => !v.equals(video._id))
            });
            await video.deleteOne();

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
 * Handles callbacks from the Sightengine API for video content moderation.
 *
 * - Receives POST requests from Sightengine when video analysis is finished.
 * - Iterates through all frames and checks for sensitive content (nudity, weapons, drugs, medical, gore, self-harm, violence) using defined probability thresholds.
 * - If any frame is flagged as sensitive, updates the corresponding Video document's isSensitiveContent field to true.
 * - Always responds with 204 No Content on success, or 500 on error.
 */
router.post("/sightengine", async (req, res) => {
    try {
        if (!req.body || !req.body.data || typeof req.body.data !== "object") {
            throw new Error("Datos de entrada inválidos");
        }
        if (req.body.data && req.body.data.status == "finished") {
            let sensitive = false;
            for (const frame of req.body.data.frames) {
                const {
                    nudity,
                    weapon,
                    recreational_drug,
                    medical,
                    gore,
                    "self-harm": selfHarm,
                    violence
                } = frame;

                if (
                    nudity.sexual_activity > 0.05 ||
                    nudity.sexual_display > 0.1 ||
                    nudity.erotica > 0.2 ||
                    weapon?.classes?.weapon > 0.1 ||
                    recreational_drug.prob > 0.1 ||
                    medical.prob > 0.1 ||
                    gore.prob > 0.1 ||
                    selfHarm.prob > 0.1 ||
                    violence.prob > 0.1
                ) {
                    sensitive = true;
                }
            }

            if (sensitive) {
                const videoId = req.body.media.uri.split(".")[0];
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

export default router;