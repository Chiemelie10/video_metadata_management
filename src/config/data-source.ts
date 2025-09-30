import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "dotenv";

const appEnv: NodeJS.ProcessEnv = {};
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
    entities: ["src/models/**/*.ts"],
    migrations: ["src/migrations/**/*.ts"],
    subscribers: ["src/subscriber/**/*.ts"]
})