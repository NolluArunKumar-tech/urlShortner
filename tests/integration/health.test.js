const request = require('supertest');
const { openDb } = require('../../src/db');
const createApp = require('../../src/app');

describe('GET /health', () => {
  let db;
  let app;

  beforeAll(() => {
    db = openDb(':memory:');
    app = createApp(db);
  });

  afterAll(() => {
    db.close();
  });

  it('returns 200 with ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('does not require authentication', async () => {
    // No X-API-Key â€” should still succeed
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('returns expected response shape', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toMatchObject({
      status: 'ok',
      db: 'connected',
    });
    expect(typeof res.body.uptime).toBe('number');
  });
});
