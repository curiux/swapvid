import mongoose from "mongoose";
import { reportReasons } from "../lib/constants.js";
import { validateExists } from "../lib/utils.js";

/**
 * Mongoose schema for the Report model.
 *
 * Defines the structure and validation rules for report documents in the database.
 *
 * Fields:
 * - reason: Required, trimmed, must be one of the allowed report reasons.
 * - otherReason: Optional, trimmed, up to 100 characters, for custom reasons.
 * - details: Optional, trimmed, up to 500 characters, for additional information.
 * - status: Status of the report ("pending" or "resolved"), default is "pending".
 * - reporterId: Reference to the User who created the report (required, validated).
 * - reportedVideoId: Reference to the Video being reported (required, validated).
 * - exchangeId: Optional reference to an Exchange (validated if present).
 * - createdAt: Date the report was created (default: now).
 */

const { Schema, model } = mongoose;

const reportSchema = new Schema({
    reason: {
        type: String,
        trim: true,
        required: "La razón es obligatoria.",
        enum: {
            values: reportReasons,
            message: "La razón seleccionada no es válida."
        }
    },
    otherReason: {
        type: String,
        trim: true,
        maxlength: [100, "La razón del reporte no debe superar los 100 caracteres."]
    },
    details: {
        type: String,
        trim: true,
        maxlength: [500, "Los detalles adicionales no deben superar los 500 caracteres."]
    },
    status: {
        type: String,
        enum: ["pending", "resolved"],
        default: "pending"
    },
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: "Se necesita el id del usuario que realiza el reporte",
        validate: validateExists("User", "El usuario que realiza el reporte no existe")
    },
    reportedVideoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: "Se necesita el id del video a reportar",
        validate: validateExists("Video", "El video reportado no existe")
    },
    exchangeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exchange",
        validate: validateExists("Exchange", "El intercambio referenciado no existe")
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Report = model("Report", reportSchema);
export default Report;