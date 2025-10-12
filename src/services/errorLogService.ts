import axios from "axios";
import { appEnv } from "../config/data-source";
import { dailyRotateFileLogger } from "../config/logger";

const slackWebhookUrl = appEnv.SLACK_WEBHOOK_URL;

export async function notifySlack(error: Error) {
    if (!slackWebhookUrl) return;

    const message = {
        text: `*Server Error Detected!*\n
        *Message:* ${error.message}\n
        *Stack:* ${error.stack}`
    }

    try {
        await axios.post(slackWebhookUrl, message);
    } catch (err) {
        dailyRotateFileLogger.error(`${err.message} - ${err.stack}`);
    }
}