import { defineConfig, env } from "prisma/config";

export default defineConfig({
	schema: "./schema.prisma",
	migrations: {
		path: "./migrations",
	},
	datasource: {
		url: env("MONGO_DATABASE_URL"),
	},
	engine: "classic",
});
