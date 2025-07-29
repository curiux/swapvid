import mongoose from "mongoose";

const { Schema, model } = mongoose;

const videoViewSchema = new Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
  ip: String,
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Autodelete after 1 hour
});

const VideoView = model("VideoView", videoViewSchema);
export default VideoView;