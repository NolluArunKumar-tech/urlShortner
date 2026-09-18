const request = require('supertest');
const { openDb } = require('../../src/db');
const createApp = require('../../src/app');

describe('GET /:code (redirect)', () => {
  let db;
  let app;
  const API_KEY = 'test-api-key-redirect';

  beforeAll(() => {
    process.env.API_KEY = API_KEY;
    process.env.BASE_URL = 'http://localhost:3000';
    process.env.RATE_LIMIT = '100';
    db = openDb(':memory:');
    app = createApp(db);
  });

  afterAll(() => {
    db.close();
  });

  it('redirects to the original URL for a valid code', async () => {
    // Create a short URL first
    const createRes = await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({ url: 'https://redirect-target.com', alias: 'redirect1' });

    expect(createRes.status).toBe(201);

    // Now test the redirect
    const res = await request(app)
      .get('/redirect1')
      .redirects(0); // Don't follow redirects so we can inspect the response

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://redirect-target.com');
  });

  it('returns 404 for an unknown short code', async () => {
    const res = await request(app).get('/unknown-code-xyz');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('records a click after redirect', async () => {
    await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({ url: 'https://click-test.com', alias: 'click-test' });

    // Trigger a redirect (click)
    await request(app).get('/click-test').redirects(0);

    // Give setImmediate a chance to run
    await new Promise((resolve) => setTimeout(resolve, 50));

    const analyticsRes = await request(app)
      .get('/api/analytics/click-test')
      .set('X-API-Key', API_KEY);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.totalClicks).toBe(1);
  });
});
