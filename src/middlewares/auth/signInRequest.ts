import {Request, Response, NextFunction} from "express";
import { SignInData, SignInFieldError } from "../../types/auth";
import { cleanInput } from "../../utils/cleanInput";

export function validateSignInData(req: Request, res: Response, next: NextFunction) {

    let { email, password }: SignInData = req.body;

    let errors: SignInFieldError = {};
    let emailErrors: string[] = [];
    let passwordErrors: string[] = [];

    if (!email) {
        emailErrors.push("The field email is required.");
        errors["email"] = emailErrors;
    }

    if (!password) {
        passwordErrors.push("The field password is required.")
        errors["password"] = passwordErrors;
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json(errors);
    }

    email = cleanInput(email);
    password = cleanInput(password);

    req.body.email = email;
    req.body.password = password;

    next();
}