import { Router } from "express";
import auth from "../middleware/auth.js";
import Exchange from "../models/Exchange.js";
import User from "../models/User.js";

const router = Router();

/**
 * Creates a new exchange request between two users.
 * - Requires authentication via the 'auth' middleware.
 * - Checks if the responder user exists and if there is already a pending exchange between the users.
 * - On success, creates a new Exchange document and returns it.
 * - Returns 404 if the responder does not exist, 409 if a pending request exists, or 500 for unexpected errors.
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

        const hasRequest = await Exchange.exists({
            initiator: responder,
            responder: initiator,
            status: "pending"
        });

        const hasCounterRequest = await Exchange.exists({
            initiator: responder,
            responder: initiator,
            status: "pending"
        });

        if (hasRequest || hasCounterRequest) {
            return res.status(409).send({
                error: "Ya existe una petición de intercambio pendiente entre estos usuarios"
            });
        }
        
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

/**
 * Retrieves a specific exchange by its ID for the authenticated user.
 * - Requires authentication via the 'auth' middleware.
 * - Checks if the user exists and if the exchange exists.
 * - Only allows access if the user is the initiator or responder of the exchange.
 * - Returns 404 if the user does not exist, 400 if the exchange does not exist, 403 if unauthorized, or 500 for unexpected errors.
 */
router.get("/:id", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate("videos");
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        const exchange = await Exchange.findById(req.params.id);
        if (!exchange) {
            return res.status(400).send({
                error: "No existe un intercambio con este id"
            });
        }

        const { __v, ...exchangeData } = exchange.toJSON();

        if (exchange.initiator.equals(user._id)) {
            exchangeData.user = "initiator";
        } else if (exchange.responder.equals(user._id)) {
            exchangeData.user = "responder";
        } else {
            return res.status(403).send({
                error: "No tienes acceso a este intercambio."
            });
        }


        res.status(200).send({ data: exchangeData });
    } catch (e) {
        if (e.name == "CastError") {
            res.status(400).send({
                error: "Id inválido."
            });
        } else {
            console.log(e);
            res.status(500).send({
                error: "Ha ocurrido un error inesperado"
            });
        }
    }
});

export default router;