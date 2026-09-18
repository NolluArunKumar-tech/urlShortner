const request = require('supertest');
const { openDb } = require('../../src/db');
const createApp = require('../../src/app');

describe('POST /api/shorten', () => {
  let db;
  let app;
  const API_KEY = 'test-api-key-shorten';

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

  it('shortens a valid URL and returns 201', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({ url: 'https://www.example.com/some/long/path' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('shortUrl');
    expect(res.body).toHaveProperty('shortCode');
    expect(res.body.originalUrl).toBe('https://www.example.com/some/long/path');
  });

  it('uses custom alias when provided', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({ url: 'https://alias-test.com', alias: 'my-alias' });

    expect(res.status).toBe(201);
    expect(res.body.shortCode).toBe('my-alias');
    expect(res.body.shortUrl).toContain('/my-alias');
  });

  it('returns 409 when alias is already taken', async () => {
    await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({ url: 'https://first.com', alias: 'taken-alias' });

    const res = await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({ url: 'https://second.com', alias: 'taken-alias' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ALIAS_CONFLICT');
  });

  it('returns 400 for an invalid URL', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({ url: 'not-a-url' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_URL');
  });

  it('returns 400 for a non-http(s) URL', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({ url: 'ftp://files.example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_URL_SCHEME');
  });

  it('returns 400 for an invalid alias format', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({ url: 'https://valid.com', alias: 'ab' }); // too short

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_ALIAS');
  });

  it('returns 400 for a reserved alias', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({ url: 'https://valid.com', alias: 'health' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('RESERVED_ALIAS');
  });

  it('returns 401 when X-API-Key is missing', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ url: 'https://noauth.com' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('MISSING_API_KEY');
  });

  it('returns 403 for an invalid API key', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .set('X-API-Key', 'wrong-key')
      .send({ url: 'https://badkey.com' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('INVALID_API_KEY');
  });

  it('returns 400 when url field is missing', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MISSING_URL');
  });
});

describe('DELETE /api/urls/:code', () => {
  let db;
  let app;
  const API_KEY = 'test-api-key-delete';

  beforeAll(() => {
    process.env.API_KEY = API_KEY;
    process.env.RATE_LIMIT = '100';
    db = openDb(':memory:');
    app = createApp(db);
  });

  afterAll(() => {
    db.close();
  });

  it('deletes an existing URL', async () => {
    const createRes = await request(app)
      .post('/api/shorten')
      .set('X-API-Key', API_KEY)
      .send({ url: 'https://delete-me.com', alias: 'delete-me' });

    expect(createRes.status).toBe(201);

    const deleteRes = await request(app)
      .delete('/api/urls/delete-me')
      .set('X-API-Key', API_KEY);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.shortCode).toBe('delete-me');
  });

  it('returns 404 when code does not exist', async () => {
    const res = await request(app)
      .delete('/api/urls/does-not-exist')
      .set('X-API-Key', API_KEY);

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).delete('/api/urls/any-code');
    expect(res.status).toBe(401);
  });
});
