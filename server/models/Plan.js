import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Mongoose schema for the Plan model.
 *
 * Defines the structure and validation rules for plan documents in the database.
 *
 * Fields:
 * - name: Required, unique, trimmed, lowercase string for the plan name.
 * - monthlyPrice: Required number for the monthly price.
 * - libraryStorage: Required number for the storage limit in bytes.
 * - librarySize: Required number for the maximum number of videos.
 * - videoMaxSize: Required number for the maximum size per video in bytes.
 * - exchangeLimit: Required number for the exchange limit.
 * - stats: Boolean flag for statistics feature (default: false).
 * - exchangePriority: Boolean flag for exchange priority (default: false).
 * - searchPriority: Boolean flag for search priority (default: false).
 * - supportPriority: Boolean flag for support priority (default: false).
 * - preApprovalId: String for MercadoPago pre-approval plan ID.
 */

const planSchema = new Schema({
    name: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: "El nombre es obligatorio."
    },
    monthlyPrice: {
        type: Number,
        required: "El precio mensual es obligatorio."
    },
    libraryStorage: {
        type: Number,
        required: "El almacenamiento de la biblioteca es obligatorio."
    },
    librarySize: {
        type: Number,
        required: "La cantidad de videos máxima es obligatoria."
    },
    videoMaxSize: {
        type: Number,
        required: "El tamaño máximo de cada video es obligatorio."
    },
    exchangeLimit: {
        type: Number,
        required: "El limite de intercambios es obligatorio."
    },
    stats: { type: Boolean, default: false },
    exchangePriority: { type: Boolean, default: false },
    searchPriority: { type: Boolean, default: false },
    supportPriority: { type: Boolean, default: false },
    preApprovalId: { type: String }
});

const Plan = model("Plan", planSchema);

export default Plan;