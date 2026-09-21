# URL Shortener

A production-grade URL shortener service built with Node.js, Express, and SQLite. Features a REST API, click analytics, a browser-based dashboard, rate limiting, and interactive OpenAPI documentation.

---

## Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 8

---

## Quick Start

```bash
# 1. Clone / enter the project directory
cd url-shortener

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env and set API_KEY to a strong secret value

# 4. Start the server
npm start
```

The server starts on `http://localhost:3000` by default.

| URL | Description |
|---|---|
| `http://localhost:3000/docs` | Interactive Swagger UI |
| `http://localhost:3000/dashboard` | Analytics dashboard |
| `http://localhost:3000/health` | Health check |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DATABASE_PATH` | `./data/urls.db` | SQLite database file path |
| `API_KEY` | *(required)* | API key for protected endpoints |
| `BASE_URL` | `http://localhost:3000` | Base URL used when constructing short URLs |
| `RATE_LIMIT` | `60` | Max requests per 60-second window per API key |

---

## API Reference

All protected endpoints require the `X-API-Key` header.

### Shorten a URL

```
POST /api/shorten
X-API-Key: <your-key>
Content-Type: application/json

{ "url": "https://www.example.com/very/long/path", "alias": "my-link" }
```

**Response (201):**
```json
{
  "shortUrl": "http://localhost:3000/my-link",
  "shortCode": "my-link",
  "originalUrl": "https://www.example.com/very/long/path"
}
```

### Redirect

```
GET /:code
```
Redirects to the original URL (HTTP 302). No authentication required.

### List All URLs

```
GET /api/urls
X-API-Key: <your-key>
```

### Delete a URL

```
DELETE /api/urls/:code
X-API-Key: <your-key>
```

### Analytics — Specific Code

```
GET /api/analytics/:code?limit=100
X-API-Key: <your-key>
```

### Analytics — Top URLs

```
GET /api/analytics/top?limit=10
X-API-Key: <your-key>
```

### Health Check

```
GET /health
```

---

## Example cURL Session

```bash
export API_KEY="changeme-super-secret-key"
export BASE="http://localhost:3000"

# Shorten a URL
curl -s -X POST "$BASE/api/shorten" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com","alias":"gh"}' | jq

# Follow the short link
curl -v "$BASE/gh"

# View analytics
curl -s "$BASE/api/analytics/gh" -H "X-API-Key: $API_KEY" | jq

# View top URLs
curl -s "$BASE/api/analytics/top" -H "X-API-Key: $API_KEY" | jq

# Delete
curl -s -X DELETE "$BASE/api/urls/gh" -H "X-API-Key: $API_KEY" | jq
```

---

## Development

```bash
# Start with auto-reload (nodemon)
npm run dev

# Run tests
npm test

# Run tests with coverage report
npm run test:coverage

# Lint
npm run lint
```

---

## Project Structure

```
url-shortener/
├── src/
│   ├── app.js                  # Express app factory
│   ├── server.js               # Entry point
│   ├── db/                     # SQLite schema + Data Access Layer
│   ├── routes/                 # Express routers
│   ├── services/               # Business logic
│   ├── middleware/             # Auth, validation, rate limiting
│   ├── docs/openapi.yaml       # OpenAPI 3 spec
│   └── public/dashboard.html  # Analytics dashboard
├── tests/
│   ├── unit/                   # Repository + middleware unit tests
│   └── integration/            # Supertest API integration tests
└── data/                       # SQLite database (gitignored)
```

---

## Testing Approach

---

- Coverage target: ≥ 80% lines/functions

## Engineering Evidence

The assignment execution record is available in:

- `url-shortener-plan.md` — sequenced tasks, dependencies, acceptance criteria, and definition of done
- `AI_EXECUTION_LOG.md` — AI contributions, engineer decisions, implementation evidence, and validation
- `AI_PROMPT_SAMPLES.md` — representative prompts and review follow-ups
- `SECURITY_REVIEW.md` — security findings, AI safety controls, and release boundary
- `REVIEW_CHECKLIST.md` — quality gates and human approval checklist

## Known Limitations
- SQLite is not suitable for high-concurrency multi-process deployments (use PostgreSQL + Redis for production)
- No HTTPS termination — intended for use behind a reverse proxy (nginx/caddy)
