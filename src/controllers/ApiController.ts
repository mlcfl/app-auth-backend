import { Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { validateRequest } from "../utils";
import { signUpReqSchema, signInReqSchema } from "shared";
import { AuthService } from "../services";
import { SettingsRepository } from "../repositories";

@Controller("api")
export class ApiController {
	@Post("signup")
	async signUp(@Req() req: Request, @Res() res: Response): Promise<Response> {
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

	@Post("signin")
	async signIn(@Req() req: Request, @Res() res: Response): Promise<Response> {
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

	@Post("restore")
	async restore(@Req() _req: Request, @Res() res: Response): Promise<Response> {
		// Restore is not implemented yet
		return res.sendStatus(501);
	}
}
