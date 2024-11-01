import process from 'node:process';
import {join} from 'node:path';
import express, {type Express} from 'express';
import cookieParser from 'cookie-parser';
import {ExpressMiddlewares} from 'common/be/ExpressMiddlewares';
import {Project} from 'common/be/services';
import {useExpressServer} from 'common/be/router';
import {TokenController} from 'common/be/controllers';
import {RootController, ApiController} from './controllers';
import {Postgres, Mongo} from 'common/be/db';
import {DiKeys} from 'common/be/di';
import {appDi} from './appDi';

import 'reflect-metadata';

const initDatabases = async () => {
	const {env} = Project.getInstance<Project>();

	const postgres = new Postgres({
		user: env.PGUSER,
		password: env.PGPASSWORD,
		host: env.PGHOST,
		database: env.PGDATABASE,
		port: env.PGPORT,
	});

	const mongo = new Mongo(env.MONGO_CONNECTION_STRING);
	await mongo.connect();

	appDi.bind(DiKeys.Postgres).toConstantValue(postgres);
	appDi.bind(DiKeys.Mongo).toConstantValue(mongo);

	process.on('SIGINT', async () => {
		await postgres.pool.end();
		await mongo.disconnect();
		process.exit(0);
	});
};

/**
 * SSR example
 */
export const load = async (name: string): Promise<Express> => {
	const app = express();
	const {paths} = Project.getInstance<Project>();

	appDi.bind(DiKeys.AppName).toConstantValue(name);

	app.use(cookieParser());
	app.use(express.json());

	app.use('/assets/themes', express.static(join(paths.common.frontend, '/dist/themes'), {index: false}));
	app.use('/assets/styles', express.static(join(paths.common.frontend, '/dist/styles'), {index: false}));
	// Exclude "/.server" by adding double "/assets" and exclude "dist/index.html" by adding {index: false}
	app.use('/assets', express.static(join(paths.app(name).frontend, '/dist/assets'), {index: false}));

	await initDatabases();

	// Add routes
	useExpressServer(app, {
		controllers: [
			RootController,
			TokenController,
			ApiController,
		],
		defaultErrorHandler: false,
	});

	// Add 404 & error handlers
	app.use(ExpressMiddlewares.notFound(name));
	app.use(ExpressMiddlewares.errorHandler(name));

	return app;
};
