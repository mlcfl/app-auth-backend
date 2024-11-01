import {validateRequest} from 'common/all/utils';
import {
	Router,
	Method,
	Req,
	Res,
	POST,
	type Request,
	type Response,
} from 'common/be/router';
import {Controller} from 'common/be/Controller';
import {signUpReqSchema, signInReqSchema} from 'common/schemas';
import {AuthService} from '~/services';
import {SettingsRepository} from '~/repositories';

@Router('/api')
export class ApiController extends Controller {
	@Method(POST, '/signup')
	async signUp(@Req() req: Request, @Res() res: Response): Promise<Response> {
		if (!req.xhr) {
			return res.sendStatus(400);
		}

		const {at: accessToken, rt: refreshToken} = req.cookies;

		if (accessToken || refreshToken) {
			return res.sendStatus(400);
		}

		const {body} = await validateRequest(req, signUpReqSchema);
		const {apps, endpoints} = await SettingsRepository.getToggles();

		if (!apps.auth || !endpoints.auth.signUp) {
			return res.sendStatus(400);
		}

		const {login, password} = await AuthService.signUp(body);

		return res.json({login: login.join('-'), password});
	}

	@Method(POST, '/signin')
	async signIn(@Req() req: Request, @Res() res: Response): Promise<Response> {
		if (!req.xhr) {
			return res.sendStatus(400);
		}

		const {at: accessToken, rt: refreshToken} = req.cookies;

		if (accessToken || refreshToken) {
			return res.sendStatus(400);
		}

		const {body} = await validateRequest(req, signInReqSchema);
		const {apps, endpoints} = await SettingsRepository.getToggles();

		if (!apps.auth || !endpoints.auth.signIn) {
			return res.sendStatus(400);
		}

		const cookie = await AuthService.signIn(body);

		if (!cookie) {
			return res.sendStatus(400);
		}

		res.cookie(...cookie);

		return res.sendStatus(200);
	}

	@Method(POST, '/restore')
	async restore(@Req() req: Request, @Res() res: Response): Promise<Response> {
		// Restore is not implemented yet
		return res.sendStatus(501);
	}
}
