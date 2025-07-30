import { Router } from "express";
import User from "../models/User.js";
import Video from "../models/Video.js";
import auth from "../middleware/auth.js";
import Exchange from "../models/Exchange.js";

const router = Router();

/**
 * Retrieves user statistics.
 * - Requires authentication via the 'auth' middleware.
 * - Checks if the user exists and has a subscription plan other than 'basic'.
 * - Returns total video views, total exchanges, exchange counts by status, top videos, and a list of all videos.
 * - Returns 404 if the user does not exist, 403 if access is denied, or 500 for unexpected errors.
 */
router.get("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate("subscription.plan");
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        if (user.subscription.plan.name == "basic") {
            return res.status(403).send({
                error: "No tienes acceso"
            });
        }

        const totalViewsAgg = await Video.aggregate([
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
                    totalViews: { $sum: "$views" }
                }
            }
        ]);
        const totalViews = totalViewsAgg[0]?.totalViews | 0;

        const totalExchanges = await Exchange.countDocuments({
            $or: [
                { initiator: user._id },
                { responder: user._id }
            ]
        });

        const exchangesByStatus = await Exchange.aggregate([
            {
                $match: {
                    $or: [
                        { initiator: user._id },
                        { responder: user._id }
                    ]
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const exchangeCounts = {
            pending: 0,
            accepted: 0,
            rejected: 0
        }

        for (const item of exchangesByStatus) {
            exchangeCounts[item._id] = item.count;
        }

        const topVideosQ = await Video.find({
            $expr: {
                $eq: [
                    { $arrayElemAt: ["$users", -1] },
                    user._id
                ]
            }
        }).sort({ views: -1 }).limit(5);

        const topVideos = topVideosQ.map(video => {
            const thumbnail = video.createThumbnail();

            return {
                _id: video._id,
                thumbnail,
                title: video.title,
                views: video.views
            }
        });

        const videos = await Video.find(
            {
                $expr: {
                    $eq: [
                        { $arrayElemAt: ["$users", -1] },
                        user._id
                    ]
                }
            },
            { title: 1 }
        ).lean();

        res.status(200).send({
            totalViews,
            totalExchanges,
            exchangeCounts,
            topVideos,
            videos
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

/**
 * Retrieves statistics for a specific video.
 * - Requires authentication via the 'auth' middleware.
 * - Checks if the user exists and has a subscription plan other than 'basic'.
 * - Returns video details including title, thumbnail, and either views or exchange count based on the query type.
 * - Returns 404 if the user or video does not exist, 403 if access is denied, or 500 for unexpected errors.
 */
router.get("/videos/:id", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate("subscription.plan");
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        if (user.subscription.plan.name == "basic") {
            return res.status(403).send({
                error: "No tienes acceso"
            });
        }

        const video = await Video.findOne({
            _id: req.params.id,
            $expr: {
                $eq: [{ $arrayElemAt: ["$users", -1] }, user._id]
            }
        });
        if (!video) {
            return res.status(404).send({
                error: "El video no existe"
            });
        }

        const thumbnail = video.createThumbnail();

        const videoData = {
            _id: video._id,
            thumbnail,
            title: video.title
        }

        if (req.query.type == "views") {
            videoData.views = video.views;
        } else {
            videoData.exchangesCount = await Exchange.countDocuments({
                $or: [
                    { initiatorVideo: video._id },
                    { responderVideo: video._id }
                ]
            });
        }

        return res.status(200).send({ data: videoData });
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

export default router;