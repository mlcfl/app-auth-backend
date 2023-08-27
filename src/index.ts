import {join} from 'node:path';
import express, {Express} from 'express';
import {ExpressMiddlewares} from 'common/be/ExpressMiddlewares';
import {Fs} from 'common/be/services';

const replaceMasks = (template: string, data: Record<string, string>): string => {
	for (const [mask, content] of Object.entries(data)) {
		template = template.replace(`<!--[${mask}]-->`, content);
	}

	return template;
};

/**
 * SSR example (backend part)
 */
export const load = async (name: string): Promise<Express> => {
	const app = express();

	const distPath = `${Fs.rootPath}/apps/${name}/${name}-frontend/dist`;
	const distPathDi = `${Fs.rootPathDi}/apps/${name}/${name}-frontend/dist`;

	const manifestPath = join(distPath, '/ssr-manifest.json');
	const templatePath = join(distPath, '/index.html');
	const renderPath = join(distPathDi, '/.server/server.js');

	const manifest = await Fs.readJsonFile(manifestPath);
	const template = await Fs.readFile(templatePath);
	const {render} = await import(renderPath);

	// Exclude "/.server" by adding double "/assets" and exclude "dist/index.html" by adding {index: false}
	app.use('/assets', express.static(join(distPath, '/assets'), {index: false}));

	app.get(['/', '/:page'], async (req, res) => {
		const {originalUrl} = req;
		const {html, assets} = await render(originalUrl, manifest);
		const page = replaceMasks(template, {html, assets});

		res.send(page);
	});

	app.use(ExpressMiddlewares.notFound(name));
	app.use(ExpressMiddlewares.errorHandler(name));

	return app;
};
