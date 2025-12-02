import { validateRequest } from "../utils";
import {
	Router,
	Method,
	POST,
	type Request,
	type Response,
	Controller,
} from "@shared/backend";
import { signUpReqSchema, signInReqSchema } from "shared";
import { AuthService } from "../services";
import { SettingsRepository } from "../repositories";

@Router("/api")
export class ApiController extends Controller {
	@Method(POST, "/signup")
	async signUp(req: Request, res: Response): Promise<Response> {
		if (!req.xhr) {
			return res.sendStatus(400);
		}

		const { at: accessToken, rt: refreshToken } = req.cookies;

		if (accessToken || refreshToken) {
			return res.sendStatus(400);
		}

		const { body } = await validateRequest(req, signUpReqSchema);
		const { appEnabled, endpoints } = await SettingsRepository.getSettings();

		if (!appEnabled || !endpoints.signUp) {
			return res.sendStatus(400);
		}

		const { login, password } = await AuthService.signUp(body);

		return res.json({ login: login.join("-"), password });
	}

	@Method(POST, "/signin")
	async signIn(req: Request, res: Response): Promise<Response> {
		if (!req.xhr) {
			return res.sendStatus(400);
		}

		const { at: accessToken, rt: refreshToken } = req.cookies;

		if (accessToken || refreshToken) {
			return res.sendStatus(400);
		}

		const { body } = await validateRequest(req, signInReqSchema);
		const { appEnabled, endpoints } = await SettingsRepository.getSettings();

		if (!appEnabled || !endpoints.signIn) {
			return res.sendStatus(400);
		}

		const cookie = await AuthService.signIn(body);

		if (!cookie) {
			return res.sendStatus(400);
		}

		res.cookie(...cookie);

		return res.sendStatus(200);
	}

	@Method(POST, "/restore")
	async restore(req: Request, res: Response): Promise<Response> {
		// Restore is not implemented yet
		return res.sendStatus(501);
	}
}
