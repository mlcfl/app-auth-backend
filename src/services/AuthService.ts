import { randomUUID } from "node:crypto";
import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { argon2id } from "@noble/hashes/argon2";
import { randomBytes, bytesToHex } from "@noble/hashes/utils";
import randomatic from "randomatic";
import type {
	SignUpReqBodySchema,
	SignUpResSchema,
	SignInReqBodySchema,
} from "shared";
import { TokenService, type TokenPair } from "./TokenService";
import { KdfTypes } from "../generated/postgres/client";
import {
	UniqueDataSourcesRepository,
	UsersRepository,
	SettingsRepository,
} from "../repositories";
import { UniqueIdGenerator, type GetInitialDataProps } from "../helpers";

/**
 * Basic operations: registration, login, logout, restore account, refresh token
 */
@Injectable()
export class AuthService {
	constructor(
		@Inject(UsersRepository) private readonly usersRepository: UsersRepository,
		@Inject(UniqueDataSourcesRepository) private readonly uniqueDataSourcesRepository: UniqueDataSourcesRepository,
		@Inject(SettingsRepository) private readonly settingsRepository: SettingsRepository,
		@Inject(TokenService) private readonly tokenService: TokenService,
	) {}

	/**
	 * Register a new account
	 */
	async signUp(body: SignUpReqBodySchema): Promise<SignUpResSchema> {
		const { appEnabled, endpoints } =
			await this.settingsRepository.getSettings();

		if (!appEnabled || !endpoints.signUp) {
			throw new BadRequestException();
		}

		const login = (await this.createLogin()).join("");
		const { password, ...passwordRest } = this.createPassword();

		const agreements: Record<keyof SignUpReqBodySchema | string, boolean> =
			Object.fromEntries(
				Object.entries(body).map(([key, val]) => [key, Boolean(val)]),
			);

		await this.saveNewUser({ ...passwordRest, login, agreements });

		return { login, password };
	}

	/**
	 * Verify credentials and return a token pair
	 */
	async signIn({ login, password }: SignInReqBodySchema): Promise<TokenPair> {
		const { appEnabled, endpoints } =
			await this.settingsRepository.getSettings();

		if (!appEnabled || !endpoints.signIn) {
			throw new BadRequestException();
		}

		const user = await this.usersRepository.getPasswordByLogin(login);

		if (!user) {
			throw new BadRequestException();
		}

		const {
			password: { hash, salt },
			passwordKdfType,
			pepperVersion,
		} = user;

		if (passwordKdfType !== KdfTypes.ARGON2ID || pepperVersion !== 1) {
			throw new BadRequestException();
		}

		const pepper = process.env.PASSWORD_PEPPER;
		const hashArray = argon2id(password, salt, {
			key: pepper,
			m: 47104,
			t: 1,
			p: 1,
		});

		if (bytesToHex(hashArray) !== hash) {
			throw new BadRequestException();
		}

		return await this.tokenService.createTokenPair(login);
	}

	/**
	 * Clear auth cookies
	 */
	signOut() {
		const {
			accessTokenName,
			refreshTokenName,
			accessTokenOptions,
			refreshTokenOptions,
		} = this.tokenService;

		return [
			[accessTokenName, accessTokenOptions],
			[refreshTokenName, refreshTokenOptions],
		] as const;
	}

	/**
	 * Verify refresh token and return a new token pair
	 */
	async refreshToken(refreshToken: string): Promise<TokenPair> {
		return await this.tokenService.updateTokenPair(refreshToken);
	}

	/**
	 * Creates a random, collision-resistant login and saves the updated collection in the database
	 */
	private async createLogin(): Promise<string[]> {
		const dataSource = this.uniqueDataSourcesRepository;
		const generator = UniqueIdGenerator;
		const options: GetInitialDataProps = {
			minNumber: 0,
			maxNumber: 9999,
			parts: 4,
		};

		const loginData =
			(await dataSource.getLoginData()) ?? generator.getInitialData(options);
		const { id: login, updatedUniqueData } = generator.generate(loginData);

		await dataSource.setLoginData(updatedUniqueData);

		return login;
	}

	/**
	 * Creates a random password. Also creates salt and hash to save them in the DB
	 *
	 * @see https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
	 */
	private createPassword(): {
		password: string;
		salt: string;
		hash: string;
		kdfType: KdfTypes;
		pepperVersion: number;
	} {
		const pepper = process.env.PASSWORD_PEPPER;
		const password = randomatic("*", 16, { exclude: "~^&()_+-={}[];',." });
		const salt = bytesToHex(randomBytes(32));
		const hashArray = argon2id(password, salt, {
			key: pepper,
			m: 47104,
			t: 1,
			p: 1,
		});
		const hash = bytesToHex(hashArray);

		return {
			password,
			salt,
			hash,
			kdfType: KdfTypes.ARGON2ID,
			pepperVersion: 1,
		};
	}

	/**
	 * Saves a new user in the DB
	 */
	private async saveNewUser({
		login,
		salt,
		hash,
		kdfType,
		pepperVersion,
		agreements,
	}: {
		login: string;
		salt: string;
		hash: string;
		kdfType: KdfTypes;
		pepperVersion: number;
		agreements: Record<keyof SignUpReqBodySchema, boolean>;
	}): Promise<void> {
		await this.usersRepository.createNew({
			uid: randomUUID(),
			login,
			password: { hash, salt },
			passwordKdfType: kdfType,
			pepperVersion,
			createdDate: new Date(),
			agreements,
		});
	}
}
