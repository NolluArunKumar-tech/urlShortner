# AI-Assisted Engineering Execution Log

## Operating Principles

- The engineer owns requirements, architecture, implementation, security, correctness, and final approval.
- AI assists within bounded tasks: analysis, drafting, test generation, documentation, debugging, and review preparation.
- Every accepted AI contribution is reviewed against the acceptance criteria and validated with tests or an explicit manual check.
- No secrets, credentials, production data, or private customer information were provided to AI.

## Execution Record

### Task 1: Foundation

**Intent:** Establish a testable Node.js/Express service boundary.

**Context and constraints:** CommonJS modules, Node.js 18+, environment-based configuration, and an app factory importable by Supertest.

**AI contribution:** Proposed separate `src/app.js` and `src/server.js`, environment variables, and dependency-injected database access.

**Engineer decision:** Accepted the separation and injection boundary. Rejected starting the listener from the app factory because it would complicate tests.

**Evidence:** `src/app.js`, `src/server.js`, `package.json`.

**Validation:** Startup, lint, and integration-test commands are defined in `package.json` and recorded in the final quality-gate table.

### Task 2: Persistence

**Intent:** Isolate SQL and provide URL/click storage.

**AI contribution:** Proposed a `urls` table, a `clicks` table, repository modules, indexes, and in-memory databases for tests.

**Engineer decision:** Accepted repository boundaries and parameterized queries. Chose SQLite for a portable prototype and documented its concurrency boundary.

**Evidence:** `src/db/schema.sql`, `src/db/urlRepository.js`, `src/db/clickRepository.js`.

**Validation:** Repository unit tests cover creation, lookup, deletion, click counts, listing, and top-N queries.

### Task 3: Core API

**Intent:** Implement the greenfield shorten, redirect, and management workflows.

**AI contribution:** Proposed Nano ID generation, alias validation, reserved aliases, collision retries, and structured errors.

**Engineer decision:** Accepted the five-attempt retry cap and reserved route names. Pinned Nano ID v3 because the application uses CommonJS.

**Evidence:** `src/services/urlService.js`, `src/middleware/validate.js`, `src/routes/shorten.js`, `src/routes/redirect.js`, `src/routes/manage.js`.

**Validation:** Integration tests cover successful creation, aliases, conflicts, invalid input, auth failures, redirects, and deletion.

### Task 4: Analytics

**Intent:** Add brownfield analytics without adding redirect latency.

**AI contribution:** Proposed asynchronous click recording and dashboard/API views.

**Engineer decision:** Accepted `setImmediate` for non-blocking recording and changed raw IP capture to SHA-256 hashes for data minimization. Accepted the dashboard as a prototype-only static client and documented its limitations.

**Evidence:** `src/services/urlService.js`, `src/services/analyticsService.js`, `src/public/dashboard.html`.

**Validation:** Analytics tests cover empty state, populated state, limits, auth, and unknown codes.

### Task 5: Reliability

**Intent:** Resolve the ambiguous reliability requirement with an explicit policy.

**AI contribution:** Presented threshold, key, window, storage, and breach-response options.

**Engineer decision:** Selected 60 requests per 60 seconds per API key, sliding-window semantics, in-memory storage, `429`, `Retry-After`, and rate-limit headers. Accepted restart reset as a prototype limitation and isolated the store for later Redis replacement.

**Evidence:** `src/middleware/rateLimit.js`, `tests/unit/rateLimit.test.js`, `ENGINEERING_SUMMARY.md`.

**Validation:** Unit tests cover under-limit, exact-limit, over-limit, independent-key, and pruning behavior.

### Task 6: Operations and documentation

**Intent:** Make behavior reviewable and runnable.

**AI contribution:** Drafted README, architecture diagrams, OpenAPI paths, and Swagger UI integration.

**Engineer decision:** Reviewed route ordering, status codes, schemas, and deployment assumptions; documented unsupported production characteristics.

**Evidence:** `README.md`, `ARCHITECTURE.md`, `src/docs/openapi.yaml`, `src/routes/health.js`.

**Validation:** OpenAPI and manual smoke-test checks are included in `REVIEW_CHECKLIST.md`.

### Task 7: Quality and review preparation

**Intent:** Produce the final evidence package and identify residual risk.

**AI contribution:** Suggested test cases, risk categories, quality gates, and review checklist structure.

**Engineer decision:** Expanded happy-path suggestions with auth, alias, expiry, collision, and rate-limit boundaries. Recorded unresolved security and validation findings rather than presenting the prototype as unrestricted production software.

**Evidence:** `tests/`, `SECURITY_REVIEW.md`, `REVIEW_CHECKLIST.md`, `ENGINEERING_SUMMARY.md`.

## Traceability Rule

The files above are the retained execution record. Where an original interactive AI transcript was not preserved, the record describes the implemented decision and its rationale without claiming verbatim prompt history. Representative prompts are maintained separately in `AI_PROMPT_SAMPLES.md`.
