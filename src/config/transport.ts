import DailyRotateFile from "winston-daily-rotate-file";
import { fileLogger } from "./logger";

export const dailyRotateFileTransport: DailyRotateFile = new DailyRotateFile({
    level: "info",
    dirname: "logs",
    filename: "%DATE%-error.log",
    datePattern: "YYYY-MM-DD",
    utc: true,
    maxSize: "20m",
    maxFiles: "14d"
});

dailyRotateFileTransport.on("error", err => {
    fileLogger.error(`${err.message} - ${err.stack}`)
});

