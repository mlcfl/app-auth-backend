import { ValidateRequestError } from "./ValidateRequestError";
import type {
	ValidateRequestReq,
	ValidateRequestQuerySchema,
	ValidateRequestBodySchema,
	ValidateRequestSchema,
} from "./types";

/**
 * Middleware to validate request object using Joi.
 *
 * Suitable for both client and server (Express)
 */
export async function validateRequest<Q, B>(
	req: ValidateRequestReq,
	schema: ValidateRequestSchema<Q, B>
): Promise<{ query: Q; body: B }>;
export async function validateRequest<T>(
	req: ValidateRequestReq,
	schema: ValidateRequestQuerySchema<T>
): Promise<{ query: T }>;
export async function validateRequest<T>(
	req: ValidateRequestReq,
	schema: ValidateRequestBodySchema<T>
): Promise<{ body: T }>;
export async function validateRequest<Q, B>(
	req: ValidateRequestReq,
	schema: Partial<ValidateRequestSchema<Q, B>>
): Promise<{ query?: Q; body?: B }> {
	const { query, body } = req;

	// Sort by frequency of use
	// - query, + body
	if (!schema.query && schema.body) {
		return { body: await schema.body.validateAsync(body) };
	}

	// + query, - body
	if (schema.query && !schema.body) {
		return { query: await schema.query.validateAsync(query) };
	}

	// + query, + body
	if (schema.query && schema.body) {
		const validatedQuery = await schema.query.validateAsync(query);
		const validatedBody = await schema.body.validateAsync(body);

		return {
			query: validatedQuery,
			body: validatedBody,
		};
	}

	// - query, - body
	throw new ValidateRequestError({
		code: "InvalidSchema",
		message: `Expected an object with keys: query or/and body, received: ${Object.keys(
			schema
		).join(", ")}.`,
	});
}
