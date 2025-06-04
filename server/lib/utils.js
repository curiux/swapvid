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