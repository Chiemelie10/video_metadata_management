import { Router } from "express";
import { validateToken } from "../middlewares/gate/validateToken";
import { createGenre, getGenre, getGenres, updateGenre } from "../controllers/genreController";

const router = Router();

router.get("", validateToken, getGenres);
router.get("/:id", validateToken, getGenre);
router.post("", validateToken, createGenre);
router.put("/:id", validateToken, updateGenre);

export default router
