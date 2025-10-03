import {Request, Response, NextFunction} from "express";
import { redisClient } from "../../config/redis";
import { UploadVideoData, UploadVideoFieldError } from "../../types/video";
import multer from "multer";

export const validateUploadVideoData = (req: Request, res: Response, next: NextFunction) => {
    const upload = multer().single("video");

    upload(req, res, async (error) => {
        if (error instanceof multer.MulterError) {
            return res.status(400).json({
                error: error.message
            });
        } else if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

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
    
        const chunkIndexIsNumber = typeof chunkIndex === "number";
        const totalChunksIsNumber = typeof totalChunks === "number";
    
        if (chunkIndex) {
            if (!chunkIndexIsNumber) {
                chunkIndexErrors.push("Chunk index field should be a number.");
                errors["chunkIndex"] = chunkIndexErrors;
            }
        }
    
        if (totalChunks) {
            if (!totalChunksIsNumber) {
                totalChunksErrors.push("Total chunks field should be a number.");
                errors["totalChunks"] = totalChunksErrors;
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
    });
}