import { Controller, Get, Post, Inject, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import {
	BaseAppService,
	RequireXHR,
	AccessType,
	AccessTypes,
	ValidationSchema,
} from "@shared/backend";
import { refreshTokenSchema } from "shared";
import { AuthService } from "../services";

@Controller("api")
export class TokenController {
	constructor(
		@Inject(AuthService) private readonly authService: AuthService,
		@Inject(BaseAppService) private readonly appService: BaseAppService,
	) {}

	/**
	 * Refresh token pair (XHR — used by API on 401)
	 */
	@Post("rt")
	@RequireXHR()
	@AccessType(AccessTypes.RefreshToken)
	@ValidationSchema(refreshTokenSchema)
	async refreshToken(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	): Promise<void> {
		const tokens = await this.authService.refreshToken(req.cookies.rt);

		res.cookie(...tokens.accessToken);
		res.cookie(...tokens.refreshToken);
	}

	/**
	 * Refresh token pair on page reload (browser navigation — used by PagesController redirect)
	 * Query params:
	 *   app — subdomain name of the target app (optional, for cross-app redirects)
	 *   to  — relative path to redirect after refresh (default: "/")
	 */
	@Get("rt")
	@AccessType(AccessTypes.Any)
	async refreshTokenPage(
		@Req() req: Request,
		@Res() res: Response,
		@Query("app") app?: string,
		@Query("to") to?: string,
	): Promise<void> {
		const { protocol, cookies } = req;
		const rt = cookies.rt as string | undefined;

		if (!rt) {
			res.redirect("/signin");
			return;
		}

		const host = process.env.SERVER_HOST;
		const port = process.env.SERVER_PORT;
		const portSuffix = port ? `:${port}` : "";
		const safeApp = /^[a-z0-9-]+$/i.test(app ?? "") ? app : null;
		const safeTo = to?.startsWith("/") ? to : "/";
		const isSameApp = !safeApp || safeApp === this.appService.appName;
		const destination = isSameApp
			? safeTo
			: `${protocol}://${safeApp}.${host}${portSuffix}${safeTo}`;

		try {
			const tokens = await this.authService.refreshToken(rt);

			res.cookie(...tokens.accessToken);
			res.cookie(...tokens.refreshToken);

			res.redirect(destination);
		} catch {
			res.redirect("/signin");
		}
	}
}
