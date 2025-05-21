import { verifyToken } from "../lib/jwt.js";

// Authentication middleware using JWT
const auth = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = await verifyToken(token);
        req.userId = decoded._id;
        next();
    } catch (err) {
        return res.status(401).send({ error: "Token inválido" });
    }
}

export default auth;