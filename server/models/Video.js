import mongoose from "mongoose";
import { videoCategoryIds } from "../lib/utils.js";

const { Schema, model } = mongoose;

/**
 * Mongoose schema for the Video model.
 *
 * Defines the structure and validation rules for video documents in the database.
 *
 * Fields:
 * - title: Required, trimmed, 5-60 characters.
 * - description: Required, trimmed, 10-500 characters.
 * - category: Required, trimmed, lowercase, must be one of the allowed categories.
 * - keywords: Array of keywords, each 2-20 characters, at least one required.
 * - users: Array of references to User documents.
 * - uploadedDate: Date the video was uploaded (default: now).
 * - hash: String hash of the video file.
 * - isSensitiveContent: Boolean flag for sensitive content (default: false).
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
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    uploadedDate: {
        type: Date,
        default: Date.now
    },
    hash: { type: String },
    isSensitiveContent: {
        type: Boolean,
        default: false
    }
});

videoSchema.methods.getCurrentUser = function () {
    return this.users[this.users.length - 1];
};

const Video = model("Video", videoSchema);
export default Video;