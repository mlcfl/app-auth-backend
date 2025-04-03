import { Repository } from "@shared/backend";

type User = {
	uid: string;
	login: string;
	password: {
		hash: string;
		salt: string;
	};
	passwordKdfType: "bcrypt" | "scrypt" | "argon2id";
	pepperVersion: number;
	createdDate: string;
	agreements: {
		cookie: boolean;
		rules: boolean;
		personal: boolean;
	};
};

export class UsersRepository extends Repository {
	/**
	 * Create a new user
	 */
	static async createNew(user: User): Promise<void> {
		const keys = Object.keys(user)
			.map((key) => `"${key}"`)
			.join(", ");
		const values = Object.values(user);
		const queue = values.map((_, i) => `$${i + 1}`).join(", ");

		await this.postgres.query(
			`INSERT INTO users (${keys}) VALUES (${queue})`,
			values
		);
	}

	/**
	 * Return the password data to compare with the data from the request
	 */
	static async getPasswordByLogin(login: string): Promise<{ rows: User[] }> {
		return this.postgres.query(
			'SELECT "password", "passwordKdfType", "pepperVersion" FROM users WHERE login = $1 LIMIT 1',
			[login]
		);
	}
}
