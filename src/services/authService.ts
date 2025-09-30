import { appEnv } from "../config/data-source";
import jwt from "jsonwebtoken";
import { AppJwtPayload } from "../types/auth";
import { redisClient } from "../config/redis";

export function makeAccessToken(payload: AppJwtPayload): string {
    let jwtExpireIn = parseInt(appEnv.JWT_ACCESS_EXPIRE);

    if (Number.isNaN(jwtExpireIn)) {
        jwtExpireIn = 900; // 15 minutes in seconds
    }

    const accessToken = jwt.sign(payload, appEnv.APP_PRIVATE_KEY, {
        algorithm: "RS256",
        expiresIn: jwtExpireIn
    });

    return accessToken;
}

export function makeRefreshToken(payload: AppJwtPayload): string {
    let jwtExpireIn = parseInt(appEnv.JWT_REFRESH_EXPIRE);

    if (Number.isNaN(jwtExpireIn)) {
        jwtExpireIn = 604800; // 7 days in seconds
    }

    const refreshToken = jwt.sign(payload, appEnv.APP_PRIVATE_KEY, {
        algorithm: "RS256",
        expiresIn: jwtExpireIn
    });

    return refreshToken;
}

interface VerifyTokenResponse {
    isValid: boolean;
    decoded?: AppJwtPayload;
    message?: string
}

export async function verifyJwtToken(token: string, tokenType: string): Promise<VerifyTokenResponse> {
    try {
        const blackListedToken = await redisClient.get(token);

        if (blackListedToken) {
            return { isValid: false, message: "Token was blacklisted." };
        }

        const decodedToken = jwt.verify(token, appEnv.APP_PUBLIC_KEY, { algorithms: ["RS256"] }) as AppJwtPayload;

        if (tokenType != decodedToken.tokenType) {
            return { isValid: false, message: "Wrong token type." };
        }

        return { isValid: true, decoded: decodedToken};
    } catch (error) {
        return { isValid: false, message: error.message };
    }
}
