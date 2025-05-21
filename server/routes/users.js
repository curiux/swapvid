import { Router } from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import mongoose from "mongoose";

const router = Router();

/**
 * This route returns the authenticated user's information.
 * It uses the 'auth' middleware to verify the JWT and extract the user ID.
 * If the user exists, it returns the user's email, username, and id with a 200 status.
 * If the user does not exist, it returns a 404 error.
 * Any other errors are logged and a generic 500 error is returned.
 */
router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }
        const { _id, email, username } = user.toObject();
        const userData = { email, username };
        userData.id = String(_id);
        res.status(200).send(userData);
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

router.delete("/me", auth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }
        res.status(200).send({});
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

export default router;