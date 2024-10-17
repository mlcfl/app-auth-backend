import {join} from 'node:path';
import {
	Router,
	Method,
	Req,
	Res,
	GET,
	type Request,
	type Response,
} from 'common/be/router';
import {Controller} from 'common/be/Controller';
import {Fs, Project} from 'common/be/services';
import {DiKeys} from 'common/be/di';
import {appDi} from '~/appDi';

@Router()
export class RootController extends Controller {
	@Method(GET, '/')
	@Method(GET, '/:page')
	async getPage(@Req() req: Request, @Res() res: Response): Promise<Response | void> {
		const {originalUrl, cookies} = req;

		// Already has accessToken cookie
		if (cookies.at) {
			const {env} = Project.getInstance<Project>();
			const {HOST, SERVER_PORT} = env;

			res.redirect(`http://${HOST}:${SERVER_PORT}`);
			return;
		}

		const appName = appDi.get<string>(DiKeys.AppName);

		const distPath = `${Fs.rootPath}/apps/${appName}/${appName}-frontend/dist`;
		const distPathDi = `${Fs.rootPathDi}/apps/${appName}/${appName}-frontend/dist`;

		const page = await this.renderPage({
			originalUrl,
			manifestPath: join(distPath, '/ssr-manifest.json'),
			templatePath: join(distPath, '/index.html'),
			renderPath: join(distPathDi, '/.server/server.js'),
		});

		return res.send(page);
	}

	private async renderPage({
		originalUrl,
		manifestPath,
		templatePath,
		renderPath,
	}: Record<string, string>) {
		const theme = 'default';

		const manifest = await Fs.readJsonFile(manifestPath);
		const template = await Fs.readFile(templatePath);
		const {render} = await import(renderPath);
		const {html, assets} = await render(originalUrl, manifest);

		return this.replaceMasks(template, {
			html,
			assets,
			themeStyles: [
				'<link rel="stylesheet" href="/assets/styles/base.css">',
				`<link rel="stylesheet" href="/assets/themes/${theme}.css">`,
			].join(''),
		});
	}

	private replaceMasks(template: string, data: Record<string, string>): string {
		for (const [mask, content] of Object.entries(data)) {
			template = template.replace(`<!--[${mask}]-->`, content);
		}

		return template;
	}
}
