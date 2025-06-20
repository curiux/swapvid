export const videoCategoryIds = [
    "entretenimiento",
    "educacion",
    "deportes",
    "musica",
    "ciencia_tecnologia",
    "comedia",
    "moda_belleza",
    "viajes_aventura",
    "gaming",
    "noticias_politica",
    "cocina_gastronomia",
    "arte_diseno",
    "animacion_cortometrajes",
    "salud_fitness",
    "vlogs_estilo_vida",
    "tutoriales",
    "cine_series",
    "eventos_conferencias",
    "mascotas_animales",
    "automoviles_mecanica",
    "otros"
];

import multer from "multer";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

import { HOST, SIGHTENGINE_API_SECRET } from "../config.js";
import { Readable } from "stream";
import axios from "axios";
import FormData from "form-data";
import mongoose from "mongoose";

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

/**
 * Mongoose validator factory to check if a referenced document exists.
 * Usage: Attach to a schema field to ensure the referenced ID exists in the specified model.
 * @param {string} modelName - The name of the Mongoose model to check.
 * @param {string} message - The error message to display if validation fails.
 * @returns {object} - Validator config for Mongoose schema.
 */
export const validateExists = (modelName, message) => ({
    validator: async function (id) {
        return await mongoose.model(modelName).exists({ _id: id });
    },
    message,
});

/**
 * Checks if the given user is the owner of the specified video.
 * @param {string} videoId - The ID of the video to check ownership for.
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<boolean>} - True if the user is the owner, false otherwise.
 */
export const validateIfOwner = async (videoId, userId) => {
    if (!userId) return false;

    const video = await mongoose.model("Video").findById(videoId);

    if (!video) return false;

    return video.getCurrentUser().toString() === userId.toString();
};