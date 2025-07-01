import { Router } from "express";
import Plan from "../models/Plan.js";

const router = Router();

/**
 * Returns a list of all available subscription plans.
 * - Fetches all plans from the database, excluding the __v field.
 * - Responds with an array of plan objects on success (status 200).
 * - On error, logs the error and responds with status 500 and an error message.
 */
router.get("/", async (req, res) => {
    try {
        const plans = (await Plan.find({})).map(plan => {
            const { __v, ...planData } = plan.toJSON();

            return planData;
        });

        return res.status(200).send({ plans });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

export default router;