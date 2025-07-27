import { Router } from "express";
import User from "../models/User.js";
import { generateToken } from "../lib/jwt.js";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const user = await User.findOne({ verifyToken: req.body.token });

        if (!user || user.verifyTokenExpires < new Date()) {
            return res.status(400).send({
                error: "El token no es válido o ya ha expirado."
            });
        }

        if (user.isVerified) {
            return res.status(400).send({
                error: "El usuario ya verificó su email"
            });
        }

        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpires = undefined;
        await user.save();

        const token = generateToken({ _id: user._id });
        res.status(200).send({ token });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

export default router;