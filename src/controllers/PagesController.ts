import { Controller, Get, Inject, Next, Req, Res } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { AccessTypes, PageAccess, PagesService } from "@shared/backend";

const noAuthPaths = ["/signin", "/signup", "/restore"];
const authPaths = ["/settings"];

@Controller()
export class PagesController {
	constructor(
		@Inject(PagesService) private readonly pagesService: PagesService,
	) {}

	@Get("/")
	serveRoot(@Req() req: Request, @Res() res: Response): void {
		const authenticated = Boolean(req.cookies.at);
		res.redirect(authenticated ? "/settings" : "/signin");
	}

	@Get(authPaths)
	@PageAccess(AccessTypes.Auth)
	serveAuthPage(
		@Req() req: Request,
		@Res() res: Response,
		@Next() next: NextFunction,
	): void {
		this.pagesService.handlePage(req, res, next);
	}

	@Get(noAuthPaths)
	@PageAccess(AccessTypes.NoAuth)
	serveNoAuthPage(
		@Req() req: Request,
		@Res() res: Response,
		@Next() next: NextFunction,
	): void {
		this.pagesService.handlePage(req, res, next);
	}
}
