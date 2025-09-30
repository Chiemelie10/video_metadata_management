import { Request, Response, NextFunction } from "express";
import { verifyJwtToken } from "../../services/authService";
import { AppDataSource } from "../../config/data-source";
import { User } from "../../models/User";

export async function validateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.get("authorization");

    if (!authHeader) {
        return res.status(401).json({
            error: "Authorization header is required."
        });
    }

    const bearer = authHeader.split(" ")[0];
    const token = authHeader.split(" ")[1];

    if (!bearer || bearer != "Bearer" || !token) {
        return res.status(401).json({
            error: "Token was not set in the authorization header."
        });
    }

    const result = await verifyJwtToken(token, "access");

    if (!result.isValid) {
        return res.status(401).json({
            "error": result.message
        });
    }

    const userId = result.decoded.userId;

    req.userId = userId;

    next();
}