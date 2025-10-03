import fsp from "fs/promises"
import fs from "fs";
import path from "path"

export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fsp.access(filePath);
        return true;
    } catch {
        return false;
    }
}

export async function deleteFile(filePath: string) {
    try {
        await fsp.unlink(filePath);
        return { isDeleted: true, message: "File deleted successfully." }
    } catch (error) {
        return { isDeleted: false, message: error.message }
    }
}

export async function combineChunks(videoId: string, totalChunks: number) {
    const tempDir = path.join(process.cwd(), "src/uploads/temp", videoId);
    const finalPath = path.join(process.cwd(), "src/uploads", `${videoId}.mp4`);
    const writer = fs.createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(tempDir, `${i}.part`);

        if (!(await fileExists(chunkPath))) {
            throw new Error(`Missing chunk: ${i}`);
        }

        const data = await fsp.readFile(chunkPath);
        writer.write(data);
    }

    writer.end();
    console.log("Video assembled:", finalPath)

    return finalPath;
}