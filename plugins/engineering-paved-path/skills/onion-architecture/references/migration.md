# Backend migration map

## Target

Each feature under the backend's `src/modules/` owns its domain rules, application use cases and ports, inbound HTTP adapters, and outbound persistence/provider adapters. The platform composition root supplies implementations.

## Typical mapping from a layered-by-type codebase

Adjust to the repository's real file names.

| Current area | Target responsibility |
|---|---|
| `modules/*/routes.ts` | `adapters/inbound/http/` |
| `modules/*/service.ts` | `application/use-cases/` after narrowing dependencies |
| `modules/*/repository*.ts` | `adapters/outbound/persistence/` |
| `modules/*/helpers.ts`, pure status/derivation | `domain/` or `application/dto/` |
| `src/adapters/*` | shared outbound adapters implementing feature ports |
| `src/platform/container.ts` (or similar) | composition root; concrete wiring only |
| `src/db/*` | infrastructure persistence implementation |

## Migration order

1. Add the use-case contract and port interfaces.
2. Extract direct SQL from routes into an outbound repository.
3. Move orchestration into an application use case with narrow injected ports.
4. Leave the route as a transport adapter and keep response behavior unchanged.
5. Move pure rules and mapping out of the route/service into domain/application code.
6. Wire the use case in the composition root and delete compatibility wrappers when callers are migrated.
7. Run the repository's architecture check, typecheck, and focused tests before the full suite.

Do the highest-value work first: remove direct database access from HTTP adapters, then services that receive the whole container.

## Non-regression constraints

- Keep workspace/tenant scoping in every repository method.
- Keep transactions at the use-case boundary.
- Do not move or rewrite past database migrations or their journal.
- Preserve any invariant the repository documents in its `AGENTS.md`/`CLAUDE.md` or insights file.
