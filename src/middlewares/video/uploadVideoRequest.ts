import {Request, Response, NextFunction} from "express";
import { redisClient } from "../../config/redis";
import { UploadVideoData, UploadVideoFieldError } from "../../types/video";


export const validateUploadVideoData = async (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    let { totalChunks, chunkIndex }: UploadVideoData = req.body;
    const { id } = req.params;

    let errors: UploadVideoFieldError = {};
    let totalChunksErrors: string[] = [];
    let chunkIndexErrors: string[] = [];

    if (!totalChunks) {
        totalChunksErrors.push("The field total chunks is required.");
        errors["totalChunks"] = totalChunksErrors;
    }

    if (!chunkIndex) {
        chunkIndexErrors.push("The field chunk index is required.");
        errors["chunkIndex"] = chunkIndexErrors;
    }

    let chunkIndexIsNumber = true;
    let totalChunksIsNumber = true;

    if (chunkIndex) {
        if (typeof chunkIndex != "number") {
            chunkIndex = parseInt(chunkIndex);
    
            if (Number.isNaN(chunkIndex)) {
                chunkIndexErrors.push("Chunk index field should be a number.");
                errors["chunkIndex"] = chunkIndexErrors;
                chunkIndexIsNumber = false;
            }
        }
    }

    if (totalChunks) {
        if (typeof totalChunks != "number") {
            totalChunks = parseInt(totalChunks);
    
            if (Number.isNaN(totalChunks)) {
                totalChunksErrors.push("Total chunks field should be a number.");
                errors["totalChunks"] = totalChunksErrors;
                totalChunksIsNumber = false;
            }
        }
    }

    if (totalChunks && chunkIndex && chunkIndexIsNumber && totalChunksIsNumber) {
        const lastUploadData = await redisClient.get(`video:${id}:videoId`);

        if (lastUploadData) {
            const lastChunkIndex = lastUploadData.split("-")[0];
            const lastTotalChunks = lastUploadData.split("-")[1];

            if (chunkIndex != (parseInt(lastChunkIndex) + 1)) {
                chunkIndexErrors.push(`Chunk index mismatch. Server is expecting chunk index ${parseInt(lastChunkIndex) + 1}`);
                errors["chunkIndex"] = chunkIndexErrors;
            }

            if (totalChunks != parseInt(lastTotalChunks)) {
                totalChunksErrors.push("Total chunks should not be changed.");
                errors["totalChunks"] = totalChunksErrors;
            }
        }
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json(errors);
    }

    next();
}