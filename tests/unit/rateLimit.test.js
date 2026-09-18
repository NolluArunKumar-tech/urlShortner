const rateLimit = require('../../src/middleware/rateLimit');

describe('rateLimit middleware', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env.RATE_LIMIT;
    process.env.RATE_LIMIT = '3';
    // Clear the in-memory store before each test
    rateLimit._store.clear();
  });

  afterEach(() => {
    process.env.RATE_LIMIT = originalEnv;
  });

  function makeReqRes(apiKey = 'test-key') {
    const headers = {};
    const req = {
      apiKey,
      headers: { 'x-api-key': apiKey },
      ip: '127.0.0.1',
    };
    const res = {
      _headers: {},
      _status: null,
      _body: null,
      set(k, v) { this._headers[k] = v; return this; },
      status(code) { this._status = code; return this; },
      json(body) { this._body = body; return this; },
    };
    return { req, res };
  }

  it('allows requests under the limit', () => {
    const next = jest.fn();
    const { req, res } = makeReqRes('key-a');
    rateLimit(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res._headers['X-RateLimit-Limit']).toBe('3');
    expect(res._headers['X-RateLimit-Remaining']).toBe('2');
  });

  it('allows exactly limit-many requests', () => {
    const next = jest.fn();
    for (let i = 0; i < 3; i += 1) {
      const { req, res } = makeReqRes('key-b');
      rateLimit(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(3);
  });

  it('blocks the request that exceeds the limit', () => {
    const next = jest.fn();
    // Exhaust limit
    for (let i = 0; i < 3; i += 1) {
      const { req, res } = makeReqRes('key-c');
      rateLimit(req, res, next);
    }
    // 4th request should be blocked
    const { req, res } = makeReqRes('key-c');
    rateLimit(req, res, next);
    expect(res._status).toBe(429);
    expect(res._body.error).toBe('RATE_LIMITED');
    expect(next).toHaveBeenCalledTimes(3); // only 3 made it through
  });

  it('tracks different API keys independently', () => {
    const next = jest.fn();
    for (let i = 0; i < 3; i += 1) {
      const { req, res } = makeReqRes('key-d');
      rateLimit(req, res, next);
    }
    // Different key â€” should still be allowed
    const { req, res } = makeReqRes('key-e');
    rateLimit(req, res, next);
    expect(next).toHaveBeenCalledTimes(4);
    expect(res._status).toBeNull(); // not blocked
  });

  describe('_pruneWindow', () => {
    it('removes timestamps outside the window', () => {
      const now = Date.now();
      const old = now - 61000; // 61 seconds ago
      const result = rateLimit._pruneWindow([old, now - 1000, now], now);
      expect(result).toHaveLength(2); // old one pruned
    });
  });
});
