import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { execa } from "execa";
import { PrismaClient } from "../generated/mongo/client";
import type { AppConfig } from "../types";

let Mongo: PrismaClient;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const initMongo = async (appConfig?: AppConfig) => {
	const mode = appConfig?.dbMode ?? process.env.DATABASE_MODE;
	let datasourceUrl = appConfig?.mongoUrl ?? process.env.MONGO_DATABASE_URL;

	if (mode === "memory") {
		console.log("Starting in-memory MongoDB instance...");

		const db = await MongoMemoryReplSet.create({
			replSet: {
				count: 1,
				dbName: "mlc-app-auth",
			},
		});

		datasourceUrl = `${db.getUri().split("?")[0]}mlc-app-auth`;

		// Push the Prisma schema to the in-memory database
		await execa("pnpm prisma:deploy:mongo", {
			stdio: "inherit",
			env: {
				...process.env,
				MONGO_DATABASE_URL: datasourceUrl,
			},
			cwd: join(__dirname, ".."),
		});

		console.log("In-memory MongoDB instance started.");
	}

	Mongo = new PrismaClient({ datasourceUrl });
};

export { Mongo };
