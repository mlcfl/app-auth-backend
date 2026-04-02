import { Injectable, BadRequestException } from "@nestjs/common";
import type { CookieOptions } from "express";
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from "jose";

type Payload = {
	id: string;
};
type Cookie = [string, string, CookieOptions];

export type TokenPair = {
	readonly accessToken: Cookie;
	readonly refreshToken: Cookie;
};

/**
 * Service responsible for creating and verifying JWT tokens,
 * as well as generating cookie options for access and refresh tokens.
 */
@Injectable()
export class TokenService {
	private readonly algorithm = "RS256" as const;
	// Access token - 10 minutes
	private readonly accessTokenMaxAge = "10m" as const;
	private readonly accessTokenMaxAgeNum = 10 as const;
	// Refresh token - 1 day
	private readonly refreshTokenMaxAge = "1d" as const;
	private readonly refreshTokenMaxAgeNum = 1 as const;

	readonly accessTokenName = "at";
	readonly refreshTokenName = "rt";

	/**
	 * Shared cookie options
	 */
	private get defaultTokenOptions(): CookieOptions {
		const host = process.env.SERVER_HOST;
		// true for production, false for development or local
		const secure = process.env.HTTPS_ONLY === "true";

		return {
			secure,
			httpOnly: true,
			signed: false,
			sameSite: "strict",
			domain: "." + host,
		};
	}

	/**
	 * Access token cookie options
	 */
	get accessTokenOptions(): CookieOptions {
		return {
			...this.defaultTokenOptions,
			path: "/",
		};
	}

	/**
	 * Refresh token cookie options
	 */
	get refreshTokenOptions(): CookieOptions {
		return {
			...this.defaultTokenOptions,
			path: "/api/rt",
		};
	}

	/**
	 * Creates token pair for given user id
	 */
	async createTokenPair(id: string): Promise<TokenPair> {
		return await this.createTokens({ id });
	}

	/**
	 * Verifies refresh token and returns new token pair if valid
	 */
	async updateTokenPair(refreshToken: string): Promise<TokenPair> {
		const { id } = await this.verify(refreshToken);

		if (!id) {
			throw new BadRequestException();
		}

		return await this.createTokens({ id });
	}

	/**
	 * Verifies token and returns payload if valid, otherwise returns empty object
	 */
	async verify<T = Payload>(token: string): Promise<Partial<T>> {
		try {
			const publicKey = await importSPKI(
				Buffer.from(process.env.JWT_PUBLIC_KEY!, "base64").toString("utf8"),
				this.algorithm,
			);
			const { payload } = await jwtVerify<T>(token, publicKey);
			return payload;
		} catch {
			return {};
		}
	}

	/**
	 * Creates token pair
	 */
	private async createTokens(payload: Payload): Promise<TokenPair> {
		const accessToken = await this.createAccessToken(payload);
		const refreshToken = await this.createRefreshToken(payload);

		const accessTokenExpires = new Date();
		const minutes = accessTokenExpires.getMinutes() + this.accessTokenMaxAgeNum;
		accessTokenExpires.setMinutes(minutes);

		const refreshTokenExpires = new Date();
		const days = refreshTokenExpires.getDate() + this.refreshTokenMaxAgeNum;
		refreshTokenExpires.setDate(days);

		return {
			accessToken: [
				this.accessTokenName,
				accessToken,
				{ ...this.accessTokenOptions, expires: accessTokenExpires },
			],
			refreshToken: [
				this.refreshTokenName,
				refreshToken,
				{ ...this.refreshTokenOptions, expires: refreshTokenExpires },
			],
		};
	}

	private async createAccessToken(payload: Payload): Promise<string> {
		const privateKey = await importPKCS8(
			Buffer.from(process.env.JWT_PRIVATE_KEY!, "base64").toString("utf8"),
			this.algorithm,
		);

		return new SignJWT(payload)
			.setProtectedHeader({ alg: this.algorithm })
			.setExpirationTime(this.accessTokenMaxAge)
			.sign(privateKey);
	}

	private async createRefreshToken(payload: Payload): Promise<string> {
		const privateKey = await importPKCS8(
			Buffer.from(process.env.JWT_PRIVATE_KEY!, "base64").toString("utf8"),
			this.algorithm,
		);

		return new SignJWT(payload)
			.setProtectedHeader({ alg: this.algorithm })
			.setExpirationTime(this.refreshTokenMaxAge)
			.sign(privateKey);
	}
}
