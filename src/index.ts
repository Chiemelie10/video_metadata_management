import { AppDataSource } from "./config/data-source";
import express, { NextFunction } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import videoRoutes from "./routes/videoRoutes";
import genreRoutes from "./routes/genreRoutes";
import cors from "cors";

AppDataSource.initialize().then(async () => {

    const app = express()
    const port = 3000

    app.use(express.json());
    app.use(cors({
	    origin: ["http://localhost:5500"],
	    credentials: true
        })
    );
    app.use(cookieParser());
    app.use("/public", express.static("src"));
    app.use("/api/auth", authRoutes);
    app.use("/api/videos", videoRoutes);
    app.use("/api/genres", genreRoutes);
    app.use((err, req, res, next) => {
        res.status(500).json({message: err.message});
    })

    app.listen(port, () => {
        console.log(`Video metadata management app listening on port ${port}`)
    })

}).catch(error => console.log(error))
