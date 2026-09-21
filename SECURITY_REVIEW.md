# Security Review

## Scope

Review of authentication, input handling, persistence, redirect behavior, analytics, browser rendering, rate limiting, and dependency/configuration practices for the prototype.

## Findings

| ID | Severity | Finding | Status | Verification/remediation |
|---|---|---|---|---|
| SEC-001 | High | `dashboard.html` interpolates original URLs into `innerHTML` and attributes without HTML escaping. A malicious URL value could execute script when the dashboard renders it. | Open | Replace string-built rows with DOM APIs or an escaping function; add a test with an attribute-breaking payload. |
| SEC-002 | Medium | Analytics `limit` values are parsed but not fully validated. `NaN`, zero, and negative values can produce invalid or surprising database behavior. | Open | Add positive-integer validation and a maximum; test malformed, zero, negative, and oversized values. |
| SEC-003 | Medium | A shared API key is used for all clients, with no rotation or per-user authorization model. | Accepted prototype limitation | Use an identity provider or credential store with scoped keys before production deployment. |
| SEC-004 | Medium | The in-memory limiter is not shared across processes and resets on restart. | Accepted prototype limitation | Replace the store with Redis or an equivalent distributed limiter for multi-instance deployment. |
| SEC-005 | Low | SQLite click records are not removed when a URL is deleted, leaving historical rows without a parent URL. | Open design issue | Decide retention policy; use a foreign key with `ON DELETE CASCADE` or explicitly retain documented audit history. |
| SEC-006 | Low | TLS termination and security headers are delegated to an external reverse proxy. | Accepted deployment assumption | Require HTTPS, secure headers, and proxy configuration in the deployment checklist. |

## Positive Controls

- API routes use an API-key middleware.
- SQL statements use parameters rather than string interpolation.
- URL validation restricts destinations to HTTP and HTTPS.
- Raw IP addresses are not stored; the implementation stores a SHA-256 hash.
- Rate limiting returns HTTP 429 and `Retry-After`.
- Secrets are configured through environment variables and are not documented as literal credentials.

## AI Safety Controls

- No secrets, tokens, credentials, production data, or customer data were included in AI prompts.
- AI suggestions were reviewed before implementation.
- Security findings are recorded as open or accepted limitations, not silently discarded.
- High-impact changes require engineer review and executable validation before approval.

## Release Decision

Approved for interview/demo prototype use with the open findings disclosed. Not approved as unrestricted production software until SEC-001 and SEC-002 are resolved and the deployment assumptions are enforced.
