# Repositories

Data access layer. Repositories are the only place in the application that communicates
with databases directly.

## Responsibilities

- Read and write data to the database
- Map raw database records to application types
- Encapsulate query logic (filters, selects, transactions)

## What repositories must NOT do

- Contain business logic — that belongs in `services/`
- Call other repositories
- Throw HTTP exceptions (`BadRequestException`, etc.) — they may throw generic errors,
  but HTTP-level decisions belong in services or controllers
- Know about HTTP, cookies, headers, or any transport details

## Allowed dependencies

- **lib/** — database clients (`Postgres`, `Mongo`)
- **generated/** — Prisma-generated types and enums
