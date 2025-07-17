import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

/**
 * Mongoose schema for the User model.
 *
 * This schema defines the structure and validation rules for user documents in the database.
 * 
 * Fields:
 * - email: User's email address. Must be unique, lowercase, trimmed, required, and match a valid email format.
 * - username: User's chosen username. Must be unique, trimmed, required, and match a pattern allowing 5-32 alphanumeric characters or underscores.
 * - password: User's password. Required and must match a pattern enforcing 8-32 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.
 * - videos: Array of references to Video documents owned by the user.
 * - exchanges: Array of references to Exchange documents related to the user.
 * - subscription: Object containing:
 *     - plan: Reference to the user's subscription Plan document.
 *     - subscriptionId: MercadoPago subscription/preapproval ID (string).
 * - rating: Object containing:
 *     - value: The user's average rating (number).
 *     - count: The number of ratings received (number).
 * - notifications: Array of references to Notification documents for the user.
 *
 * Middleware:
 * - Pre-save hook hashes the password using bcrypt before saving, only if the password is new or modified.
 *
 * Methods:
 * - comparePassword: Compares a candidate password with the stored hashed password using bcrypt.
 */

const userSchema = new Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: "El email es obligatorio.",
        match: [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, "El email no es válido."]
    },
    username: {
        type: String,
        trim: true,
        unique: true,
        required: "El nombre de usuario es obligatorio.",
        match: [
            /^[a-zA-Z0-9_]{5,32}$/,
            "El nombre de usuario solo puede contener letras, números y guiones bajos, y debe tener entre 5 y 32 caracteres."]
    },
    password: {
        type: String,
        required: "La contraseña es obligatoria.",
        match: [
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,32}$/,
            "La contraseña debe tener entre 8 y 32 caracteres, por lo menos una mayúscula y una minúscula, un número y un carácter especial."
        ]
    },
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    exchanges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exchange" }],
    subscription: {
        plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
        subscriptionId: { type: String }
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
    },
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],
});

const SALT_ROUNDS = 10;

userSchema.pre("save", async function (next) {
    // Only hash the password if it was modified or is new
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = model("User", userSchema);
export default User;