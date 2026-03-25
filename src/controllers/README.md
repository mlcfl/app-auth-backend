# Controllers

Controllers are the thin HTTP layer between the network and business logic.

## Responsibilities

- Accept an HTTP request
- Return an HTTP response
- Set/clear cookies and headers via `res`
- Pass validated data to a service and return the result

## What controllers must NOT do

- Call repositories directly
- Contain business logic (validation rules, access checks, data processing)
- Make decisions based on data (e.g. `if (!user) return 400` — that belongs in the service)
- Know about token internals, cookie names, or other service implementation details

## Allowed dependencies

- **Services** — the only way to interact with business logic
- **HTTP primitives** — `@Body()`, `@Param()`, `@Req()`, `@Res()`, cookies, headers
- **Guards** — rate limiting, brute force protection, throttling and other request-level protections applied via decorators (e.g. `@Throttle()`)

## Error handling

Controllers do not handle errors themselves. Services throw NestJS exceptions
(`BadRequestException`, `UnauthorizedException`, `HttpException`, etc.) and
NestJS converts them to the appropriate HTTP responses automatically.

## Request/response validation

Validation is handled declaratively via decorators, not inside handler methods:

```
@RequireXHR() — rejects non-XHR requests (400)
@AccessType(type) — access control guard (400 / 401)
@ValidationSchema(schema) — Zod validation of req body/params + res body
```

See `shared-backend/src/decorators/` for details on each decorator.
