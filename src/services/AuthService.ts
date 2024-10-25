import {randomUUID} from 'node:crypto';
import randomatic from 'randomatic';
import {argon2id} from '@noble/hashes/argon2';
import {randomBytes, bytesToHex} from '@noble/hashes/utils';
import {Service} from 'common/be/Service';
import {Project} from 'common/be/services';
import type {SignUpReqSchema} from 'common/schemas';
import {UniqueDataSourcesRepository, UsersRepository} from '~/repositories';
import {UniqueIdGenerator, type GetInitialDataProps} from '~/helpers';

/**
 * Authorization, registration, recovery
 */
export class AuthService extends Service {
	/**
	 * Sign up a new user
	 */
	static async signUp(body: SignUpReqSchema): Promise<{login: string[]; password: string;}> {
		const login = await this.createLogin();
		const {password, ...passwordRest} = this.createPassword();

		// Transform agreements into booleans
		const agreements: Record<keyof SignUpReqSchema | string, boolean> = Object.fromEntries(
			Object.entries(body).map(([key, val]) => [key, Boolean(val)])
		);

		// Save a new user
		await this.saveNewUser({...passwordRest, login, agreements});

		return {login, password};
	}

	/**
	 * Creates a random, collision-resistant login and saves the updated collection in the database
	 */
	private static async createLogin(): Promise<string[]> {
		const uniqueData = UniqueDataSourcesRepository;
		const generator = UniqueIdGenerator;

		const options: GetInitialDataProps = {
			minNumber: 0,
			maxNumber: 9999,
			parts: 4,
		};

		const loginData = await uniqueData.getLoginData() ?? generator.getInitialData(options);
		const {id: login, updatedUniqueData} = generator.generate(loginData);

		await uniqueData.setLoginData(updatedUniqueData);

		return login;
	}

	/**
	 * Creates a random password. Also creates salt and hash to save them in the DB
	 *
	 * @see https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
	 */
	private static createPassword(): {
		password: string;
		salt: string;
		hash: string;
		kdfType: 'argon2id';
		pepperVersion: number;
	} {
		const project = Project.getInstance<Project>();
		const pepper = project.env.PASSWORD_PEPPER;
		const password = randomatic('*', 16, {exclude: '~^&()_+-={}[];\',.'});
		const salt = bytesToHex(randomBytes(32));
		const hashArray = argon2id(password, salt, {
			key: pepper,
			m: 47104,
			t: 1,
			p: 1,
		});
		const hash = bytesToHex(hashArray);

		return {password, salt, hash, kdfType: 'argon2id', pepperVersion: 1};
	}

	/**
	 * Saves a new user in the DB
	 */
	private static async saveNewUser({
		login,
		salt,
		hash,
		kdfType,
		pepperVersion,
		agreements,
	}: {
		login: string[];
		salt: string;
		hash: string;
		kdfType: 'argon2id';
		pepperVersion: number;
		agreements: Record<keyof SignUpReqSchema, boolean>;
	}): Promise<void> {
		await UsersRepository.createNew({
			uid: randomUUID(),
			login: login.join(''),
			password: {
				hash,
				salt,
			},
			passwordKdfType: kdfType,
			pepperVersion,
			createdDate: new Date().toISOString(),
			agreements,
		});
	}
}
