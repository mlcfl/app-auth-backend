import { prisma } from "../lib/prisma";

export const initDatabases = async () => {
	process.on("SIGINT", async () => {
		await prisma.$disconnect();
		process.exit(0);
	});
};
