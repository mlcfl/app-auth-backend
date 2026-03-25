import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { expressErrorHandler } from "@shared/backend";
import { AppModule } from "./app.module";
import { initDatabases } from "./utils";
import type { AppConfig } from "./types";

export const server = async (appConfig?: AppConfig) => {
	await initDatabases(appConfig);

	const nestApp = await NestFactory.create<NestExpressApplication>(AppModule);
	const expressApp = nestApp.getHttpAdapter().getInstance();

	nestApp.use(cookieParser());

	await nestApp.init();

	expressApp.use(expressErrorHandler);

	return expressApp;
};
