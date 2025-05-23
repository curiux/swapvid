import { Router } from "express";
import User from "../models/User.js";
import { generateToken } from "../lib/jwt.js";

const router = Router();

/**
 * This function handles user login
 * It attempts to find a user by email or username and checks the password.
 * On success, it generates a JWT token and returns it with a 200 status.
 * If credentials are incorrect, it returns a 401 status with an error message.
 * Any other errors are logged and a generic 500 error is returned.
 */
router.post("/", async (req, res) => {
    try {
        let user;
        if (req.body.email) {
            user = await User.findOne({ email: req.body.email });
        } else {
            user = await User.findOne({ username: req.body.username });
        }
        if (user) {
            const isMatch = await user.comparePassword(req.body.password);
            if (isMatch) {
                const token = generateToken({ _id: user._id });
                return res.status(200).send({ token });
            }
        }
        res.status(401).send({ error: "Credenciales incorrectas" });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

export default router;