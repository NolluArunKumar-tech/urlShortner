const request = require('supertest');
const { openDb } = require('../../src/db');
const createApp = require('../../src/app');
const urlRepo = require('../../src/db/urlRepository');
const clickRepo = require('../../src/db/clickRepository');

describe('Analytics endpoints', () => {
  let db;
  let app;
  const API_KEY = 'test-api-key-analytics';

  beforeAll(() => {
    process.env.API_KEY = API_KEY;
    process.env.RATE_LIMIT = '100';
    db = openDb(':memory:');
    app = createApp(db);

    // Seed data
    urlRepo.create(db, { shortCode: 'top1', originalUrl: 'https://top1.com' });
    urlRepo.create(db, { shortCode: 'top2', originalUrl: 'https://top2.com' });
    urlRepo.create(db, { shortCode: 'top3', originalUrl: 'https://top3.com' });

    // top1 gets 5 clicks, top2 gets 3, top3 gets 1
    for (let i = 0; i < 5; i += 1) clickRepo.record(db, { shortCode: 'top1', ipHash: `h${i}` });
    for (let i = 0; i < 3; i += 1) clickRepo.record(db, { shortCode: 'top2', ipHash: `h${i}` });
    clickRepo.record(db, { shortCode: 'top3', ipHash: 'h0' });
  });

  afterAll(() => {
    db.close();
  });

  describe('GET /api/analytics/top', () => {
    it('returns top URLs sorted by click count', async () => {
      const res = await request(app)
        .get('/api/analytics/top')
        .set('X-API-Key', API_KEY);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('top');
      expect(res.body.top[0].shortCode).toBe('top1');
      expect(res.body.top[0].clickCount).toBe(5);
    });

    it('respects limit query param', async () => {
      const res = await request(app)
        .get('/api/analytics/top?limit=2')
        .set('X-API-Key', API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.top).toHaveLength(2);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/analytics/top');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/analytics/:code', () => {
    it('returns analytics for a specific code', async () => {
      const res = await request(app)
        .get('/api/analytics/top1')
        .set('X-API-Key', API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.shortCode).toBe('top1');
      expect(res.body.totalClicks).toBe(5);
      expect(res.body.clicks).toHaveLength(5);
      expect(res.body.originalUrl).toBe('https://top1.com');
    });

    it('returns empty clicks for a code with no clicks', async () => {
      urlRepo.create(db, { shortCode: 'no-clicks', originalUrl: 'https://noclicks.com' });
      const res = await request(app)
        .get('/api/analytics/no-clicks')
        .set('X-API-Key', API_KEY);

      expect(res.status).toBe(200);
      expect(res.body.totalClicks).toBe(0);
      expect(res.body.clicks).toHaveLength(0);
    });

    it('returns 404 for unknown code', async () => {
      const res = await request(app)
        .get('/api/analytics/no-such-code')
        .set('X-API-Key', API_KEY);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('SHORT_CODE_NOT_FOUND');
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/analytics/top1');
      expect(res.status).toBe(401);
    });
  });
});
