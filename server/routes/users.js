import { Router } from "express";
import User from "../models/User.js";
import Video from "../models/Video.js";
import auth from "../middleware/auth.js";
import { cloudinary } from "../config.js";
import { sightEngineValidation, upload } from "../lib/utils.js";
import streamifier from "streamifier";
import crypto from "crypto";

const router = Router();

/**
 * This route returns the authenticated user's information.
 * It uses the 'auth' middleware to verify the JWT and extract the user ID.
 * If the user exists, it returns the user's email, username, and id with a 200 status.
 * If the user does not exist, it returns a 404 error.
 * Any other errors are logged and a generic 500 error is returned.
 */
router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }
        const { _id, email, username } = user.toObject();
        const userData = { email, username };
        userData.id = String(_id);
        res.status(200).send(userData);
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

/**
 * This route deletes the authenticated user's account.
 * It uses the 'auth' middleware to verify the JWT and extract the user ID.
 * If the user exists, it deletes the user and returns a 200 status.
 * If the user does not exist, it returns a 404 error.
 * Any other errors are logged and a generic 500 error is returned.
 */
router.delete("/me", auth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }
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
 * - Uploads the video to Cloudinary and saves the reference in the database.
 * - Triggers content moderation with Sightengine API if isSensitiveContent is false.
 * - Returns 201 on success, 400 for validation errors, 409 for duplicates, and 500 for unexpected errors or upload failures.
 */
router.post("/me/videos", auth, upload.single("video"), async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate("videos");
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

        const videoData = { ...req.body, keywords, users: [user._id], hash };
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

        const videos = user.videos.map(video => {
            const { users, hash, __v, ...videoData } = video.toJSON();
            videoData.user = user.username;
            videoData.thumbnail = video.createThumbnail();

            return videoData;
        });

        return res.status(200).send({ videos });
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

export default router;