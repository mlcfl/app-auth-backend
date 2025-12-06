import { Postgres, Mongo, initPostgres, initMongo } from "../lib";
import type { AppConfig } from "../types";

export const initDatabases = async (appConfig?: AppConfig) => {
	await initPostgres(appConfig);
	await initMongo(appConfig);

	process.on("SIGINT", async () => {
		await Postgres.$disconnect();
		await Mongo.$disconnect();

		process.exit(0);
	});
};
