/**
 * Custom error types
 */
export type CustomErrorConstructorProps = {
	code?: string;
	message?: string;
};

export interface CustomError {
	new ({ code, message }?: CustomErrorConstructorProps): CustomErrorInstance;
}

export interface CustomErrorInstance extends Error {
	readonly code?: string;
}

export class ValidateRequestError extends Error implements CustomErrorInstance {
	readonly code?: string;

	constructor({ code, message }: CustomErrorConstructorProps) {
		super(message);

		this.name = this.constructor.name;
		this.code = code;
	}
}
