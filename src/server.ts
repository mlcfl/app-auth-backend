import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import type { Request, Response, NextFunction } from "express";
import { initApi, initDatabases } from "./utils";
import { TokenService, getAppName, initHTMLPagesRender } from "@shared/backend";
import packageJson from "../package.json" assert { type: "json" };
import { AppModule } from "./app.module";
import type { AppConfig } from "./types";

const errorHandler = (
	error: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	if (res.headersSent) {
		return;
	}

	console.error(error);
	res.status(500).send("Internal server error");
};

export const server = async (appConfig?: AppConfig) => {
	const appName = getAppName(packageJson);
	const frontendRoot = resolve(
		import.meta.dirname,
		`../../${appName}-frontend`,
	);

	await initDatabases(appConfig);

	const nestApp = await NestFactory.create<NestExpressApplication>(AppModule);
	const expressApp = nestApp.getHttpAdapter().getInstance();

	nestApp.use(cookieParser());

	// API
	initApi(expressApp);

	// GET pages
	nestApp.use(async (req: Request, res: Response, next: NextFunction) => {
		// Do not check token for !GET requests
		if (req.method !== "GET") {
			return next();
		}

		// Do not check token for assets
		const assets =
			/\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|map|webp|json)$/;
		const assetsPath = /^\/(?:_nuxt|assets|static|api)/;
		const { originalUrl: url } = req;

		if (assetsPath.test(url) || assets.test(url)) {
			return next();
		}

		const { at: accessToken } = req.cookies;
		const uri = `http://apphub.mlc.local:3000`;

		// No accessToken cookie
		if (!accessToken) {
			return next();
		}

		const { id } = await TokenService.verify(accessToken);

		// Invalid accessToken
		if (!id) {
			return next();
		}

		res.redirect(uri);
	});

	// HTML pages
	await initHTMLPagesRender(expressApp, frontendRoot);

	await nestApp.init();

	expressApp.use(errorHandler);

	return expressApp;
};
