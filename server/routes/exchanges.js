import { Router } from "express";
import auth from "../middleware/auth.js";
import Exchange from "../models/Exchange.js";
import User from "../models/User.js";

const router = Router();

/**
 * Exchange routes for handling video exchange requests between users.
 *
 * Endpoints:
 * - POST /request: Creates a new exchange request between users.
 *   - Requires authentication via 'auth' middleware; the initiator is the authenticated user.
 *   - The responder is identified by username in the request body; the responder's video ID is also required.
 *   - Only the responder's video is required to initiate the request (initiator's video is not required at this stage).
 *   - On success, creates an Exchange document and updates both users' 'exchanges' arrays to include the new exchange.
 *   - Returns 201 on success, 404 if the responder user does not exist, 400 for validation errors, and 500 for unexpected errors.
 */
router.post("/request", auth, async (req, res) => {
    try {
        const initiator = req.userId;
        const responderUser = await User.findOne({ username: req.body.username });
        if (!responderUser) {
            return res.status(404).send({
                error: "El usuario receptor no existe"
            });
        }
        const responder = responderUser._id.toString();
        const data = {
            initiator,
            responder,
            responderVideo: req.body.videoId
        }
        const exchange = await Exchange.create(data);
        
        await User.findByIdAndUpdate(initiator, {
            $push: { exchanges: exchange._id }
        });
        await User.findByIdAndUpdate(responder, {
            $push: { exchanges: exchange._id }
        });

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