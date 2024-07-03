import type {CustomErrorInstance, CustomErrorConstructorProps} from 'common/all/types';

export class UniqueIdGeneratorError extends Error implements CustomErrorInstance {
	readonly code?: string;

	constructor({code, message}: CustomErrorConstructorProps) {
		super(message);

		this.name = this.constructor.name;
		this.code = code;
	}
}

export enum UniqueIdGeneratorErrorCodes {
	AllCreated = 'AllCreated',
}
