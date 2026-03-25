import {
	Controller,
	Post,
	Body,
	Req,
	Res,
	Inject,
	HttpException,
	HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
	RequireXHR,
	AccessType,
	AccessTypes,
	ValidationSchema,
} from "@shared/backend";
import {
	signInSchema,
	signUpSchema,
	restoreSchema,
	refreshTokenSchema,
	signOutSchema,
	type SignInReqBodySchema,
	type SignUpReqBodySchema,
	type SignUpResSchema,
} from "shared";
import { AuthService } from "../services";

@Controller("api")
export class BasicController {
	constructor(@Inject(AuthService) private readonly authService: AuthService) {}

	/**
	 * Register a new account
	 */
	@Post("signup")
	@RequireXHR()
	@AccessType(AccessTypes.NoAuth)
	@ValidationSchema(signUpSchema)
	async signUp(@Body() body: SignUpReqBodySchema): Promise<SignUpResSchema> {
		return await this.authService.signUp(body);
	}

	/**
	 * Login
	 */
	@Post("signin")
	@RequireXHR()
	@AccessType(AccessTypes.NoAuth)
	@ValidationSchema(signInSchema)
	async signIn(
		@Body() body: SignInReqBodySchema,
		@Res({ passthrough: true }) res: Response,
	): Promise<void> {
		const tokens = await this.authService.signIn(body);

		res.cookie(...tokens.accessToken);
		res.cookie(...tokens.refreshToken);
	}

	/**
	 * Logout
	 */
	@Post("signout")
	@RequireXHR()
	@AccessType(AccessTypes.Any)
	@ValidationSchema(signOutSchema)
	signOut(@Res({ passthrough: true }) res: Response): void {
		const cookies = this.authService.signOut();

		for (const [name, options] of cookies) {
			res.clearCookie(name, options);
		}
	}

	/**
	 * Restore account
	 */
	@Post("restore")
	@RequireXHR()
	@AccessType(AccessTypes.NoAuth)
	@ValidationSchema(restoreSchema)
	restore(): never {
		throw new HttpException("Not Implemented", HttpStatus.NOT_IMPLEMENTED);
	}

	/**
	 * Refresh token pair
	 */
	@Post("refresh-token")
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
}
