import { Controller, Get, Inject, Next, Req, Res } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { PagesService } from "@shared/backend";

// Pages accessible only without auth — redirect to "/" if authenticated
const NO_AUTH_PATHS = ["/signin", "/signup", "/restore"];
// Pages accessible only with auth — redirect to "/" if not authenticated
const AUTH_PATHS = ["/settings"];

/**
 * TODO: Temp solution, then move these checks to guards or middleware
 */
@Controller()
export class PagesController {
	constructor(
		@Inject(PagesService) private readonly pagesService: PagesService,
	) {}

	// Both "/" and "/*path" are needed because Express v5 wildcards require at least one character
	@Get(["/", "*path"])
	servePage(
		@Req() req: Request,
		@Res() res: Response,
		@Next() next: NextFunction,
	): void {
		// Exclude API routes from page handling
		if (req.path.startsWith("/api/")) {
			next();
			return;
		}

		const authenticated = Boolean(req.cookies.at);

		// Root: dispatch based on auth status
		if (req.path === "/") {
			res.redirect(authenticated ? "/settings" : "/signin");
			return;
		}

		const isNoAuth = NO_AUTH_PATHS.some(
			(p) => req.path === p || req.path.startsWith(p + "/"),
		);
		const isAuth = AUTH_PATHS.some(
			(p) => req.path === p || req.path.startsWith(p + "/"),
		);

		if (isNoAuth && authenticated) {
			res.redirect("/");
			return;
		}

		if (isAuth && !authenticated) {
			res.redirect("/");
			return;
		}

		this.pagesService.handlePage(req, res, next);
	}
}
