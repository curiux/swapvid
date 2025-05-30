import { Router } from "express";
import User from "../models/User.js";
import Video from "../models/Video.js";
import auth from "../middleware/auth.js";
import { cloudinary } from "../config.js";
import { upload } from "../lib/utils.js";
import streamifier from "streamifier";

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
 * This route allows the authenticated user to upload a video.
 * It uses the 'auth' middleware to verify the JWT and extract the user ID.
 * The video file is uploaded using the 'upload' middleware and stored in Cloudinary.
 * The video metadata is validated and saved in the database, referencing the uploading user.
 * Returns 201 on success, 400 for validation errors, and 500 for unexpected errors or upload failures.
 */
router.post("/me/videos", auth, upload.single("video"), async (req, res) => {
    try {
        const user = await User.findById(req.userId);
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

        const videoData = { ...req.body, keywords, users: [user._id] };
        const video = new Video(videoData);
        await video.validate();

        const result = cloudinary.v2.uploader.upload_stream(
            {
                folder: `videos/${String(video._id)}`,
                public_id: String(video._id),
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

                video.save();

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

export default router;