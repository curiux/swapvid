import { Router } from "express";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { HOST, MP_ACCESS_TOKEN } from "../config.js";
import Plan from "../models/Plan.js";
import auth from "../middleware/auth.js";

const config = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

const router = Router();

router.post("/", auth, async (req, res) => {
    try {
        const subscriptionCost = 100;
        const planId = (await Plan.findOne({
            name: "premium"
        })).preApprovalId;

        const preApproval = new PreApproval(config);
        const newSubscriber = await preApproval.create({
            body: {
                payer_email: req.body.email,
                preapproval_plan_id: planId,
                card_token_id: req.body.cardTokenId,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: subscriptionCost,
                    currency_id: "UYU"
                },
                reason: "Suscripción Mensual",
                status: "pending",
                back_url: HOST
            }
        });

        res.status(200).send({ newSubscriber });
    } catch (e) {
        if (e.message && e.status) {
            return res.status(e.status).send({
                error: e.message
            });
        }

        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

router.post("/webhook", async (req, res) => {
    try {

    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

export default router;