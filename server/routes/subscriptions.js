import { Router } from "express";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { MP_ACCESS_TOKEN } from "../config.js";
import Plan from "../models/Plan.js";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

const config = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

const router = Router();

/**
 * Creates a new subscription for the authenticated user.
 * - Uses 'auth' middleware for JWT verification.
 * - Validates the user and plan existence.
 * - Cancels any existing MercadoPago subscription before creating a new one.
 * - Creates a new MercadoPago preapproval subscription with the provided email and card token.
 * - Updates the user's subscription info in the database.
 * - Returns 200 on success, 400/404/409 for validation errors, and 500 for unexpected errors.
 */
router.post("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                error: "El usuario no existe"
            });
        }

        const plan = await Plan.findById(req.body.planId);
        if (!plan) {
            return res.status(400).send({
                error: "No existe un plan con este id"
            });
        }

        if (String(user.subscription.plan) == String(plan._id)) {
            return res.status(409).send({
                error: "Ya estás suscrito con este plan"
            });
        }

        const preApproval = new PreApproval(config);

        if (user.subscription.subscriptionId) {
            await preApproval.update({
                id: user.subscription.subscriptionId,
                body: {
                    status: "cancelled"
                }
            });
        }

        const newSubscriber = await preApproval.create({
            body: {
                payer_email: req.body.email,
                preapproval_plan_id: plan.preApprovalId,
                card_token_id: req.body.cardTokenId,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: plan.monthlyPrice,
                    currency_id: "UYU"
                },
                status: "authorized"
            }
        });

        await user.updateOne({
            subscription: {
                plan: plan._id,
                subscriptionId: newSubscriber.subscription_id
            }
        });

        res.status(200).send({});
    } catch (e) {
        console.log(e);
        if (e.message && e.status) {
            return res.status(e.status).send({
                error: e.message,
                mp: true
            });
        }
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

/**
 * Cancels the authenticated user's current subscription and reverts to the basic plan.
 * - Uses 'auth' middleware for JWT verification.
 * - Validates the user and active subscription.
 * - Cancels the current MercadoPago subscription.
 * - Updates the user's subscription to the basic plan and removes the MercadoPago subscription ID.
 * - Returns 200 on success, 400/404 for validation errors, and 500 for unexpected errors.
 */
router.put("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).send({ error: "El usuario no existe" });
        }

        if (!user.subscription.subscriptionId) {
            return res.status(400).send({ error: "El usuario no tiene una suscripción activa" });
        }

        const preApproval = new PreApproval(config);

        await preApproval.update({
            id: user.subscription.subscriptionId,
            body: {
                status: "cancelled"
            }
        });

        const basicPlan = await Plan.findOne({
            name: "basic"
        });
        await user.updateOne({
            "subscription.plan": basicPlan._id,
            $unset: { "subscription.subscriptionId": "" }
        });

        res.status(200).send({});
    } catch (e) {
        console.log(e);
        if (e.message && e.status) {
            return res.status(e.status).send({ error: e.message, mp: true });
        }
        res.status(500).send({ error: "Ha ocurrido un error inesperado" });
    }
});

export default router;