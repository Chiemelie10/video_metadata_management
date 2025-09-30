import { Router } from "express";
import { validateSignUpData } from "../middlewares/auth/signUpRequest";
import { signUp, signIn, signOut, refreshToken } from "../controllers/authController";
import { validateSignInData } from "../middlewares/auth/signInRequest";
import { validateToken } from "../middlewares/gate/validateToken";

const router = Router();

router.post("/signup", validateSignUpData, signUp);
router.post("/signin", validateSignInData, signIn);
router.post("/signout", validateToken, signOut);
router.post("/token/refresh", refreshToken);

export default router;