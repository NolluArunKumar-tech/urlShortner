# Engineering Summary

## Overview

This document captures the engineering rationale, AI-assisted execution approach, risk analysis,
and known limitations for the URL Shortener prototype. It corresponds to the Final Engineering
Summary deliverable defined in the requirements.

---

## Plan & Rationale

The system was designed following a structured plan (`url-shortener-plan.md`) decomposed into
7 sub-tasks, mapped to the three required scenarios:

| Sub-Task | Scenario | Description |
|---|---|---|
| 1 | Foundation | Project scaffold, config, directory structure |
| 2 | Foundation | SQLite schema + Data Access Layer |
| 3 | **Greenfield** | Core URL shortener API (shorten, redirect, delete) |
| 4 | **Brownfield** | Analytics API + HTML dashboard |
| 5 | **Ambiguous** | Rate limiting (under-specified requirement) |
| 6 | Foundation | Health check, OpenAPI spec, Swagger UI |
| 7 | Foundation | Tests, linting, documentation |

The plan was reviewed and approved before implementation began. Each sub-task was completed
sequentially to ensure stable foundations before adding features.

---

## Scenario 1 — Greenfield: Core URL Shortener API

**Problem:** Build a URL shortener from scratch with no prior codebase.

**Engineering judgment applied:**
- Separated the Express app factory (`app.js`) from the entry point (`server.js`) so Supertest
  can import the app without starting an HTTP listener.
- Short codes are 7-character `nanoid` random strings (Base64 URL-safe alphabet).
  This gives ~3.5 trillion possibilities, making collisions negligible at prototype scale.
- Collision retry logic: up to 5 retries before returning 503. This is a deliberate cap —
  infinite retry loops are an availability risk.
- Reserved code list (`api`, `health`, `dashboard`, `docs`, `static`, `public`) prevents
  users from creating aliases that shadow system routes.
- Input validation is middleware-isolated (`validate.js`), keeping route handlers clean and
  making validation logic independently testable.

**Validation:** 12 integration tests covering happy path, all error cases (400/401/403/404/409/503).

---

## Scenario 2 — Brownfield: Analytics Enhancement

**Problem:** Add click analytics to the existing system without breaking existing behaviour.

**Engineering judgment applied:**
- The `clicks` table was included in the original schema (Sub-Task 2), anticipating this
  feature. This is a common brownfield pattern: schema forward-compatibility.
- Click recording is done via `setImmediate` — fire-and-forget, non-blocking. A redirect's
  latency should not depend on a database write.
- `ip_hash` (SHA-256) is stored instead of the raw IP address. This is a data minimisation
  decision aligned with GDPR principle of storage limitation.
- The analytics dashboard is a single static HTML file with vanilla JS. No frontend build
  toolchain was introduced — keeping the prototype self-contained and zero-dependency on the
  frontend side.
- The dashboard requires the user to enter their API key manually (not stored). This avoids
  server-side session state and keeps the demo self-contained, but is documented as a
  non-production pattern.

**Validation:** 6 integration tests covering empty state, populated state, auth guards, limit param.

---

## Scenario 3 — Ambiguous: Rate Limiting

**Problem:** "Add reliability features" — no thresholds, storage backend, or window type specified.

**Ambiguities identified:**
1. What is the rate limit threshold?
2. Per what key? (IP, API key, global?)
3. What window type? (Fixed, sliding, token bucket?)
4. What storage? (In-memory, Redis, DB?)
5. What is the breach response? (Queue, drop, 429?)

**Decisions and rationale:**

| Decision | Choice | Rationale |
|---|---|---|
| Threshold | 60 req/60s per API key | ~1 req/sec average — permissive for development, meaningful for demo |
| Key | API key (falls back to IP) | Aligns with the auth model; per-IP is weaker when IPs are shared (NAT) |
| Window | Sliding (60s) | Fairer than fixed window — no burst allowed at window boundaries |
| Storage | In-memory Map | Appropriate for single-process prototype; isolated for easy swap |
| Breach response | 429 + Retry-After | RFC 6585 standard; includes `X-RateLimit-*` headers per convention |
| Override | `RATE_LIMIT` env var | Allows easy adjustment without code change |

**Known limitation:** In-memory store resets on process restart. For production, replace the
`Map` in `rateLimit.js` with a Redis client — the middleware interface is unchanged.

**Validation:** 5 unit tests covering: under limit, at limit, over limit, independent keys,
window pruning.

---

## Artifacts Produced

| Artifact | Location |
|---|---|
| Working prototype | `src/` |
| OpenAPI 3 spec | `src/docs/openapi.yaml` |
| Swagger UI | `GET /docs` |
| Analytics dashboard | `GET /dashboard` |
| Unit tests | `tests/unit/` |
| Integration tests | `tests/integration/` |
| Architecture doc | `ARCHITECTURE.md` |
| Setup instructions | `README.md` |
| This document | `ENGINEERING_SUMMARY.md` |

---

## Risk Register

| Risk | Likelihood | Impact | Status | Mitigation |
|---|---|---|---|---|
| `nanoid` v5 ESM-only incompatibility | High | High | **Mitigated** | Pinned `nanoid@3` (CommonJS) |
| Redirect route shadows `/api/*` | Medium | High | **Mitigated** | Redirect router mounted last in `app.js` |
| SQLite WAL locking in parallel tests | Medium | High | **Mitigated** | `:memory:` DB + `--runInBand` |
| In-memory rate limit reset on restart | Certain | Low | **Accepted** | Documented; Redis swap path defined |
| IP hash collision (SHA-256) | Negligible | Low | **Accepted** | Collision probability is astronomically low |
| Short code collision (nanoid) | Very Low | Medium | **Mitigated** | Retry up to 5 times; 503 on exhaustion |
| Dashboard API key visible in browser | Certain | Low | **Accepted** | Demo-only pattern; documented |

---

## Trade-offs

| Decision | Benefit | Cost |
|---|---|---|
| SQLite over PostgreSQL | Zero-config, portable, fast for prototype | Not suitable for multi-process/high-concurrency production |
| `better-sqlite3` (sync) | Simpler code — no async/await in DAL | Blocks event loop during DB calls (acceptable for SQLite's I/O profile) |
| In-memory rate limit | No external dependency (Redis) | Resets on restart; not shared across processes |
| CommonJS over ESM | Works with full npm ecosystem today | Cannot use ESM-only packages (e.g. nanoid v5) |
| No ORM (raw SQL) | Full control, readable queries, no abstraction overhead | More boilerplate for schema changes |

---

## Assumptions

1. Single-process deployment — rate limiting and in-memory state are sufficient.
2. `BASE_URL` is correctly configured in `.env` — short URL construction depends on it.
3. The SQLite database file is on a local filesystem — NFS/network mounts can cause WAL issues.
4. The service runs behind a reverse proxy (nginx/caddy) that handles TLS termination.
5. `API_KEY` in `.env` is treated as a secret and not committed to version control.

---

## Limitations

1. **No persistence across restarts for rate limits** — see Scenario 3 above.
2. **No URL expiry enforcement in background** — `expires_at` is checked on redirect but there
   is no scheduled job to clean up expired records.
3. **No bulk operations** — the API is single-URL-at-a-time by design (prototype scope).
4. **No user management** — all authenticated requests share a single API key.
5. **Dashboard key entry** — the user must re-enter their API key after page reload (no localStorage).
6. **SQLite concurrency** — WAL mode helps, but SQLite is not suitable for > ~100 concurrent writes/sec.

---

## AI-Assisted Engineering — Interaction Summary

AI was used as an accelerator across all phases. The engineer owned all final decisions,
correctness, and production readiness. AI was never given autonomous control.

| Phase | AI Contribution | Engineer Action |
|---|---|---|
| Planning | Drafted architecture options, tech stack trade-offs | Reviewed, selected, refined plan |
| Schema design | Suggested `clicks` table structure | Added `ip_hash` for privacy; removed raw IP |
| Service layer | Generated `shortenUrl` / `resolveUrl` logic | Added retry cap, expiry check, `setImmediate` pattern |
| Rate limiting | Proposed sliding window implementation | Validated algorithm correctness, added env override |
| Test generation | Generated test scaffolding for happy paths | Added edge cases: alias conflict, expiry, reserved codes |
| Documentation | Generated initial README and ARCHITECTURE drafts | Reviewed accuracy; added limitation and trade-off sections |
| OpenAPI spec | Generated initial path/schema stubs | Completed all response codes, added security schemes |

**Quality gates applied:**
- ESLint (airbnb-base) on all source files
- Jest test suite with coverage reporting
- Manual end-to-end smoke test (`npm start` + curl)
- Code review against OWASP Top 10 (no SQL injection risk — parameterised queries throughout)
