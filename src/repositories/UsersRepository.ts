import { Repository } from "@shared/backend";
import { prisma } from "../lib/prisma";
import { KdfTypes, Prisma } from "../generated/prisma/client";

type User = Prisma.UsersGetPayload<{
	select: {
		uid: true;
		login: true;
		password: true;
		passwordKdfType: true;
		pepperVersion: true;
		createdDate: true;
		agreements: true;
	};
}> & {
	password: {
		hash: string;
		salt: string;
	};
	agreements: {
		cookie: boolean;
		rules: boolean;
		personal: boolean;
	};
};

type PasswordData = {
	password: User["password"];
	passwordKdfType: KdfTypes;
	pepperVersion: number;
};

export class UsersRepository extends Repository {
	/**
	 * Create a new user
	 */
	static async createNew(user: User): Promise<void> {
		await prisma.users.create({
			data: {
				uid: user.uid,
				login: user.login,
				password: user.password,
				passwordKdfType: user.passwordKdfType,
				pepperVersion: user.pepperVersion,
				createdDate: user.createdDate,
				agreements: user.agreements,
			},
		});
	}

	/**
	 * Return the password data to compare with the data from the request
	 */
	static async getPasswordByLogin(login: string): Promise<PasswordData | null> {
		const record = await prisma.users.findFirst({
			where: { login },
			select: {
				password: true,
				passwordKdfType: true,
				pepperVersion: true,
			},
		});

		if (!record) {
			return null;
		}

		return {
			...record,
			password: record.password as User["password"],
		};
	}
}
