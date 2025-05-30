import mongoose from "mongoose";
import { videoCategoryIds } from "../lib/utils.js";

const { Schema, model } = mongoose;

/**
 * Mongoose schema for the Video model.
 *
 * This schema defines the structure and validation rules for video documents in the database.
 *
 * Fields:
 * - title: Title of the video. Required, trimmed, 5-60 characters.
 * - description: Description of the video. Required, trimmed, 10-500 characters.
 * - category: Category of the video. Required, trimmed, lowercase, must be one of the allowed categories.
 * - keywords: Array of keywords for the video. Each keyword must be 2-20 characters, at least one required.
 * - users: Array of references to User documents associated with the video.
 */
const videoSchema = new Schema({
    title: {
        type: String,
        trim: true,
        required: "El título es obligatorio.",
        minlength: [5, "El título debe tener al menos 5 caracteres."],
        maxlength: [60, "El título no debe superar los 60 caracteres."]
    },
    description: {
        type: String,
        trim: true,
        required: "La descripción es obligatoria.",
        minlength: [10, "La descripción debe tener al menos 10 caracteres."],
        maxlength: [500, "La descripción no debe superar los 500 caracteres."]
    },
    category: {
        type: String,
        trim: true,
        lowercase: true,
        required: "La categoría es obligatoria.",
        enum: {
            values: videoCategoryIds,
            message: "La categoría seleccionada no es válida."
        }
    },
    keywords: {
        type: [{
            type: String,
            minlength: [2, "Cada palabra clave debe tener al menos 2 caracteres."],
            maxlength: [20, "Cada palabra clave no debe superar los 20 caracteres."]
        }],
        validate: {
            validator: function (arr) {
                return Array.isArray(arr) && arr.length >= 1;
            },
            message: "Debe haber al menos una palabra clave."
        }
    },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

const Video = model("Video", videoSchema);
export default Video;