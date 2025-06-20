import mongoose from "mongoose";
import { validateExists, validateIfOwner } from "../lib/utils.js";

const { Schema, model } = mongoose;

/**
 * Rating Mongoose Model
 *
 * Defines the structure and validation rules for rating documents in the database.
 *
 * Fields:
 * - exchangeId: Reference to the Exchange being rated (required, must exist).
 * - ratingUser: Reference to the User who is giving the rating (required, must exist).
 * - ratedUser: Reference to the User who is being rated (required, must exist).
 * - video: Reference to the Video being rated (required, must exist and belong to the ratingUser).
 * - rating: Numeric rating value (required, 1-5, allows .5 increments).
 * - createdAt: Date the rating was created (default: now).
 * - comment: Optional comment (max 500 chars, must be empty or at least 10 chars).
 *
 * Validation:
 * - All referenced documents must exist in the database.
 * - Video ownership is enforced: video must belong to the ratingUser.
 * - Rating value must be between 1 and 5, allowing .5 steps.
 * - Comment must be empty or at least 10 characters, up to 500 characters.
 */

const ratingSchema = new Schema({
    exchangeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exchange",
        required: "Se necesita el id del intercambio",
        validate: validateExists("Exchange", "El intercambio no existe")
    },
    ratingUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: "Se necesita el id del usuario que califica",
        validate: validateExists("User", "El usuario receptor no existe")
    },
    ratedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: "Se necesita el id del usuario calificado",
        validate: validateExists("User", "El usuario receptor no existe")
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: "Se necesita el id del video calificado",
        validate: [
            validateExists("Video", "El video a calificar no existe"),
            {
                validator: async function (videoId) {
                    return await validateIfOwner(videoId, this.ratingUser)
                },
                message: "El video no pertenece al usuario que califica"
            }
        ]
    },
    rating: {
        type: Number,
        required: "Se necesita la calificación",
        validate: {
            validator: function (val) {
                return val >= 1 && val <= 5 && val * 10 % 5 === 0;
            },
            message: "La calificación no es válida. Debe ser un número entero o terminar en .5, del 1 al 5"
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    comment: {
        type: String,
        maxlength: [500, "El comentario no debe superar los 500 caracteres"],
        validate: {
            validator: function (val) {
                return val.length === 0 || val.length >= 10;
            },
            message: "El comentario debe tener al menos 10 caracteres o dejarse vacío"
        }
    }
});

const Rating = model("Rating", ratingSchema);
export default Rating;