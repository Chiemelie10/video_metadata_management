import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { redisClient } from "./redis";

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const tempChunkDir = path.join(process.cwd(), "temp");
        fs.ensureDirSync(tempChunkDir);

        cb(null, tempChunkDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});
