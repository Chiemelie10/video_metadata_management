import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "dotenv";

export const appEnv: NodeJS.ProcessEnv = {};
config({ processEnv: appEnv });

export const AppDataSource = new DataSource({
    type: "mysql",
    host: appEnv.DB_HOST || "localhost",
    port: 3306,
    username: appEnv.DB_USER || "test",
    password: appEnv.DB_PASSWORD || "test",
    database: appEnv.DB_NAME || "test",
    synchronize: false,
    migrationsRun: false,
    logging: false,
    entities: appEnv.NODE_ENV === "production" ? ["build/models/**/*.js"] : ["src/models/**/*.ts"],
    migrations: appEnv.NODE_ENV === "production" ? ["build/migrations/**/*.js"] : ["src/migrations/**/*.ts"],
    subscribers: appEnv.NODE_ENV === "production" ? ["build/subscriber/**/*.js"] : ["src/subscriber/**/*.ts"]
})