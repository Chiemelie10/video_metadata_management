import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { AppDataSource, appEnv } from "../config/data-source";
import { User } from "../models/User";
import { AppJwtPayload, JwtRefreshRequest, SignInData, SignUpData } from "../types/auth";
import { makeAccessToken, makeRefreshToken, verifyJwtToken } from "../services/authService";
import { redisClient } from "../config/redis";
import { now } from "../utils/now";

export const signUp = async (req: Request, res: Response) => {

    const {username, email, password}: SignUpData = req.body;
    const currentTime = now();
    let hashedPassword: string;

    try {
        hashedPassword = await bcrypt.hash(password, 10);
    } catch (error) {
        return res.status(500).json({"error": `Password hash failed: ${error.message}`});
    }

    try {
        const user = await AppDataSource.manager
            .save(User, {
                username,
                email,
                password: hashedPassword,
                deleted_at: null,
                created_at: currentTime,
                updated_at: currentTime,
            });

        const responseData = {
            id: user.id,
            username: user.username,
            email: user.email,
            deleted_at: user.deleted_at,
            created_at: user.created_at,
            updated_at: user.updated_at
        }

        return res.status(201).json({
            message: "User registered successfully.",
            data: responseData
        });
    } catch(error) {
        return res.status(500).json({"error": `User registration failed: ${error.message}`});
    }
}

export const signIn = async (req: Request, res: Response) => {
    const { email, password }: SignInData = req.body;

    let user: User;

    try {
        user = await AppDataSource.manager.findOneBy(User, { email })

        if (!user) {
            return res.status(404).json({
                email: "Your email is incorrect."
            });
        }
    } catch (error) {
        return res.status(500).json({"email": `${error.message}`});
    }

    const hashedPassword = user.password;

    try {
        const isValidPassword = await bcrypt.compare(password, hashedPassword);

        if (!isValidPassword) {
            return res.status(404).json({
                password: "Your password is incorrect."
            });
        }
    } catch (error) {
        return res.status(500).json({"error": `Password decrypt failed: ${error.message}`});
    }

    const accessTokenPayload: AppJwtPayload = {
        userId: user.id,
        tokenType: "access"
    }

    const refreshTokenPayload: AppJwtPayload = {
        userId: user.id,
        tokenType: "refresh"
    }

    const accessToken = makeAccessToken(accessTokenPayload);
    const refreshToken = makeRefreshToken(refreshTokenPayload);

    let jwtExpireIn = parseInt(appEnv.JWT_REFRESH_EXPIRE);
    
    if (Number.isNaN(jwtExpireIn)) {
        jwtExpireIn = 604800; // 7 days in seconds
    }

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: jwtExpireIn * 1000, // miliseconds
        sameSite: "lax"
    });

    const responseData = {
        id: user.id,
        username: user.username,
        email: user.email,
        accessToken
    }

    return res.status(200).json({
        message: "Login was successful",
        data: responseData
    });
}

export async function signOut(req: JwtRefreshRequest, res: Response) {
    const  { refreshToken } = req.cookies;
    const userId = req.userId;

    if (!refreshToken) {
        return res.status(200).json({
            message: "Logged out successfully."
        });
    }

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "lax"
    });

    const result = await verifyJwtToken(refreshToken, "refresh");

    if (!result.isValid) {
        return res.status(200).json({
            message: "Logged out successfully."
        });
    }

    const now = Math.floor(Date.now() / 1000);
    const jwtExpireIn = result.decoded.exp - now;

    await redisClient.set(refreshToken, userId, "EX", jwtExpireIn);

    return res.status(200).json({
        message: "Logged out successfully."
    });
}

export async function refreshToken(req: JwtRefreshRequest, res: Response) {
    const  { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(401).json({
            error: "Refresh token not found."
        });
    }

    const result = await verifyJwtToken(refreshToken, "refresh");

    if (!result.isValid) {
        return res.status(401).json({
            "error": result.message
        });
    }

    const payload: AppJwtPayload = {
        userId: result.decoded.userId,
        tokenType: "access"
    }

    const accessToken = makeAccessToken(payload);

    return res.status(200).json({
        message: "Token refresh was successful",
        data: { accessToken }
    });
}