import { Redis } from "ioredis";
import { appEnv } from "./data-source";

const host = appEnv.REDIS_HOST;
const password = appEnv.REDIS_PASSWORD;
let port = parseInt(appEnv.REDIS_PORT);

if (Number.isNaN(port)) {
    port = 6379;
}

export const redisClient = new Redis({
    port,
    host,
    password,
    maxRetriesPerRequest: null,
    retryStrategy: function (times) {
        let delay = Math.min(times * 10000, 60000);
        return delay;
    }
});

redisClient.on("error", (error) => {
    console.error("Failed to connect to redis server:", error);
})