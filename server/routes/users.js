import { Router } from "express";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Rating from "../models/Rating.js";
import Exchange from "../models/Exchange.js";
import auth from "../middleware/auth.js";
import { cloudinary } from "../config.js";
import { formatBytes, getBillingDate, ITEMS_PER_PAGE, plans, sightEngineValidation, upload } from "../lib/utils.js";
import streamifier from "streamifier";
import crypto from "crypto";

const router = Router();

/**
 * This route returns the authenticated user's information.
 * - Uses the 'auth' middleware to verify the JWT and extract the user ID.
 * - If the user exists, returns the user's email, username, id, and subscription (with plan name) with a 200 status.
 * - If the user does not exist, returns a 404 error.
 * - Any other errors are logged and a generic 500 error is returned.
 */
router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate("subscription.plan");
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }
        const { _id, email, username, subscription } = user.toObject();
        subscription.plan = subscription.plan.name;
        const nextPaymentDate = await getBillingDate(user);
        res.status(200).send({
            id: String(_id),
            email,
            username,
            subscription,
            nextPaymentDate
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

/**
 * This route deletes the authenticated user's account and all related data.
 * - Uses the 'auth' middleware to verify the JWT and extract the user ID.
 * - If the user exists, deletes the user, their videos (from Cloudinary and DB), and their exchanges (removing references from other users).
 * - If the user does not exist, returns a 404 error.
 * - Any other errors are logged and a generic 500 error is returned.
 */
router.delete("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        await user.videos.forEach(async videoId => {
            await cloudinary.v2.uploader.destroy(`videos/${String(videoId)}`,
                {
                    resource_type: "video",
                    type: "private"
                }
            );
            await Video.findByIdAndDelete(videoId);
        });

        await user.exchanges.forEach(async exchangeId => {
            const exchange = await Exchange.findById(exchangeId);
            if (exchange) {
                await User.findByIdAndUpdate(exchange.initiator, {
                    $pull: { exchanges: exchange._id }
                });
                await User.findByIdAndUpdate(exchange.responder, {
                    $pull: { exchanges: exchange._id }
                });
                await exchange.deleteOne();
            }
        });

        await user.deleteOne();

        res.status(200).send({});
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

/**
 * Allows the authenticated user to upload a video.
 * - Uses 'auth' middleware for JWT verification.
 * - Accepts a video file and metadata, validates and saves them.
 * - Checks for duplicate videos by title (per user) and by file hash (global).
 * - Enforces plan limits for video size, library size, and total storage.
 * - Uploads the video to Cloudinary and saves the reference in the database.
 * - Triggers content moderation with Sightengine API if isSensitiveContent is false.
 * - Returns 201 on success, 400 for validation errors or plan limit exceeded, 409 for duplicates, and 500 for unexpected errors or upload failures.
 */
router.post("/me/videos", auth, upload.single("video"), async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate("videos").populate("subscription.plan");
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        if (!req.file) {
            return res.status(400).send({
                error: "Debe haber un archivo de video para subir"
            });
        }

        let keywords;
        try {
            keywords = JSON.parse(req.body.keywords);
        } catch (e) {
            keywords = undefined;
        }

        const hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

        const size = req.file.size;
        const plan = user.subscription.plan;

        if (size > plan.videoMaxSize) {
            return res.status(400).send({ error: `El video excede el tamaño máximo permitido de ${formatBytes(plan.videoMaxSize)} para el plan ${plans[plan.name]}.` });
        }

        if (user.videos.length >= plan.librarySize) {
            return res.status(400).send({ error: `Has alcanzado el máximo de ${plan.librarySize} videos permitidos para tu plan ${plans[plan.name]}.` });
        }

        const totalUsed = user.videos.length > 0 ? user.videos.reduce((acc, video) => acc + video.size) : 0;
        const nextTotal = totalUsed + size;
        if (nextTotal > plan.libraryStorage) {
            return res.status(400).send({ error: `Este video supera tu límite total de almacenamiento de ${formatBytes(plan.libraryStorage)} para el plan ${plans[plan.name]}.` });
        }

        const videoData = { ...req.body, keywords, users: [user._id], hash, size };
        const video = new Video(videoData);
        await video.validate();

        const titleFromUserExists = user.videos.some(video => video.title === videoData.title);
        if (titleFromUserExists) {
            return res.status(409).send({
                error: "Ya tienes un video con el mismo título."
            });
        }

        const videoExists = await Video.findOne({ hash });
        if (videoExists) {
            return res.status(409).send({
                error: "El video ya existe en la plataforma."
            });
        }

        const videoId = String(video._id);
        const result = cloudinary.v2.uploader.upload_stream(
            {
                folder: "videos",
                public_id: videoId,
                resource_type: "video",
                type: "private",
                eager: [
                    {
                        format: "mp4",
                        transformation: [
                            { quality: "auto", fetch_format: "auto" }
                        ]
                    }
                ]
            },
            (error) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ error: "Falló la subida del video" });
                }

                video.save().then(() => {
                    return User.findByIdAndUpdate(user._id, {
                        $push: { videos: video._id }
                    });
                });

                if (!video.isSensitiveContent)
                    sightEngineValidation(req.file.buffer, videoId);

                return res.status(201).send({});
            }
        );

        streamifier.createReadStream(req.file.buffer).pipe(result);
    } catch (e) {
        // Schema validations
        if (e.name == "ValidationError") {
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
 * Returns a list of videos uploaded by the authenticated user.
 * - Uses 'auth' middleware to verify JWT and extract user ID.
 * - Populates the user's videos and returns them with additional metadata.
 * - Each video includes a signed Cloudinary thumbnail URL and the username.
 * - Returns 200 with the videos array, 404 if the user does not exist, or 500 for unexpected errors.
 */
router.get("/me/videos", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate("videos");
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        const page = parseInt(req.query.page) || 0;
        const limit = ITEMS_PER_PAGE;

        const start = page * limit;
        const end = start + limit;

        const totalVideos = user.videos.length;
        const totalPages = Math.ceil(totalVideos / limit);

        const videos = user.videos.slice(start, end).map(video => {
            const { users, hash, __v, ...videoData } = video.toJSON();
            videoData.user = user.username;
            videoData.thumbnail = video.createThumbnail();

            return videoData;
        });

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
 * This route returns all videos for a given user by user ID.
 * - Requires authentication via the 'auth' middleware.
 * - Returns 404 if the user does not exist.
 * - Returns 400 if the user ID is invalid.
 * - On success, returns an array of video objects with user and thumbnail info.
 */
router.get("/:id/videos", auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate("videos");
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        const videos = user.videos.map(video => {
            const { users, hash, __v, ...videoData } = video.toJSON();
            videoData.user = user.username;
            videoData.thumbnail = video.createThumbnail();

            return videoData;
        });

        return res.status(200).send({ videos });
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
 * Returns a list of exchanges for the authenticated user.
 * - Uses 'auth' middleware to verify JWT and extract user ID.
 * - Populates the user's exchanges, sorting them by requestedDate (descending).
 * - For each exchange, includes usernames and video thumbnails for both initiator and responder.
 * - Adds the current user's role in the exchange ("initiator" or "responder").
 * - Includes a hasRated flag for accepted exchanges, indicating if the user has already rated the exchange.
 * - Returns 200 with the exchanges array, 404 if the user does not exist, or 500 for unexpected errors.
 */
router.get("/me/exchanges", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate({
            path: "exchanges",
            options: { sort: { requestedDate: -1 } }
        });
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        const page = parseInt(req.query.page) || 0;
        const limit = ITEMS_PER_PAGE;

        const start = page * limit;
        const end = start + limit;

        const totalExchanges = user.exchanges.length;
        const totalPages = Math.ceil(totalExchanges / limit);

        const exchanges = await Promise.all(user.exchanges.slice(start, end).map(async (exchange) => {
            const initiator = await User.findById(exchange.initiator);
            const responder = await User.findById(exchange.responder);
            const initiatorUser = initiator ? initiator.username : "indefinido";
            const responderUser = responder ? responder.username : "indefinido";

            const initiatorVideo = await Video.findById(exchange.initiatorVideo);
            const responderVideo = await Video.findById(exchange.responderVideo);

            let hasRated = false;
            if (exchange.status == "accepted") {
                hasRated = await Rating.exists({
                    exchangeId: exchange._id,
                    ratingUser: exchange.initiator.equals(user._id) ? exchange.initiator._id : exchange.responder._id
                });
            }

            const { _id, status, requestedDate } = exchange.toJSON();
            const exchangeData = {
                _id,
                status,
                requestedDate,
                initiator: initiatorUser,
                responder: responderUser,
                initiatorVideoUrl: initiatorVideo ? initiatorVideo.createThumbnail() : null,
                responderVideoUrl: responderVideo.createThumbnail(),
                user: exchange.initiator.equals(user._id) ? "initiator" : "responder",
                hasRated
            }

            return exchangeData;
        }));

        return res.status(200).send({
            exchanges,
            totalPages
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

export default router;