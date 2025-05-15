import express from "express";
import cors from "cors";
import morgan from "morgan";
import { PORT } from "./config.js";

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});