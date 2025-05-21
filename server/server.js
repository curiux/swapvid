import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import { MONGODB_URI, PORT } from "./config.js";
import register from "./routes/register.js";
import login from "./routes/login.js";
import users from "./routes/users.js";

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.use("/register", register);
app.use("/login", login);
app.use("/users", users);

mongoose.connect(MONGODB_URI);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

export default app;