import { Request, Response } from "express";
import path from "path";
import { UploadStatus, UploadVideoData, ValidatedVideoMetadata, VideoFilter } from "../types/video";
import { AppDataSource } from "../config/data-source";
import { Video } from "../models/Video";
import { now } from "../utils/now";
import { UUID } from "crypto";
import { redisClient } from "../config/redis";
import fsp from "fs/promises";
import fs from "fs/promises";
import { combineChunks, deleteFile, fileExists } from "../services/videoService";

export async function uploadVideo(req: Request, res: Response) {
    const { totalChunks, chunkIndex }: UploadVideoData  = req.body;
    const { id } = req.params;

    if (chunkIndex == 0) {
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

    const video = await AppDataSource.manager
        .save(Video, {
            title,
            user: { id: userId },
            description,
            video: null,
            status: UploadStatus.PENDING,
            genres,
            tags,
            created_at: currentTime,
            updated_at: currentTime,
        });

    const videoMetadata = await AppDataSource.getRepository(Video)
        .createQueryBuilder("video")
        .leftJoin("video.user", "user")
        .leftJoinAndSelect("video.tags", "tag")
        .leftJoinAndSelect("video.genres", "genre")
        .select([
            "video.id", "video.title", "video.description", "video.status",
            "video.video", "video.created_at", "video.updated_at", "user.id",
            "user.username", "user.email", "tag.id", "tag.name", "genre.id", "genre.name"
        ])
        .where("video.id = :id", { id: video.id })
        .getOne();

    const responseData = {
        id: videoMetadata.id,
        user: videoMetadata.user,
        title: videoMetadata.title,
        description: videoMetadata.description,
        status: videoMetadata.status,
        url: videoMetadata.video ? `${req.protocol}://${req.get("host")}${videoMetadata.video}` : videoMetadata.video,
        tags: videoMetadata.tags,
        genres: videoMetadata.genres,
        created_at: videoMetadata.created_at,
        updated_at: videoMetadata.updated_at,
    }

    return res.status(201).json({
        message: "Video metadata created successfully. Use the provided id to upload your video.",
        data: responseData
    });
}

export async function updateVideoMetadata(req: Request, res: Response) {
    const { description, title, tags, genres }: ValidatedVideoMetadata = req.body;
    const { id } = req.params;
    const currentTime = now();

    const video = await AppDataSource.getRepository(Video)
        .createQueryBuilder("video")
        .leftJoin("video.user", "user")
        .leftJoinAndSelect("video.tags", "tag")
        .leftJoinAndSelect("video.genres", "genre")
        .select([
            "video.id", "video.title", "video.description", "video.status",
            "video.video", "video.created_at", "video.updated_at", "user.id",
            "user.username", "user.email", "tag.id", "tag.name", "genre.id", "genre.name"
        ])
        .where("video.id = :id", { id })
        .getOne();

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
        url: video.video ? `${req.protocol}://${req.get("host")}${video.video}` : video.video,
        tags: video.tags,
        genres: video.genres,
        created_at: video.created_at,
        updated_at: video.updated_at
    }

    return res.status(200).json({
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

    if (video.video) {
        const videoFilePath = path.join(process.cwd(), "src", video.video);
        deleteFile(videoFilePath);
    }

    await AppDataSource.getRepository(Video).remove(video);

    return res.status(200).json({
        message: "Video deleted successfully."
    });
}

export const getVideos = async (req: Request, res: Response) => {
    let { title, tag, genreId, status, page = 1, size = 2 }: VideoFilter = req.query;

    if (page && typeof page != "number") {
        page = parseInt(page)

        if (Number.isNaN(page)) {
            page = 1;
        }
    }

    if (size && typeof size != "number") {
        size = parseInt(size)

        if (Number.isNaN(size)) {
            size = 2;
        }
    }

    page = Math.abs(page);
    size = Math.abs(size);

    const offset = (page - 1) * size;

    let query = AppDataSource.getRepository(Video)
        .createQueryBuilder("video")
        .leftJoinAndSelect("video.user", "user")
        .leftJoinAndSelect("video.genres", "genre")
        .leftJoinAndSelect("video.tags", "tag")
        .select([
            "video.id", "video.title", "video.description", "video.status",
            "video.video", "video.created_at", "video.updated_at", "user.id",
            "user.username", "user.email", "tag.id", "tag.name", "genre.id", "genre.name"
        ]);

    if (title) {
        query = query.andWhere("LOWER(video.title) LIKE LOWER(:title)", { title: `%${title}%` });
    }

    if (status) {
        query = query.andWhere("LOWER(video.status) = LOWER(:status)", { status });
    }

    if (genreId) {
        query = query.andWhere("genre.id = :genreId", { genreId });
    }

    if (tag) {
        query = query.andWhere("LOWER(tag.name) = LOWER(:tagName)", { tagName: tag });
    }

    query = query.orderBy("video.created_at", "DESC");

    query = query.skip(offset).take(size);

    const [videos, total] = await query.getManyAndCount();

    const totalPages = Math.ceil(total / size)

    const responseData = videos.map((video) => {
        return {
            id: video.id,
            user: video.user,
            title: video.title,
            description: video.description,
            status: video.status,
            url: video.video ? `${req.protocol}://${req.get("host")}${video.video}` : video.video,
            tags: video.tags,
            genres: video.genres,
            created_at: video.created_at,
            updated_at: video.updated_at,
        };
    })

    return res.status(200).json({
        message: "Videos fetched successfully.",
        currentPage: page,
        totalPages,
        totalNumOfVideos: total,
        data: responseData,
    });
}

export const getVideo = async (req: Request, res: Response) => {
    const { id } = req.params;

    const video = await AppDataSource.getRepository(Video)
        .createQueryBuilder("video")
        .leftJoin("video.user", "user")
        .leftJoinAndSelect("video.tags", "tag")
        .leftJoinAndSelect("video.genres", "genre")
        .select([
            "video.id", "video.title", "video.description", "video.status",
            "video.video", "video.created_at", "video.updated_at", "user.id",
            "user.username", "user.email", "tag.id", "tag.name", "genre.id", "genre.name"
        ])
        .where("video.id = :id", { id })
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
        url: video.video ? `${req.protocol}://${req.get("host")}${video.video}` : video.video,
        tags: video.tags,
        genres: video.genres,
        created_at: video.created_at,
        updated_at: video.updated_at,
    };

    return res.status(200).json({
        message: "Video fetched successfully.",
        data: responseData
    });
}

