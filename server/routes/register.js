import { Router } from "express";
import User from "../models/User.js";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const user = await User.create({
            email: req.body.email,
            username: req.body.username,
            password: req.body.password
        });
        res.send(user).status(201);
    } catch (e) {
        // Schema validations
        if (e.name == "ValidationError") {
            let message = "";
            for (const error in e.errors) {
                message += e.errors[error].message + "\n";
            }
            res.send(message).status(400);
        // Data duplicated
        } else if (e.name == "MongoServerError" && e.code == 11000) {
            const attr = Object.keys(e.errorResponse.keyPattern)[0];
            if (attr == "email") {
                res.send("Ya existe una cuenta con ese email.").status(400);
            } else if (attr == "username") {
                res.send("Ya existe una cuenta con ese nombre de usuario.").status(400);
            }
        } else {
            res.send("Ha ocurrido un error inesperado").status(500);
        }
    }
});

export default router;