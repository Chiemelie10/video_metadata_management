import { UUID } from "crypto";
import { JwtPayload } from "jsonwebtoken";
import { Request } from "express-serve-static-core";

export interface SignUpData {
    email: string;
    username: string;
    password: string;
}

export interface SignInData {
    email: string;
    password: string;
}

export interface AppJwtPayload extends JwtPayload {
    userId: UUID;
    tokenType: string;
}

export interface JwtRefreshRequest extends Request {
    cookies: {
        refreshToken?: string
    };
}

export interface SignUpFieldError {
    email?: string[];
    username?: string[];
    password?: string[];
}

export interface SignInFieldError {
    email?: string[];
    password?: string[];
}
