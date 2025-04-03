import { cwd } from "node:process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { Service } from "@shared/backend";
import { SessionsRepository } from "../repositories";

type Payload = {
	id: string;
};
type Cookie = [string, string, CookieOptions];
type TokenPair = {
	readonly accessToken: Cookie;
	readonly refreshToken: Cookie;
};

export class TokenService extends Service {
	private static privateKeyPath = join(cwd(), "./privateKey.pem");
	private static publicKeyPath = join(cwd(), "./publicKey.pem");
	private static privateKey = readFile(this.privateKeyPath, "utf8");
	private static publicKey = readFile(this.publicKeyPath, "utf8");
	private static jwtAlgorithm: jwt.Algorithm = "RS256";
	private static accessTokenMaxAge = "1h" as const;
	private static refreshTokenMaxAge = "7d" as const;

	static readonly accessTokenName = "at";
	static readonly refreshTokenName = "rt";
	static readonly tempTokenName = "tt";

	private static get defaultTokenOptions(): CookieOptions {
		const host = process.env.HOST ?? "mlc.local";

		return {
			secure: false, // true for prod
			httpOnly: true,
			signed: false,
			sameSite: "strict",
			domain: "." + host,
		};
	}

	static get accessTokenOptions(): CookieOptions {
		return {
			...this.defaultTokenOptions,
			path: "/",
		};
	}

	static get refreshTokenOptions(): CookieOptions {
		return {
			...this.defaultTokenOptions,
			path: "/api/refresh-token",
		};
	}

	static get tempTokenOptions(): CookieOptions {
		return {
			...this.defaultTokenOptions,
			path: "/api",
		};
	}

	static async createTokenPair(
		login: string,
		tempToken: string
	): Promise<TokenPair | null> {
		const isValid = SessionsRepository.isTempTokenValid(login, tempToken);

		if (!isValid) {
			return null;
		}

		return await this.createTokens({ id: login });
	}

	static async updateTokenPair(token: string): Promise<TokenPair | null> {
		const { id } = await this.verify(token);

		if (!id) {
			return null;
		}

		return await this.createTokens({ id });
	}

	static async verify(token: string): Promise<Payload> {
		const publicKey = await this.publicKey;

		try {
			return jwt.verify(token, publicKey, {
				algorithms: [this.jwtAlgorithm],
			}) as Payload;
		} catch (e) {
			return {} as Payload;
		}
	}

	private static async createTokens(payload: Payload): Promise<TokenPair> {
		const accessToken = await this.createAccessToken(payload);
		const refreshToken = await this.createRefreshToken(payload);

		const accessTokenExpires = new Date();
		accessTokenExpires.setHours(accessTokenExpires.getHours() + 1);

		const refreshTokenExpires = new Date();
		refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7);

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

	private static async createAccessToken(payload: Payload): Promise<string> {
		const privateKey = await this.privateKey;

		return jwt.sign(payload, privateKey, {
			algorithm: this.jwtAlgorithm,
			expiresIn: this.accessTokenMaxAge,
		});
	}

	private static async createRefreshToken(payload: Payload): Promise<string> {
		const privateKey = await this.privateKey;

		return jwt.sign(payload, privateKey, {
			algorithm: this.jwtAlgorithm,
			expiresIn: this.refreshTokenMaxAge,
		});
	}
}
