# lib

Infrastructure layer. Contains initialized clients and connections to external systems.

## What belongs here

- Database clients (Prisma, raw drivers)
- Cache clients (Redis, Memcached)
- Message queue clients (RabbitMQ, Bull)
- External API clients (HTTP clients, SDKs)
- Any other third-party service that requires initialization before use

## Difference from helpers

- **lib** depends on external systems (databases, APIs, services) and requires initialization. It is the boundary between the application and the outside world.
- **helpers** are pure classes with no external dependencies — they work with data in memory only and can be used anywhere without side effects.

## What does NOT belong here

- Business logic — that belongs in `services/`
- Data access queries — that belongs in `repositories/`
- Application configuration parsing — that belongs in `config/` or `types/`

## How it works

Each client is declared as a module-level variable and initialized via an `init*` function
called during application startup (in `server.ts`). After initialization, the client is
exported and used directly by repositories.

```
server.ts → initPostgres() / initMongo()
                ↓
repositories/ → import { Postgres } / import { Mongo }
```
