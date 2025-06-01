import { Router } from "express";
import User from "../models/User.js";
import Video from "../models/Video.js";
import auth from "../middleware/auth.js";
import { cloudinary, HOST, SIGHTENGINE_API_SECRET } from "../config.js";
import { upload } from "../lib/utils.js";
import streamifier from "streamifier";
import crypto from "crypto";
import { Readable } from "stream";
import axios from "axios";
import FormData from "form-data";

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
 * - Triggers content moderation with Sightengine API.
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
                folder: `videos/${videoId}`,
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
 * Handles video content moderation using the Sightengine API.
 * Sends the uploaded video buffer for analysis (nudity, weapons, drugs, medical, gore, self-harm, violence).
 * Sets up callback for asynchronous moderation results.
 * Logs any errors from the API.
 *
 * @param {Buffer} buffer - The video file buffer to analyze.
 * @param {string} videoId - The unique video ID for naming and callback reference.
 */
export function sightEngineValidation(buffer, videoId) {
    const stream = Readable.from(buffer);

    const data = new FormData();
    data.append("media", stream, {
        filename: `${videoId}.mp4`,
        contentType: "video/mp4"
    });
    // models to apply
    data.append("models", "nudity-2.1,weapon,recreational_drug,medical,gore-2.0,self-harm,violence");
    data.append("callback_url", HOST + "/videos/sightengine");
    data.append("api_user", "54483249");
    data.append("api_secret", SIGHTENGINE_API_SECRET);

    axios({
        method: "post",
        url: "https://api.sightengine.com/1.0/video/check.json",
        data: data,
        headers: data.getHeaders()
    })
        .catch(function (error) {
            // handle error
            if (error.response) console.log(error.response.data);
            else console.log(error.message);
        });
}

export default router;