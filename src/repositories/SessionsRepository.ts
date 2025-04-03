import { Repository } from "@shared/backend";

export class SessionsRepository extends Repository {
	private static tempTokensList = new Map<
		string,
		{ token: string; expires: Date }
	>();

	/**
	 * Add a new temp token to memory
	 */
	static addTempToken(
		login: string,
		value: { token: string; expires: Date }
	): void {
		this.tempTokensList.set(login, value);
	}

	/**
	 * Iterates over all tokens in memory.
	 * Removes all tokens that have expired.
	 * If a token for the current user is found and valid, then returns true.
	 */
	static isTempTokenValid(login: string, token: string): boolean {
		const now = new Date().getTime();
		let valid = false;

		for (const [key, val] of this.tempTokensList) {
			const { token: tempToken, expires } = val;
			const expiresMs = expires.getTime();

			if (key === login && tempToken === token && expiresMs >= now) {
				valid = true;
				this.tempTokensList.delete(key);
				continue;
			}

			if (expiresMs < now) {
				this.tempTokensList.delete(key);
			}
		}

		return valid;
	}
}
