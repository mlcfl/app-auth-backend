import {
	Router,
	Method,
	GET,
	POST,
	type Request,
	type Response,
	Controller,
} from "@shared/backend";
import { TokenService } from "../services";

@Router("/api")
export class TokenController extends Controller {
	@Method(GET, "/ping")
	async ping(req: Request, res: Response) {
		return res.sendStatus(200);
	}

	/**
	 * Try to update refresh token and redirect to src page
	 */
	@Method(GET, "/refresh-token")
	async redirectWithUpdate(req: Request, res: Response): Promise<Response> {
		const HOST = "mlc.local";
		const SERVER_PORT = "3000";
		const { rt: refreshToken } = req.cookies;

		// Update token pair
		if (refreshToken) {
			const tokens = await TokenService.updateTokenPair(refreshToken);

			if (!tokens) {
				return res.sendStatus(400);
			}

			// Create access token & refresh token
			res.cookie(...tokens.accessToken);
			res.cookie(...tokens.refreshToken);

			const uri = req.query.to
				? String(req.query.to)
				: `http://${HOST}:${SERVER_PORT}`;
			res.redirect(uri);
			return res.sendStatus(302);
		}

		// Remove all token cookies
		const {
			accessTokenName,
			accessTokenOptions,
			refreshTokenName,
			refreshTokenOptions,
		} = TokenService;

		res.clearCookie(accessTokenName, accessTokenOptions);
		res.clearCookie(refreshTokenName, refreshTokenOptions);

		// Redirect to login page
		const uri = `http://auth.${HOST}:${SERVER_PORT}/signin`;
		res.redirect(uri);
		return res.sendStatus(302);
	}

	@Method(POST, "/refresh-token")
	async refreshToken(req: Request, res: Response): Promise<Response> {
		if (!req.xhr) {
			return res.sendStatus(400);
		}

		const { login } = req.body;
		const { at: accessToken, rt: refreshToken, tt: tempToken } = req.cookies;

		if ((accessToken || refreshToken) && (tempToken || login)) {
			return res.sendStatus(400);
		}

		// Create token pair
		if (tempToken && login) {
			return this.createTokenPair(res, { login, tempToken });
		}

		// Update token pair
		if (refreshToken) {
			return this.updateTokenPair(res, refreshToken);
		}

		// Error
		return res.sendStatus(400);
	}

	@Method(POST, "/signout")
	async signOut(req: Request, res: Response): Promise<Response> {
		if (!req.xhr) {
			return res.sendStatus(400);
		}

		const {
			accessTokenName,
			accessTokenOptions,
			refreshTokenName,
			refreshTokenOptions,
		} = TokenService;

		res.clearCookie(accessTokenName, accessTokenOptions);
		res.clearCookie(refreshTokenName, refreshTokenOptions);

		return res.sendStatus(200);
	}

	private async createTokenPair(
		res: Response,
		{ login, tempToken }: { login: string; tempToken: string }
	): Promise<Response> {
		const tokens = await TokenService.createTokenPair(login, tempToken);

		if (!tokens) {
			return res.sendStatus(400);
		}

		const { tempTokenName, tempTokenOptions } = TokenService;

		// Delete temp cookie
		res.clearCookie(tempTokenName, tempTokenOptions);

		// Create access token & refresh token
		res.cookie(...tokens.accessToken);
		res.cookie(...tokens.refreshToken);

		return res.sendStatus(200);
	}

	private async updateTokenPair(
		res: Response,
		refreshToken: string
	): Promise<Response> {
		const tokens = await TokenService.updateTokenPair(refreshToken);

		if (!tokens) {
			return res.sendStatus(400);
		}

		// Create access token & refresh token
		res.cookie(...tokens.accessToken);
		res.cookie(...tokens.refreshToken);

		return res.sendStatus(200);
	}
}
