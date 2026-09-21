# URL Shortener Engineering Plan

## Objective
Build a reviewable URL shortener prototype with protected management APIs, public redirects, click analytics, reliability controls, tests, and documentation.

## Requirements and Acceptance Criteria

- Create random short codes and validate optional aliases.
- Redirect valid codes and return clear errors for unknown or expired codes.
- Protect management and analytics APIs with `X-API-Key`.
- Record click analytics without delaying the redirect response.
- Apply configurable rate limiting to URL creation.
- Provide health, OpenAPI, Swagger UI, and dashboard surfaces.
- Keep routes, services, repositories, and middleware independently testable.
- Validate with unit tests, integration tests, linting, security review, and smoke testing.

## Sequenced Tasks

| Task | Scenario | Dependencies | Acceptance criteria | Validation |
|---|---|---|---|---|
| 1. Foundation | Foundation | None | App factory, server entry point, config, scripts, and directories exist | Startup review and lint |
| 2. Persistence | Foundation | 1 | Schema and repositories support URL and click records with parameterized SQL | Repository unit tests |
| 3. Core API | Greenfield | 2 | Shorten, redirect, list, and delete workflows work with documented errors | Supertest integration tests |
| 4. Analytics | Brownfield | 3 | Redirects record privacy-preserving clicks and analytics endpoints return bounded results | Analytics integration tests |
| 5. Reliability | Ambiguous | 3 | Configurable per-key sliding-window limiting returns standard headers and 429 responses | Rate-limit unit tests |
| 6. Operations/docs | Foundation | 1-5 | Health endpoint, OpenAPI spec, Swagger UI, and dashboard are available | Contract and smoke review |
| 7. Quality package | Foundation | 1-6 | Tests, linting, README, architecture, risks, and execution evidence are complete | Full quality-gate review |

## Definition of Done

- Every acceptance criterion has an executable test or documented manual check.
- AI-generated suggestions have an engineer decision and rationale.
- Security and scalability limitations are documented and accepted explicitly.
- No secret, credential, production data, or private customer data is included in prompts or repository evidence.
- Final approval identifies the prototype deployment boundary and remaining production work.
