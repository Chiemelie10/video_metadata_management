import winston, { createLogger, format, transports } from "winston";
import { appEnv } from "./data-source";
import { dailyRotateFileTransport } from "./transport";
import fs from "fs";
import path from "path";

const { combine, timestamp, errors, json, printf, colorize } = format;

const logDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

export const dailyRotateFileLogger = createLogger({
    level: "info",
    format: combine(
        timestamp(),
        errors({stack: true}),
        json(),
    ),
    transports: [
        dailyRotateFileTransport
    ]
});

// Logs only errors emited by dailyRotateFileLogger.
export const fileLogger = createLogger({
    level: "info",
    format: combine(
        timestamp(),
        errors({stack: true}),
        json(),
    ),
    transports: [
        new transports.File({ filename: path.join(logDir, "dailyRotateTransportErrors.log"), level: "info" })
    ]
});

if (appEnv.NODE_ENV !== "production") {
    dailyRotateFileLogger.add(
        new transports.Console({
            level: 'debug',
            format: combine(
                colorize(),
                timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                errors({ stack: true }),
                printf(({ level, message, timestamp, stack }) => {
                    return stack
                        ? `${timestamp} [${level.toUpperCase()}]: ${stack}`
                        : `${timestamp} [${level.toUpperCase()}]: ${message}`
                }),
            )
        })
    )
}
