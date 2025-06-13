import { Router } from "express";
import auth from "../middleware/auth.js";
import Exchange from "../models/Exchange.js";

const router = Router();

/**
 * Exchange routes for handling video exchange requests between users.
 *
 * Endpoints:
 * - POST /request: Creates a new exchange request between users.
 *   - Requires authentication via 'auth' middleware.
 *   - Accepts exchange details in the request body.
 *   - Returns 201 on success, 400 for validation errors, and 500 for unexpected errors.
 */
router.post("/request", auth, async (req, res) => {
    try {
        await Exchange.create(req.body);
        res.status(201).send({});
    } catch (e) {
        // Schema validations
        if (e.name == "ValidationError") {
            let message = "";
            for (const error in e.errors) {
                if (e.errors[error].name == "CastError") {
                    message += "El campo " + e.errors[error].path + " es inválido." + "\n";
                } else {
                    message += e.errors[error].message + "\n";
                }
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