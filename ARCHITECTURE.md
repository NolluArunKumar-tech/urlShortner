# Architecture Overview

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Client / Browser                    │
└─────────────┬─────────────────────────────────┬─────────────┘
              │                                 │
              ▼                                 ▼
  Protected API routes                  Public routes
  (X-API-Key required)              (no auth required)
              │                                 │
  ┌───────────▼───────────┐       ┌─────────────▼─────────────┐
  │  auth.js middleware   │       │  GET /:code  (redirect)    │
  │  rateLimit.js (shorten│       │  GET /health               │
  │  only)                │       │  GET /dashboard            │
  │  validate.js (shorten │       │  GET /docs (Swagger UI)    │
  │  only)                │       └────────────────────────────┘
  └───────────┬───────────┘
              │
  ┌───────────▼──────────────────────────────────┐
  │                  Express Routers              │
  │  POST /api/shorten   →  shortenRouter         │
  │  DELETE /api/urls/:code → manageRouter        │
  │  GET /api/analytics/* → analyticsRouter       │
  └───────────┬──────────────────────────────────┘
              │
  ┌───────────▼──────────────────────────────────┐
  │                Service Layer                  │
  │  urlService.js   (shortenUrl / resolveUrl)    │
  │  analyticsService.js (getCodeAnalytics /      │
  │                        getTopUrls)            │
  └───────────┬──────────────────────────────────┘
              │
  ┌───────────▼──────────────────────────────────┐
  │           Data Access Layer (DAL)             │
  │  urlRepository.js    (CRUD on urls table)     │
  │  clickRepository.js  (CRUD on clicks table)   │
  └───────────┬──────────────────────────────────┘
              │
  ┌───────────▼──────────────────────────────────┐
  │              SQLite Database                  │
  │  tables: urls, clicks                         │
  │  mode: WAL (Write-Ahead Logging)              │
  └──────────────────────────────────────────────┘
```

---

## Request Lifecycle — Shorten URL

```
Client  →  POST /api/shorten
        →  auth.js          (validate X-API-Key header)
        →  rateLimit.js     (sliding window check, set X-RateLimit-* headers)
        →  validate.js      (URL format, alias rules)
        →  shorten.js       (router handler)
        →  urlService.shortenUrl()
        →  urlRepository.findByCode()   (check alias conflict)
        →  urlRepository.create()       (insert record)
        ←  { shortUrl, shortCode, originalUrl }   HTTP 201
```

## Request Lifecycle — Redirect

```
Client  →  GET /:code
        →  redirect.js      (no auth middleware)
        →  urlService.resolveUrl()
        →  urlRepository.findByCode()   (lookup)
        →  setImmediate: clickRepository.record()   (async, non-blocking)
        ←  HTTP 302  Location: <originalUrl>
```

---

## Database Schema

### `urls` table

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `short_code` | TEXT UNIQUE | 7-char random or custom alias |
| `original_url` | TEXT | The destination URL |
| `created_at` | TEXT | ISO 8601, UTC |
| `expires_at` | TEXT NULL | Optional TTL (reserved for future feature) |
| `created_by` | TEXT | API key label / 'anonymous' |

### `clicks` table

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `short_code` | TEXT | Foreign reference to `urls.short_code` |
| `clicked_at` | TEXT | ISO 8601, UTC |
| `ip_hash` | TEXT | SHA-256 of client IP (privacy compliance) |
| `user_agent` | TEXT | Browser/client User-Agent |
| `referer` | TEXT | HTTP Referer header |

---

## Middleware Chain

| Middleware | Applied to | Purpose |
|---|---|---|
| `auth.js` | All `/api/*` routes | API key validation |
| `rateLimit.js` | `POST /api/shorten` only | Sliding-window rate limiting |
| `validate.js` | `POST /api/shorten` only | URL format + alias validation |

---

## Key Design Decisions

### 1. Redirect route mounted last
`GET /:code` is a catch-all pattern. If mounted first, it would shadow `/api/*`, `/health`,
and `/docs`. It is explicitly mounted after all named routes in `app.js`.

### 2. `nanoid@3` (not v5)
nanoid v5 switched to pure ESM. This project uses CommonJS (`require()`). Pinning v3 avoids
transpilation complexity while the API surface is identical.

### 3. Synchronous SQLite (`better-sqlite3`)
SQLite operations are synchronous in `better-sqlite3`, which simplifies the codebase
significantly — no promise chains in the DAL. This is acceptable for single-process deployments
and aligns with SQLite's actual I/O model.

### 4. Click recording via `setImmediate`
Redirect latency is user-visible. Click recording is fire-and-forget — it runs in the next
iteration of the Node.js event loop, after the 302 response is sent, so it never adds latency
to the redirect.

### 5. IP hashing for privacy
Raw IP addresses are not stored. A SHA-256 hash is stored instead. This is sufficient to
detect duplicate clicks from the same source without storing PII.

### 6. In-memory rate limit store
The sliding-window store is an in-memory `Map`. This is appropriate for a single-process
prototype. For multi-process or multi-node deployment, the interface is isolated to
`rateLimit.js` and can be swapped for a Redis-backed implementation without touching any
other module.

### 7. `:memory:` SQLite in tests
Tests use in-memory SQLite databases (`openDb(':memory:')`). This gives each test suite a
completely clean, isolated database without filesystem side effects or WAL file locking issues
during Jest's parallel worker runs. Tests are further run with `--runInBand` for determinism.

---

## Component Boundaries

| Boundary | Rule |
|---|---|
| Routes | Never touch DB directly — only call services or repositories |
| Services | Contain business logic — call repositories only |
| Repositories | Contain all SQL — return plain objects |
| Middleware | Stateless guards — validate and enrich `req`, never call services |

---

## Tools & Libraries

| Library | Version | Purpose |
|---|---|---|
| `express` | ^4.19 | HTTP framework |
| `node-sqlite3-wasm` | ^0.8 | Synchronous SQLite driver (pure WASM, zero native compilation) |
| `nanoid` | ^3.3 | Random short code generation |
| `dotenv` | ^16 | Environment variable loading |
| `swagger-ui-express` | ^5 | Serves Swagger UI in-process |
| `js-yaml` | ^4 | Parses openapi.yaml |
| `jest` | ^29 | Test runner |
| `supertest` | ^7 | HTTP integration testing |
| `eslint` | ^8 | Static analysis / code style |
