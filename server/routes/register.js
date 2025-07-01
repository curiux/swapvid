import { Router } from "express";
import User from "../models/User.js";
import Plan from "../models/Plan.js";
import { generateToken } from "../lib/jwt.js";

const router = Router();

/**
 * This function handles user registration
 * It attempts to create a new user with the provided email, username, and password.
 * On success, it generates a JWT token and returns it with a 201 status.
 * If a validation error occurs it returns a 400 status with the validation messages.
 * If a duplicate email or username is detected (MongoDB error code 11000) it returns a 409 status with a specific error message.
 * Any other errors are logged and a generic 500 error is returned.
 */
router.post("/", async (req, res) => {
    try {
        const basicPlan = await Plan.findOne({
            name: "basic"
        });
        const user = await User.create({
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
            subscription: {
                plan: basicPlan._id
            }
        });
        const token = generateToken({ _id: user._id });
        res.status(201).send({ token });
    } catch (e) {
        // Schema validations
        if (e.name == "ValidationError") {
            let message = "";
            for (const error in e.errors) {
                message += e.errors[error].message + "\n";
            }
            res.status(400).send({ error: message } );
        // Data duplicated
        } else if (e.name == "MongoServerError" && e.code == 11000) {
            const attr = Object.keys(e.errorResponse.keyPattern)[0];
            if (attr == "email") {
                res.status(409).send({
                    error: "Ya existe una cuenta con ese email.",
                    field: "email"
                });
            } else if (attr == "username") {
                res.status(409).send({
                    error: "Ya existe una cuenta con ese nombre de usuario.",
                    field: "username"
                });
            }
        } else {
            console.log(e);
            res.status(500).send({
                error: "Ha ocurrido un error inesperado"
            });
        }
    }
});

export default router;