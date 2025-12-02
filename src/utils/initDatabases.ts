import { Postgres, Mongo } from "../lib";

export const initDatabases = async () => {
	process.on("SIGINT", async () => {
		await Postgres.$disconnect();
		await Mongo.$disconnect();

		process.exit(0);
	});
};
