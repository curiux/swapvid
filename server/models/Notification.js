import mongoose from "mongoose";
import { validateExists } from "../lib/utils.js";

const { Schema, model } = mongoose;

/**
 * Mongoose schema for the Notification model.
 *
 * Defines the structure and validation rules for notification documents in the database.
 *
 * Fields:
 * - type: Required string, must be one of ["exchange_requested", "exchange_accepted", "exchange_rejected"].
 * - isRead: Boolean flag indicating if the notification has been read (default: false).
 * - exchange: Required ObjectId reference to Exchange, with existence validation.
 * - user: Required ObjectId reference to User.
 * - createdAt: Date of creation (default: now).
 */

const notificationSchema = new Schema({
    type: {
        type: String,
        enum: ["exchange_requested", "exchange_accepted", "exchange_rejected"],
        required: "El tipo es obligatorio."
    },
    isRead: {
        type: Boolean,
        default: false
    },
    exchange: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exchange",
        required: "Se necesita el id del intercambio",
        validate: validateExists("Exchange", "El intercambio no existe")
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = model("Notification", notificationSchema);

export default Notification;