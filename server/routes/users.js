import { Router } from "express";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Rating from "../models/Rating.js";
import Exchange from "../models/Exchange.js";
import Notification from "../models/Notification.js";
import auth from "../middleware/auth.js";
import { cloudinary, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from "../config.js";
import { ITEMS_PER_PAGE, plans } from "../lib/constants.js";
import { formatBytes, getMonthlyExchangeCount, upload, validateSubscription } from "../lib/utils.js";

const router = Router();

/**
 * Returns the authenticated user's profile information.
 * - Uses the 'auth' middleware to verify the JWT and extract the user ID.
 * - If the user exists, returns the user's id, email, username, and subscription details (plan name, cancellation status, next payment date) with a 200 status.
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
        const { _id, email, username } = user.toObject();
        const { plan, isCancelled, nextPaymentDate } = await validateSubscription(user);
        res.status(200).send({
            id: String(_id),
            email,
            username,
            subscription: {
                plan: plan.name
            },
            isCancelled,
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
 * Updates the authenticated user's email, username, and optionally password.
 * - Uses the 'auth' middleware to verify the JWT and extract the user ID.
 * - Validates and updates the user's email, username, and password if provided.
 * - Handles schema validation errors and duplicate email/username errors.
 * - Returns 200 on success, 400 for validation errors, 409 for duplicates, 404 if user not found, and 500 for unexpected errors.
 */
router.patch("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        user.email = req.body.email;
        user.username = req.body.username;

        if (req.body.password) {
            user.password = req.body.password;
        }

        await user.save();
        res.status(200).send({});
    } catch (e) {
        // Schema validations
        if (e.name == "ValidationError") {
            let message = "";
            for (const error in e.errors) {
                message += e.errors[error].message + "\n";
            }
            res.status(400).send({ error: message });
            // Data duplicated
        } else if (e.name == "MongoServerError" && e.code == 11000) {
            const attr = Object.keys(e.errorResponse.keyPattern)[0];
            if (attr == "email") {
                res.status(409).send({
                    error: "Ya existe una cuenta con ese email.",
                    field: "email"
                });
            } else if (attr == "username") {
                res.status(409).send({
                    error: "Ya existe una cuenta con ese nombre de usuario.",
                    field: "username"
                });
            }
        } else {
            console.log(e);
            res.status(500).send({
                error: "Ha ocurrido un error inesperado"
            });
        }
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
 * Uploads a new video for the authenticated user.
 * - Uses 'auth' middleware to verify JWT and extract the user ID.
 * - Handles video file upload via 'multer' middleware.
 * - Validates video metadata, keywords, hash, and size against the user's subscription plan:
 *   - Checks maximum file size, total library size, and total storage limit.
 *   - Ensures the user does not already have a video with the same title.
 *   - Ensures the video is unique across the platform by hash.
 * - Saves the video in the database and associates it with the user.
 * - Generates a signed Cloudinary signature for secure video upload.
 * - Returns 201 with the Cloudinary signature, timestamp, cloud name, API key, and public ID on success.
 * - Returns 400 for validation errors, 409 for duplicate videos, 404 if the user does not exist, and 500 for unexpected errors.
 */
router.post("/me/videos", auth, upload.single("video"), async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate("subscription.plan");
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        let keywords;
        try {
            keywords = JSON.parse(req.body.keywords);
        } catch (e) {
            keywords = undefined;
        }

        const hash = req.body.hash;
        const size = req.body.size;
        const { plan } = await validateSubscription(user);

        if (size > plan.videoMaxSize) {
            return res.status(400).send({ error: `El video excede el tamaño máximo permitido de ${formatBytes(plan.videoMaxSize)} para el plan ${plans[plan.name]}.` });
        }

        const videosCount = await Video.countDocuments({
            $expr: {
                $eq: [
                    { $arrayElemAt: ["$users", -1] },
                    user._id
                ]
            }
        });
        if (videosCount >= plan.librarySize) {
            return res.status(400).send({ error: `Has alcanzado el máximo de ${plan.librarySize} videos permitidos para tu plan ${plans[plan.name]}.` });
        }

        const totalUsedAgg = await Video.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [
                            { $arrayElemAt: ["$users", -1] },
                            user._id
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSize: { $sum: "$size" }
                }
            }
        ]);
        const totalUsed = totalUsedAgg[0]?.totalSize || 0;

        const nextTotal = totalUsed + size;
        if (nextTotal > plan.libraryStorage) {
            return res.status(400).send({ error: `Este video supera tu límite total de almacenamiento de ${formatBytes(plan.libraryStorage)} para el plan ${plans[plan.name]}.` });
        }

        const videoData = { ...req.body, keywords, users: [user._id], hash, size };
        const video = new Video(videoData);
        await video.validate();

        const titleFromUserExists = await Video.exists({
            $expr: {
                $and: [
                    {
                        $eq: [
                            { $arrayElemAt: ["$users", -1] },
                            user._id
                        ]
                    },
                    {
                        $eq: ["$title", videoData.title]
                    }
                ]
            }
        });
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

        await video.save();
        await User.findByIdAndUpdate(user._id, {
            $push: { videos: video._id }
        });

        const timestamp = Math.floor(Date.now() / 1000);

        // Generate signature
        const signature = cloudinary.v2.utils.api_sign_request({
            public_id: videoId,
            timestamp,
            folder: "videos",
            type: "private"
        }, CLOUDINARY_API_SECRET);

        return res.status(201).json({
            signature,
            timestamp,
            cloudName: CLOUDINARY_CLOUD_NAME,
            apiKey: CLOUDINARY_API_KEY,
            publicId: videoId
        });
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
 * Returns a paginated list of videos uploaded by the authenticated user.
 * - Uses 'auth' middleware to verify JWT and extract user ID.
 * - Supports pagination via the 'page' query parameter (default: 0).
 * - Each video includes all metadata (except users, hash, __v), the username, and a signed Cloudinary thumbnail URL.
 * - Responds with: videos, totalPages, storageUsed, storageLimit, libraryMaxSize, hasStats.
 * - 404 if the user does not exist, 500 for unexpected errors.
 */
router.get("/me/videos", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate("subscription.plan");
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        const page = parseInt(req.query.page) || 0;
        const limit = ITEMS_PER_PAGE;
        const skip = page * limit;

        const videosCount = await Video.countDocuments({
            $expr: {
                $eq: [
                    { $arrayElemAt: ["$users", -1] },
                    user._id
                ]
            }
        });
        const totalPages = Math.ceil(videosCount / limit);

        const pageVideos = await Video.find({
            $expr: {
                $eq: [
                    { $arrayElemAt: ["$users", -1] },
                    user._id
                ]
            }
        }).skip(skip).limit(limit);

        const videos = pageVideos.map(video => {
            const { users, hash, __v, ...videoData } = video.toJSON();
            videoData.user = user.username;
            videoData.thumbnail = video.createThumbnail();

            return videoData;
        });

        const totalUsedAgg = await Video.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [
                            { $arrayElemAt: ["$users", -1] },
                            user._id
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSize: { $sum: "$size" }
                }
            }
        ]);
        const storageUsed = totalUsedAgg[0]?.totalSize || 0;
        const storageLimit = user.subscription.plan.libraryStorage;
        const libraryMaxSize = user.subscription.plan.librarySize;

        const hasStats = user.subscription.plan.name != "basic";

        return res.status(200).send({
            videos,
            totalPages,
            storageUsed,
            storageLimit,
            libraryMaxSize,
            hasStats
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
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        const videoList = await Video.find({
            $expr: {
                $eq: [
                    { $arrayElemAt: ["$users", -1] },
                    user._id
                ]
            }
        });

        const videos = videoList.map(video => {
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
        }).populate("subscription.plan");
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
                responderVideoUrl: responderVideo ? responderVideo.createThumbnail() : null,
                user: exchange.initiator.equals(user._id) ? "initiator" : "responder",
                hasRated
            }

            return exchangeData;
        }));

        const monthlyExchangeCount = await getMonthlyExchangeCount(user._id);
        const monthlyExchangeLimit = user.subscription.plan.exchangeLimit;

        return res.status(200).send({
            exchanges,
            monthlyExchangeCount,
            monthlyExchangeLimit,
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
 * Returns a paginated list of notifications for the authenticated user.
 * - Uses 'auth' middleware to verify JWT and extract user ID.
 * - Populates the user's notifications and returns them with sender info and message.
 * - Calculates the unread notification count and total pages.
 * - Returns 200 with notifications array, unread count, and total pages; 404 if user does not exist; 500 for unexpected errors.
 */
router.get("/me/notifications", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate("notifications");
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        const page = parseInt(req.query.page) || 0;
        const limit = ITEMS_PER_PAGE;

        const start = page * limit;
        const end = start + limit;

        const totalNotifications = user.notifications.length;
        const totalPages = Math.ceil(totalNotifications / limit);

        let unreadCount = 0;
        const notifications = await Promise.all(user.notifications.slice(start, end).map(async (notification) => {
            const exchange = await Exchange.findById(notification.exchange);

            const isInitiator = String(user._id) == exchange.initiator;
            const sender = await User.findById(isInitiator ? exchange.responder : exchange.initiator);
            const senderUsername = sender ? sender.username : "indefinido";
            let message = "";

            switch (notification.type) {
                case "exchange_requested":
                    message = senderUsername + " te ha enviado una solicitud de intercambio.";
                    break;
                case "exchange_accepted":
                    message = "¡" + senderUsername + " ha aceptado tu solicitud de intercambio!";
                    break;
                case "exchange_rejected":
                    message = senderUsername + " ha rechazado tu solicitud de intercambio.";
                    break;
                default:
                    break;
            }

            if (!notification.isRead) unreadCount++;

            return {
                _id: notification._id,
                type: notification.type,
                isRead: notification.isRead,
                createdAt: notification.createdAt,
                message
            };
        }));

        return res.status(200).send({
            notifications,
            unreadCount,
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
 * Marks a specific notification as read for the authenticated user.
 * - Uses 'auth' middleware to verify JWT and extract user ID.
 * - Finds the notification by ID and updates its isRead status to true.
 * - Returns 200 on success, 404 if notification does not exist, or 500 for unexpected errors.
 */
router.patch("/me/notifications/:id", auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).send({
                error: "La notificación no existe"
            });
        }

        notification.isRead = true;
        await notification.save();
        res.status(200).send({});
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

/**
 * Marks all notifications as read for the authenticated user.
 * - Uses 'auth' middleware to verify JWT and extract user ID.
 * - Updates all notifications for the user, setting isRead to true.
 * - Returns 200 on success, 404 if user does not exist, or 500 for unexpected errors.
 */
router.patch("/me/notifications", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        await Notification.updateMany(
            { user: user._id },
            { $set: { isRead: true } }
        );

        res.status(200).send({});
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

export default router;