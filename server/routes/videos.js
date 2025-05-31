import { Router } from "express";
import Video from "../models/Video.js";

const router = Router();

/**
 * Handles callbacks from the Sightengine API for video content moderation.
 *
 * - Receives POST requests from Sightengine when video analysis is finished.
 * - Iterates through all frames and checks for sensitive content (nudity, weapons, drugs, medical, gore, self-harm, violence) using defined probability thresholds.
 * - If any frame is flagged as sensitive, updates the corresponding Video document's isSensitiveContent field to true.
 * - Always responds with 204 No Content on success, or 500 on error.
 */
router.post("/sightengine", async (req, res) => {
    try {
        if (req.body.data && req.body.data.status == "finished") {
            let sensitive = false;
            for (const frame of req.body.data.frames) {
                const {
                    nudity,
                    weapon,
                    recreational_drug,
                    medical,
                    gore,
                    "self-harm": selfHarm,
                    violence
                } = frame;

                if (
                    nudity.sexual_activity > 0.05 ||
                    nudity.sexual_display > 0.1 ||
                    nudity.erotica > 0.2 ||
                    weapon?.classes?.weapon > 0.1 ||
                    recreational_drug.prob > 0.1 ||
                    medical.prob > 0.1 ||
                    gore.prob > 0.1 ||
                    selfHarm.prob > 0.1 ||
                    violence.prob > 0.1
                ) {
                    sensitive = true;
                }
            }

            if (sensitive) {
                const videoId = req.body.media.uri.split(".")[0];
                await Video.findByIdAndUpdate(videoId, {
                    isSensitiveContent: true
                });
            }
        }
        res.status(204).send();
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Ha ocurrido un error inesperado"
        });
    }
});

export default router;