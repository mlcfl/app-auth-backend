import { join } from "node:path";
import { tmpdir, platform } from "node:os";
import { execa } from "execa";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as PostgresClient } from "../generated/postgres/client";
import { PrismaClient as SqliteClient } from "../generated/sqlite/client";

let client;

if (process.env.DATABASE_MODE === "memory") {
	console.log("Starting in-memory Postgres instance...");

	// For Unix-like systems, use memory
	// For Windows, use a temporary file
	const datasourceUrl =
		platform() !== "win32"
			? "file::memory:?cache=shared"
			: `file:${join(tmpdir(), `memory-${Date.now()}.db`)}`;

	client = new SqliteClient({ datasourceUrl });

	// Push the Prisma schema to the in-memory database
	await execa("pnpm prisma:deploy:sqlite", {
		stdio: "inherit",
		env: {
			...process.env,
			PG_DATABASE_URL: datasourceUrl,
		},
	});

	console.log("In-memory Postgres instance started.");
} else {
	const connectionString = process.env.PG_DATABASE_URL;
	const adapter = new PrismaPg({ connectionString });
	client = new PostgresClient({ adapter });
}

export const Postgres = client;
