import {Request, Response} from "express";
import path from "path";
import { UploadStatus, UploadVideoData, ValidatedVideoMetadata } from "../types/video";
import { AppDataSource } from "../config/data-source";
import { Video } from "../models/Video";
import { now } from "../utils/now";
import { UUID } from "crypto";
import { redisClient } from "../config/redis";
import fsp from "fs/promises";
import fs from "fs/promises";
import { User } from "../models/User";
import { combineChunks, deleteFile, fileExists } from "../services/videoService";

export async function uploadVideo(req: Request, res: Response) {
    const file = req.file;
    const { totalChunks, chunkIndex }: UploadVideoData  = req.body;
    const { id } = req.params;

    if (chunkIndex === 0) {
        const video = await AppDataSource.manager.findOneBy(Video, { id: id as UUID });

        if (!video) {
            return res.status(404).json({
                error: "Video metadata was not found."
            });
        }

        video.status = UploadStatus.UPLOADING;
        await AppDataSource.manager.save(video);

        await redisClient.set(`video:${video.id}:videoId`, `${chunkIndex}-${totalChunks}`, "EX", 60 * 60 * 24);
    }

    const tempDir = path.join(process.cwd(), "src/uploads/temp", id);

    await fsp.mkdir(tempDir, { recursive: true });

    const chunkPath = path.join(tempDir, `${chunkIndex}.part`);
    await fsp.rename(req.file!.path, chunkPath);

    await redisClient.set(`video:${id}:videoId`, `${chunkIndex}-${totalChunks}`, "EX", 60 * 60 * 24);

    console.log(`Saved chunk ${chunkIndex}/${totalChunks} for video ${id}`);
    
    return res.status(200).json({
        message: "Chunk upload is complete."
    });
}

export async function assembleChunks(req: Request, res: Response) {
    const { id } = req.params;

    const tempDir = path.join(process.cwd(), "src/uploads/temp", id);

    // check if tempDir exists
    const pathExists = await fileExists(tempDir);

    if (!pathExists) {
        return res.status(404).json({
            error: "Video file not found. Please download again"
        });
    }

    const lastUploadData = await redisClient.get(`video:${id}:videoId`);

    if (!lastUploadData) {
        return res.status(403).json({
            error: "Some of the video metadata is missing. Please download again."
        });
    }

    const lastTotalChunkNum = lastUploadData.split("-")[1];
    const totalChunks = parseInt(lastTotalChunkNum);
    let finalPath = "";

    try {
        finalPath = await combineChunks(id, totalChunks);
    } catch (error) {
        return res.status(403).json({
            error: error.message
        });
    }

    const video = await AppDataSource.getRepository(Video).findOne({
        where: { id: id as UUID},
        relations: {
            genres: true,
            tags: true
        }
    });

    if (!video) {
        return res.status(404).json({
            error: "Video Id is incorrect."
        });
    }

    const fileRelativePath = `/public/uploads/${id}.mp4`

    video.status = UploadStatus.COMPLETE;
    video.video = fileRelativePath;

    await AppDataSource.manager.save(video);

    // Delete Video upload metadata in redis
    await redisClient.del(`video:${video.id}:videoId`);

    // Remove chunk files.
    try {
        await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
        throw new Error(error.message)
    }

    const videoUrl = `${req.protocol}://${req.get("host")}${fileRelativePath}`;

    return res.status(200).json({
        message: "Your video is ready.",
        url: videoUrl
    });

}

export async function createVideoMetadata(req: Request, res: Response) {
    const { description, title, tags, genres }: ValidatedVideoMetadata = req.body;
    const userId = req.userId;
    const currentTime = now();

    const user = await AppDataSource.getRepository(User).findOne({
        where: { id: userId}
    });

    const video = await AppDataSource.manager
        .save(Video, {
            title,
            user,
            description,
            video: null,
            status: UploadStatus.PENDING,
            genres,
            tags,
            created_at: currentTime,
            updated_at: currentTime,
        });

    const videoMetadata = await AppDataSource.getRepository(Video).findOne({
        where: { id: video.id },
        relations: {
            tags: true,
            genres: true
        }
    });

    return res.status(201).json({
        message: "Video metadata created successfully. Use the provided id to upload your video.",
        data: videoMetadata
    });
}

export async function updateVideoMetadata(req: Request, res: Response) {
    const { description, title, tags, genres }: ValidatedVideoMetadata = req.body;
    const userId = req.userId;
    const { id } = req.params;
    const currentTime = now();

    const video = await AppDataSource.getRepository(Video).findOne({
        where: { id: id as UUID },
        relations: {
            genres: true,
            tags: true
        }
    });

    video.title = title;
    video.description = description;
    video.updated_at = currentTime;

    if (tags) {
        video.tags = tags;
    }

    if (genres) {
        video.genres = genres;
    }

    await AppDataSource.getRepository(Video).save(video);

    const responseData = {
        id: video.id,
        user: video.user,
        title: video.title,
        description: video.description,
        status: video.status,
        url: `${req.protocol}://${req.get("host")}${video.video}`,
        created_at: video.created_at,
        updated_at: video.updated_at,
    }

    return res.status(201).json({
        message: "Video metadata updated successfully.",
        data: responseData
    });
}

export async function deleteVideo(req: Request, res: Response) {
    const { id } = req.params;

    const video = await AppDataSource.getRepository(Video).findOne({
        where: { id: id as UUID },
        relations: {
            genres: true,
            tags: true
        }
    });

    if (!video) {
        return res.status(404).json({
            error: "Video not found."
        });
    }

    const videoFilePath = path.join(process.cwd(), "src", video.video);
    const result = deleteFile(videoFilePath);

    await AppDataSource.getRepository(Video).remove(video);

    return res.status(200).json({
        message: "Video deleted successfully."
    });
}

export const getVideos = async (req: Request, res: Response) => {
    const videos = await AppDataSource.getRepository(Video)
        .createQueryBuilder("videos")
        .select([
            "videos.id", "videos.user_id", "videos.title",
            "videos.description", "videos.status", "videos.video",
            "videos.created_at", "videos.updated"
        ])
        .leftJoinAndSelect("video.genres", "genres")
        .getMany();

    const responseData = videos.map((video) => {
        return {
            id: video.id,
            user: video.user,
            title: video.title,
            description: video.description,
            status: video.status,
            url: `${req.protocol}://${req.get("host")}${video.video}`,
            created_at: video.created_at,
            updated_at: video.updated_at,
        };
    })

    return res.status(200).json({
        message: "Videos fetched successfully.",
        data: responseData
    });
}

export const getVideo = async (req: Request, res: Response) => {
    const { id } = req.params;

    const video = await AppDataSource.getRepository("videos")
        .createQueryBuilder("profiles")
        .select([
            "videos.id", "videos.user_id", "videos.title",
            "videos.description", "videos.status", "videos.video",
            "videos.created_at", "videos.updated"
        ])
        .where("profiles.id = :id", { id })
        .getOne();

    if (!video) {
        return res.status(404).json({
            error: "Video was not found."
        });
    }

    const responseData = {
        id: video.id,
        user: video.user,
        title: video.title,
        description: video.description,
        status: video.status,
        url: `${req.protocol}://${req.get("host")}${video.video}`,
        created_at: video.created_at,
        updated_at: video.updated_at,
    };

    return res.status(200).json({
        message: "Video fetched successfully.",
        data: responseData
    });
}

