import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

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
    }
});

const SALT_ROUNDS = 10;

userSchema.pre("save", async function (next) {
    // Solo cifrar si la contraseña fue modificada o es nueva
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