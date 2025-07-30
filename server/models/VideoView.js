import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Mongoose schema for the VideoView model.
 *
 * Defines the structure and behavior of video view documents in the database.
 *
 * Fields:
 * - videoId: Reference to the associated Video document.
 * - ip: IP address of the viewer.
 * - createdAt: Timestamp of when the view was recorded (default: now).
 *   - Automatically expires and deletes the document after 1 hour.
 */

const videoViewSchema = new Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
  ip: String,
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Autodelete after 1 hour
});

const VideoView = model("VideoView", videoViewSchema);
export default VideoView;