import { NextFunction, Request, Response } from "express";
import { dailyRotateFileLogger } from "../../config/logger";
import { notifySlack } from "../../services/errorLogService";
import multer from "multer";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            error: err.message
        });
    }

    dailyRotateFileLogger.error(`${err.message} - ${req.method} ${req.url} -${err.stack}`);
    notifySlack(err);
    res.status(500).json({message: err.message});
}