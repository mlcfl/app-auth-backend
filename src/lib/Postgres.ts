import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/postgres/client";

const adapter = new PrismaPg({
	connectionString: process.env.PG_DATABASE_URL,
});

export const Postgres = new PrismaClient({ adapter });
