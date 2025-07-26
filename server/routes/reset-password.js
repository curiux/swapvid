import { Router } from "express";
import User from "../models/User.js";

const router = Router();

/**
 * Handles password reset requests.
 * - Finds the user by reset token.
 * - Validates that the token exists and has not expired.
 * - Updates the user's password, clears the reset token and expiration, and saves the user.
 * - Responds with 200 on success, 400 for validation errors or invalid/expired token, and 500 for unexpected errors.
 */
router.post("/", async (req, res) => {
    try {
        const user = await User.findOne({ resetToken: req.body.token });

        if (!user || user.resetTokenExpires < new Date()) {
            return res.status(400).send({
                error: "El token no es válido o ya ha expirado."
            });
        }

        user.password = req.body.password;
        user.resetToken = undefined;
        user.resetTokenExpires = undefined;
        await user.save();
        
        res.status(200).send({});
    } catch (e) {
        // Schema validations
        if (e.name == "ValidationError") {
            let message = "";
            for (const error in e.errors) {
                message += e.errors[error].message + "\n";
            }
            res.status(400).send({ error: message });
        } else {
            console.log(e);
            res.status(500).send({
                error: "Ha ocurrido un error inesperado"
            });
        }
    }
});

export default router;