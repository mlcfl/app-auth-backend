import type { ObjectSchema } from "joi";

export type ValidateRequestReq = {
	query?: unknown;
	body?: unknown;
};

export type ValidateRequestQuerySchema<T> = { query: ObjectSchema<T> };
export type ValidateRequestBodySchema<T> = { body: ObjectSchema<T> };
export type ValidateRequestSchema<Q, B> = ValidateRequestQuerySchema<Q> &
	ValidateRequestBodySchema<B>;
