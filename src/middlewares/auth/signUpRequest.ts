import {Request, Response, NextFunction} from "express";
import { cleanInput } from "../../utils/cleanInput";
import { AppDataSource } from "../../config/data-source";
import { User } from "../../models/User";
import { SignUpData, SignUpFieldError } from "../../types/auth";

export async function validateSignUpData(req: Request, res: Response, next: NextFunction) {

    let { email, password, username}: SignUpData = req.body;

    let errors: SignUpFieldError = {};
    let emailErrors: string[] = [];
    let usernameErrors: string[] = [];
    let passwordErrors: string[] = [];

    if (!email) {
        emailErrors.push("The field email is required.");
        errors["email"] = emailErrors;
    }

    if (!username) {
        usernameErrors.push("The field username is required.");
        errors["username"] = usernameErrors;
    }

    if (!password) {
        passwordErrors.push("The field password is required.");
        errors["password"] = passwordErrors;
    }

    if (email) {
        email = cleanInput(email);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);

        if (!isValid) {
            emailErrors.push("Email is invalid.");
            errors["email"] = emailErrors;
        } else if (email.length > 50) {
            emailErrors.push("Email should not exceed 50 characters.");
            errors["email"] = emailErrors;
        } else { 
            try {
                const exists = await AppDataSource.getRepository(User).exists({
                    where: { email }
                });

                if (exists) {
                    emailErrors.push("This email has already been taken.");
                    errors["email"] = emailErrors;
                }
            } catch(error) {
                return res.status(500).json({"email": `Could not perform unique constraint validation. ${error.message}`});
            }
        }
    }

    if (password) {
        const hasNumber = /\d/;
        const allNumbers = /^\d+$/;

        password = cleanInput(password);

        if (password.length < 8) {
            passwordErrors.push("Password should be at least 8 characters.");
        }

        if (!hasNumber.test(password)) {
            passwordErrors.push("Password should have at least one number.");
        }

        if (allNumbers.test(password)) {
            passwordErrors.push("Password should have at least one character that is not a number.");
        }

        if (passwordErrors.length > 0) {
            errors["password"] = passwordErrors;
        }
    }

    if (username) {
        username = cleanInput(username);

        const usernameLength = username.length;

        if (usernameLength > 20) {
            usernameErrors.push("Username should not exceed 20 characters.");
            errors["username"] = usernameErrors;
        } else {
            try {
                const exists = await AppDataSource.getRepository(User).exists({
                    where: { username }
                });

                if (exists) {
                    usernameErrors.push("This username has already been taken.");
                    errors["username"] = usernameErrors;
                }
            } catch(error) {
                return res.status(500).json({"username": `Could not perform unique constraint validation. ${error}`});
            }

        }
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json(errors);
    }

    req.body.email = email;
    req.body.username = username;
    req.body.password = password;

    next();
}