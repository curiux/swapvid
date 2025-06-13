import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Mongoose schema for the Exchange model.
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
 * - responderVideo: Ensures the video belongs to the responder user.
 */
const exchangeSchema = new Schema({
    initiator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: "Se necesita el id del usuario iniciador del intercambio"
    },
    responder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: "Se necesita el id del usuario receptor del intercambio"
    },
    initiatorVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    responderVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: "Se necesita el id de un video del receptor del intercambio",
        validate: {
            validator: async function (videoId) {
                if (!this.responder) return false;

                const video = await mongoose.model("Video").findById(videoId);

                if (!video) return false;

                return video.getCurrentUser().toString() === this.responder.toString();
            },
            message: "El video no pertenece al usuario receptor.",
        }
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