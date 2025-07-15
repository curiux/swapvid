import mongoose from "mongoose";
import { videoCategoryIds } from "../lib/utils.js";
import { cloudinary } from "../config.js";

const { Schema, model } = mongoose;

/**
 * Mongoose schema for the Video model.
 *
 * Defines the structure, validation rules, and instance methods for video documents in the database.
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
 * - size: Number of bytes of the video file (required).
 * - duration: Number of seconds of the video file (required).
 * - rating: Object containing:
 *     - value: The video's average rating (number).
 *     - count: The number of ratings received (number).
 *
 * Instance Methods:
 * - getCurrentUser(): Returns the most recent user associated with the video.
 * - createThumbnail(): Generates a secure Cloudinary URL for a video thumbnail (jpg).
 * - createSecureUrl(): Generates a secure Cloudinary URL for streaming the video (m3u8).
 * - createPreviewUrl(): Generates a secure Cloudinary URL for a preview segment of the video (m3u8).
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
    },
    size: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    rating: {
        value: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    }
});

videoSchema.methods.getCurrentUser = function () {
    return this.users[this.users.length - 1];
};

videoSchema.methods.createThumbnail = function () {
    const publicId = `videos/${String(this._id)}`;
    return cloudinary.v2.url(publicId, {
        resource_type: "video",
        type: "private",
        format: "jpg",
        start_offset: 1, // seconds into the video
        sign_url: true
    });
}

videoSchema.methods.createSecureUrl = function () {
    const publicId = `videos/${String(this._id)}`;
    return cloudinary.v2.url(publicId, {
        resource_type: "video",
        type: "private",
        format: "m3u8",
        sign_url: true
    });
}

videoSchema.methods.createPreviewUrl = async function () {
    let duration = this.duration * 0.2;
    if (duration < 1) duration = 1;
    if (duration > 30) duration = 30;
    
    const publicId = `videos/${String(this._id)}`;
    return cloudinary.v2.url(publicId, {
        resource_type: "video",
        type: "private",
        format: "m3u8",
        sign_url: true,
        start_offset: 0,
        duration
    });
}

const Video = model("Video", videoSchema);
export default Video;