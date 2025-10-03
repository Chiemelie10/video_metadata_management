import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/data-source";
import { Video } from "../../models/Video";

export async function videoRoutePolicy(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId;

    if (req.method === "PUT" || req.method === "PATCH" || req.method === "DELETE") {
        const { id } = req.params;

        const video = await AppDataSource.getRepository(Video)
            .createQueryBuilder("video")
            .leftJoinAndSelect("video.user", "user")
            .select(["video.id", "user.id"])
            .where("video.id = :id", { id })
            .getOne();

        if (!video) {
            return res.status(404).json({
                error: "Video was not found."
            });
        }

        if (userId != video.user.id) {
            return res.status(403).json({ error: "Video metadata can only be changed or removed by the owner." });
        }
    }

    next();
}