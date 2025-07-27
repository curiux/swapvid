import { Router } from "express";
import User from "../models/User.js";
import { sendVerificationEmail } from "../lib/utils.js";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        if (user.isVerified) {
            return res.status(400).send({
                error: "El usuario ya verificó su email"
            });
        }

        if (user.verifyToken && user.verifyTokenExpires >= new Date()) {
            return res.status(400).send({
                error: "Solo puedes solicitar un nuevo enlace de verificación una vez por hora.",
                expires: user.verifyTokenExpires
            });
        }

        await sendVerificationEmail(user);

        res.status(200).send({});
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

export default router;