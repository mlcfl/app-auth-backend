import { PrismaClient } from "../generated/mongo/client";

export const Mongo = new PrismaClient({
	datasourceUrl: process.env.MONGO_DATABASE_URL,
});
