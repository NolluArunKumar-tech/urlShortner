# Representative AI Prompt Samples

These prompts show the intended engineer-led interaction style. They provide reproducible examples of task intent, constraints, acceptance criteria, and review follow-up.

## Architecture

> Design a CommonJS Express URL shortener with SQLite, protected management APIs, public redirects, analytics, and an app factory that can be imported by Supertest. Identify module boundaries, request flows, and deployment trade-offs. Do not invent production guarantees beyond the prototype scope.

**Follow-up:** Review the proposed boundaries. Identify any route-ordering issue, database ownership issue, or testability problem before implementation.

## Greenfield Implementation

> Implement the URL-shortening service in the existing route/service/repository style. Requirements: HTTP/HTTPS URLs only, optional aliases of 3-32 URL-safe characters, reserved route names, five collision retries, structured errors, and no direct SQL in routes. Keep the change focused and include tests for acceptance criteria.

**Engineer review:** Verify validation occurs before business logic, SQL is parameterized, and the catch-all redirect route cannot shadow named routes.

## Brownfield Analytics

> Add click analytics to the existing redirect workflow without changing redirect status or destination behavior. Store timestamp, user-agent, referer, and a privacy-preserving IP representation. Keep recording from delaying the response. Add focused integration tests and document failure behavior.

**Engineer review:** Confirm asynchronous recording errors do not change the redirect response and that analytics data is bounded by a validated limit.

## Ambiguous Reliability Requirement

> The requirement says “add reliability features” but gives no threshold, identity key, window, storage, or breach response. List the ambiguities, recommend prototype defaults, state production trade-offs, and define tests for the selected behavior.

**Engineer decision:** Use 60 requests per 60 seconds per API key, sliding-window semantics, in-memory storage, standard 429 and Retry-After responses, and an environment override.

## Test Generation

> Generate unit and integration tests for this URL shortener. Cover happy paths, missing and invalid API keys, invalid URL schemes, alias conflicts, reserved aliases, unknown codes, redirects, click recording, analytics limits, deletion, and rate-limit boundaries. Do not weaken assertions just to make tests pass.

**Follow-up:** Review the tests for missing negative cases, timing flakiness, shared state, and tests that assert implementation details rather than behavior.

## Security Review

> Review the provided Express URL shortener for authentication, authorization, injection, open redirect, XSS, sensitive-data exposure, rate limiting, error leakage, dependency, and denial-of-service risks. Return findings with severity, file, impact, remediation, and a verification test. Treat documented limitations as risks, not as mitigations.

**Engineer action:** Record every accepted, deferred, or rejected finding in `SECURITY_REVIEW.md` and do not mark deferred findings as resolved.

## Final Review

> Review the complete change against the assignment rubric: requirement understanding, decomposition, brownfield reasoning, AI-assisted execution traceability, production-quality outputs, validation, risk control, oversight, and final summary. Produce a finding-first report and identify evidence gaps separately from implementation defects.
