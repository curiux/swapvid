import { Router } from "express";
import Rating from "../models/Rating.js";
import Exchange from "../models/Exchange.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();

/**
 * Creates a new rating for an exchange.
 * - Requires authentication via the 'auth' middleware.
 * - Validates that the user exists and has not already rated this exchange.
 * - Accepts rating data in the request body (excluding createdAt, which is ignored).
 * - Returns 201 on success, 409 if the user already rated this exchange, 400 for validation errors, and 500 for unexpected errors.
 */
router.post("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        const { createdAt, ...ratingData } = req.body;
        ratingData.ratingUser = user._id;

        const exists = await Rating.exists({
            exchangeId: ratingData.exchangeId,
            ratingUser: ratingData.ratingUser
        });

        if (exists) {
            return res.status(409).send({
                error: "Este usuario ya envió una calificación para este intercambio"
            });
        }

        await Rating.create(ratingData);

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
 * Retrieves the rating for a specific exchange by the authenticated user.
 * - Requires authentication via the 'auth' middleware.
 * - Validates that the user and exchange exist.
 * - Returns the rating value, comment, and creation date if found.
 * - Returns 200 with the rating data, 404 if the user does not exist, 400 if the exchange or rating does not exist, or 500 for unexpected errors.
 */
router.get("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        const exchange = await Exchange.findById(req.query.exchangeId);
        if (!exchange) {
            return res.status(400).send({
                error: "No existe un intercambio con este id"
            });
        }

        const rating = await Rating.findOne({
            exchangeId: exchange._id,
            ratingUser: user._id
        });

        if (!rating) {
            return res.status(400).send({
                error: "No existe una calificación con estos datos"
            });
        }

        const ratingValue = rating.rating;
        const { comment, createdAt } = rating.toJSON();

        res.status(200).send({ data: {
            rating: ratingValue,
            comment,
            createdAt
        } });
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