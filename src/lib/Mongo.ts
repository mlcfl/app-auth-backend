import { MongoMemoryReplSet } from "mongodb-memory-server";
import { execa } from "execa";
import { PrismaClient } from "../generated/mongo/client";

let datasourceUrl = process.env.MONGO_DATABASE_URL;

if (process.env.DATABASE_MODE === "memory") {
	console.log("Starting in-memory MongoDB instance...");

	const db = await MongoMemoryReplSet.create({
		replSet: {
			count: 1,
			dbName: "mlc-app-auth",
		},
	});

	datasourceUrl = `${db.getUri().split("?")[0]}mlc-app-auth`;
	process.env.MONGO_DATABASE_URL = datasourceUrl;

	// Push the Prisma schema to the in-memory database
	await execa("pnpm prisma:deploy:mongo", {
		stdio: "inherit",
		env: {
			...process.env,
			MONGO_DATABASE_URL: datasourceUrl,
		},
	});

	console.log("In-memory MongoDB instance started.");
}

export const Mongo = new PrismaClient({ datasourceUrl });
