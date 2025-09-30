import { AppDataSource } from "./config/data-source";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
// import userRoutes from "./routes/userRoutes";

AppDataSource.initialize().then(async () => {

    const app = express()
    const port = 3000

    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", authRoutes);
    // app.use("/api/users", userRoutes);

    app.listen(port, () => {
        console.log(`Video metadata management app listening on port ${port}`)
    })

}).catch(error => console.log(error))