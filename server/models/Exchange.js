import mongoose from "mongoose";
import { validateExists, validateIfOwner } from "../lib/utils.js";

const { Schema, model } = mongoose;

/**
 * Exchange Mongoose Model
 *
 * Defines the structure and validation rules for exchange documents in the database.
 *
 * Fields:
 * - initiator: Reference to the User initiating the exchange (required).
 * - responder: Reference to the User responding to the exchange (required).
 * - initiatorVideo: Reference to the Video offered by the initiator.
 * - responderVideo: Reference to the Video offered by the responder (required, must belong to responder).
 * - status: Status of the exchange (pending, accepted, rejected; default: pending).
 * - requestedDate: Date the exchange was requested (default: now).
 *
 * Validation:
 * - All referenced users and videos must exist in the database.
 * - Video ownership is enforced: initiatorVideo must belong to initiator, responderVideo must belong to responder.
 * - Uses async validation for existence and ownership checks.
 */

const exchangeSchema = new Schema({
    initiator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: "Se necesita el id del usuario iniciador del intercambio",
        validate: validateExists("User", "El usuario iniciador no existe")
    },
    responder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: "Se necesita el id del usuario receptor del intercambio",
        validate: validateExists("User", "El usuario receptor no existe")
    },
    initiatorVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        validate: [
            validateExists("Video", "El video del usuario iniciador no existe"),
            {
                validator: async function (videoId) {
                    return await validateIfOwner(videoId, this.initiator)
                },
                message: "El video no pertenece al usuario iniciador"
            }
        ]
    },
    responderVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: "Se necesita el id de un video del receptor del intercambio",
        validate: [
            validateExists("Video", "El video del usuario receptor no existe"),
            {
                validator: async function (videoId) {
                    return await validateIfOwner(videoId, this.responder)
                },
                message: "El video no pertenece al usuario receptor"
            }
        ]
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    requestedDate: {
        type: Date,
        default: Date.now
    }
});

const Exchange = model("Exchange", exchangeSchema);
export default Exchange;