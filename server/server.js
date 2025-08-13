import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import { isProduction, MONGODB_URI, PORT } from "./config.js";
import register from "./routes/register.js";
import login from "./routes/login.js";
import users from "./routes/users.js";
import videos from "./routes/videos.js";
import exchanges from "./routes/exchanges.js";
import ratings from "./routes/ratings.js";
import plans from "./routes/plans.js";
import subscriptions from "./routes/subscriptions.js";
import forgotPassword from "./routes/forgot-password.js";
import resetPassword from "./routes/reset-password.js";
import sendEmailLink from "./routes/send-email-link.js";
import verifyEmail from "./routes/verify-email.js";
import statistics from "./routes/statistics.js";

const app = express();

app.use(morgan("dev"));
app.use(cors({
  origin: isProduction ? "https://swapvid.online" : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

app.use("/register", register);
app.use("/login", login);
app.use("/users", users);
app.use("/videos", videos);
app.use("/exchanges", exchanges);
app.use("/ratings", ratings);
app.use("/plans", plans);
app.use("/subscriptions", subscriptions);
app.use("/forgot-password", forgotPassword);
app.use("/reset-password", resetPassword);
app.use("/send-email-link", sendEmailLink);
app.use("/verify-email", verifyEmail);
app.use("/statistics", statistics);

mongoose.connect(MONGODB_URI);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;