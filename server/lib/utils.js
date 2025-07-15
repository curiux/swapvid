export const videoCategoryIds = [
    "entertainment",
    "education",
    "sports",
    "music",
    "science_technology",
    "comedy",
    "fashion_beauty",
    "travel_adventure",
    "gaming",
    "news_politics",
    "cooking_gastronomy",
    "art_design",
    "animation_shortfilms",
    "health_fitness",
    "vlogs_lifestyle",
    "tutorials",
    "movies_series",
    "events_conferences",
    "pets_animals",
    "automobiles_mechanics",
    "other"
];

export const reportReasons = [
    "inappropriate_unmarked",
    "irrelevant_or_empty",
    "unauthorized_content",
    "duplicate_video",
    "other"
];

export const plans = {
    basic: "Básico",
    advanced: "Avanzado",
    premium: "Premium"
}

export const ITEMS_PER_PAGE = 5;

import multer from "multer";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

import { HOST, MP_ACCESS_TOKEN, SIGHTENGINE_API_SECRET } from "../config.js";
import { Readable } from "stream";
import axios from "axios";
import FormData from "form-data";
import mongoose from "mongoose";
import streamifier from "streamifier";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe"
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import Plan from "../models/Plan.js";
import Video from "../models/Video.js";
import Rating from "../models/Rating.js";
import User from "../models/User.js";
import Exchange from "../models/Exchange.js";

/**
 * Handles video content moderation using the Sightengine API.
 * Sends the uploaded video buffer for analysis (nudity, weapons, drugs, medical, gore, self-harm, violence).
 * Sets up callback for asynchronous moderation results.
 * Logs any errors from the API.
 *
 * @param {Buffer} buffer - The video file buffer to analyze.
 * @param {string} videoId - The unique video ID for naming and callback reference.
 */
export function sightEngineValidation(buffer, videoId) {
    const stream = Readable.from(buffer);

    const data = new FormData();
    data.append("media", stream, {
        filename: `${videoId}.mp4`,
        contentType: "video/mp4"
    });
    // models to apply
    data.append("models", "nudity-2.1,weapon,recreational_drug,medical,gore-2.0,self-harm,violence");
    data.append("callback_url", HOST + "/videos/sightengine");
    data.append("api_user", "54483249");
    data.append("api_secret", SIGHTENGINE_API_SECRET);

    axios({
        method: "post",
        url: "https://api.sightengine.com/1.0/video/check.json",
        data: data,
        headers: data.getHeaders()
    })
        .catch(function (error) {
            // handle error
            if (error.response) console.log(error.response.data);
            else console.log(error.message);
        });
}

/**
 * Mongoose validator factory to check if a referenced document exists.
 * Usage: Attach to a schema field to ensure the referenced ID exists in the specified model.
 * @param {string} modelName - The name of the Mongoose model to check.
 * @param {string} message - The error message to display if validation fails.
 * @returns {object} - Validator config for Mongoose schema.
 */
export function validateExists(modelName, message) {
    return {
        validator: async function (id) {
            return await mongoose.model(modelName).exists({ _id: id });
        },
        message
    };
}

/**
 * Checks if the given user is the owner of the specified video.
 * @param {string} videoId - The ID of the video to check ownership for.
 * @param {string} userId - The ID of the user to check.
 * @returns {Promise<boolean>} - True if the user is the owner, false otherwise.
 */
export const validateIfOwner = async (videoId, userId) => {
    if (!userId) return false;

    const video = await mongoose.model("Video").findById(videoId);

    if (!video) return false;

    return video.getCurrentUser().toString() === userId.toString();
};

const config = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

/**
 * Retrieves the next billing date for a user's MercadoPago subscription.
 * @param {object} user - The user object containing subscription info.
 * @returns {Promise<string|null>} - The next payment date as an ISO string, or null if not available.
 */
export async function getBillingDate(user) {
    const subscriptionId = user.subscription.subscriptionId;
    if (!subscriptionId) {
        return null;
    }
    const preApproval = new PreApproval(config);
    const subscription = await preApproval.get({ id: subscriptionId });
    return subscription.next_payment_date;
}

/**
 * Validates a user's MercadoPago subscription and updates their plan if cancelled and expired.
 * Handles next payment date calculation and plan downgrade logic.
 * @param {object} user - The user object containing subscription info.
 * @returns {Promise<object>} - An object with plan, isCancelled, and nextPaymentDate.
 */
export async function validateSubscription(user) {
    if (!user.subscription.subscriptionId) {
        const nextPaymentDate = await getBillingDate(user);
        return {
            plan: user.subscription.plan,
            isCancelled: false,
            nextPaymentDate
        }
    }

    const subscriptionId = user.subscription.subscriptionId;
    const preApproval = new PreApproval(config);
    const subscription = await preApproval.get({ id: subscriptionId });

    let plan = user.subscription.plan;
    const isCancelled = subscription.status == "cancelled";
    const nextPaymentDate = new Date(subscription.next_payment_date);
    const dateCreated = new Date(subscription.date_created);
    nextPaymentDate.setHours(0, 0, 0, 0);
    dateCreated.setHours(0, 0, 0, 0);
    if (nextPaymentDate.toString() == dateCreated.toString()) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }

    if (isCancelled) {
        if (nextPaymentDate < new Date()) {
            const basicPlan = await Plan.findOne({
                name: "basic"
            });
            await user.updateOne({
                "subscription.plan": basicPlan._id,
                $unset: { "subscription.subscriptionId": "" }
            });
            plan = basicPlan;
        }
    }

    return {
        plan,
        isCancelled,
        nextPaymentDate
    };
}

/**
 * Updates the rating for a video and its associated users.
 * Calculates the new average rating for the video, the user who rated, and the first owner of the video (if different).
 * Updates the rating value and count for each entity in the database.
 *
 * @param {string} userId - The ID of the user submitting the rating.
 * @param {string} videoId - The ID of the video being rated.
 * @param {number} ratingValue - The rating value to add.
 * @returns {Promise<void>}
 */
export async function updateRating(userId, videoId, ratingValue) {
    const videoRatings = await Rating.find({ video: videoId });
    const newVideoRating = (videoRatings.reduce((acc, vr) => acc + vr.rating, 0) + ratingValue) / (videoRatings.length + 1);

    const ratedUserRatings = await getUserRatings(userId);
    const newRatedUserRating = (ratedUserRatings.totalRating + ratingValue) / (ratedUserRatings.length + 1);

    await Video.updateOne(
        { _id: videoId },
        {
            $set: {
                rating: {
                    value: newVideoRating,
                    count: videoRatings.length + 1
                }
            }
        }
    );

    await User.updateOne(
        { _id: userId },
        {
            $set: {
                rating: {
                    value: newRatedUserRating,
                    count: ratedUserRatings.length + 1
                }
            }
        }
    );

    const video = await Video.findById(videoId);
    const firstOwnerId = video.users[0];

    if (String(firstOwnerId) != String(userId)) {
        const firstOwnerRatings = await getUserRatings(firstOwnerId);
        const newFirstOwnerRating = (firstOwnerRatings.totalRating + ratingValue) / (firstOwnerRatings.length + 1);
        await User.updateOne(
            { _id: firstOwnerId },
            {
                $set: {
                    rating: {
                        value: newFirstOwnerRating,
                        count: firstOwnerRatings.length + 1
                    }
                }
            }
        );
    }
}

/**
 * Retrieves all ratings for videos where the user is the first owner or has been rated directly.
 * Calculates the total rating and the number of ratings for the user.
 *
 * @param {string} userId - The ID of the user whose ratings are being retrieved.
 * @returns {Promise<{totalRating: number, length: number}>} - Object with total rating sum and count.
 */
async function getUserRatings(userId) {
    const videos = await Video.find({ "users.0": userId });
    const videoIds = videos.map(v => v._id);

    const ratings = await Rating.find({
        $or: [
            { video: { $in: videoIds } },
            { ratedUser: userId }
        ]
    });

    return {
        totalRating: ratings.reduce((acc, r) => acc + r.rating, 0),
        length: ratings.length
    };
}

/**
 * Cancels all pending exchanges for a given video by deleting them from the database.
 * Used to ensure no unresolved exchanges remain when a video is removed or updated.
 *
 * @param {string} videoId - The ID of the video whose pending exchanges should be cancelled.
 * @returns {Promise<void>}
 */
export async function cancelPendingExchanges(videoId) {
    await Exchange.deleteMany({
        responderVideo: videoId,
        status: "pending"
    });
}

/**
 * Converts a byte value into a human-readable string with appropriate units (B, KB, MB, GB, TB).
 * Rounds the value to the nearest integer.
 * @param {number} bytes - The number of bytes to format.
 * @returns {string} - The formatted string with units.
 */
export function formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    let value = bytes;

    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }

    return `${Math.round(value)} ${units[i]}`;
}

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

/**
 * Retrieves the duration (in seconds) of a video buffer using ffmpeg and ffprobe.
 * Creates a readable stream from the buffer and probes metadata for duration.
 *
 * @param {Buffer} buffer - The video file buffer to analyze.
 * @returns {Promise<number>} - The duration of the video in seconds.
 */
export function getDuration(buffer) {
    return new Promise((resolve, reject) => {
        const stream = streamifier.createReadStream(buffer);

        ffmpeg(stream).ffprobe((err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration);
        });
    });
};