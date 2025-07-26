import { Router } from "express";
import User from "../models/User.js";
import crypto from "crypto";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import { HOST, MAILGUN_API_KEY } from "../config.js";

const router = Router();

/**
 * Handles password recovery requests.
 * - Finds the user by email.
 * - If the reset token is missing or expired, generates a new token and expiration, saves them, and sends a reset email.
 * - Always responds with 200 (does not reveal if the email exists).
 * - On error, logs and returns a 500 error.
 */
router.post("/", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            let expired = !user.resetToken;
            const resetTokenExpires = user.resetTokenExpires;
            if (!resetTokenExpires || resetTokenExpires < new Date()) {
                expired = true;
            }

            if (expired) {
                const token = crypto.randomBytes(32).toString("hex");
                const expiration = Date.now() + 60 * 60 * 1000;

                user.resetToken = token;
                user.resetTokenExpires = expiration;

                await user.save();
                await sendResetEmail(user.email, user.username, token);
            }
        }
        res.status(200).send({});
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

/**
 * Sends a password reset email to the user using Mailgun.
 * - Constructs a reset link with the provided token.
 * - Sends an HTML email with instructions and the reset link.
 * - Logs any errors encountered during sending.
 */
async function sendResetEmail(email, username, token) {
    const link = HOST + "/cambiar-contrasena?token=" + token;

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
        username: "api",
        key: MAILGUN_API_KEY
    });
    try {
        await mg.messages.create("sandbox473b7fbf11a34b63bd471d5f5b8286f5.mailgun.org", {
            from: "SwapVid <postmaster@sandbox473b7fbf11a34b63bd471d5f5b8286f5.mailgun.org>",
            to: ["brunocsx32@gmail.com"],
            subject: "Recuperación de contraseña",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Restablece tu contraseña</h2>
                    <p>Hola ${username},</p>
                    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
                    <p>Si no fuiste tú, puedes ignorar este correo.</p>
                    <p>Para restablecer tu contraseña, haz clic en el siguiente botón o copia y pega el enlace en tu navegador:</p>
                    <p>
                    <a href="${link}" style="display: inline-block; background-color: #0f182b; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Restablecer contraseña
                    </a>
                    </p>
                    <p>O usa este enlace:</p>
                    <p><a href="${link}">${link}</a></p>
                    <p>Este enlace expirará en 1 hora por motivos de seguridad.</p>
                    <p>Gracias,<br>El equipo de SwapVid</p>
                </div>
            `
        });
    } catch (error) {
        console.log(error);
    }
}

export default router;