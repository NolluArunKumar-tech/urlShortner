const { openDb } = require('../../src/db');
const urlRepo = require('../../src/db/urlRepository');
const clickRepo = require('../../src/db/clickRepository');

describe('clickRepository', () => {
  let db;

  beforeEach(() => {
    db = openDb(':memory:');
    // Seed a URL to satisfy foreign key semantics (we have FK OFF but good practice)
    urlRepo.create(db, { shortCode: 'abc', originalUrl: 'https://example.com' });
  });

  afterEach(() => {
    db.close();
  });

  describe('record', () => {
    it('inserts a click record', () => {
      expect(() => {
        clickRepo.record(db, {
          shortCode: 'abc',
          ipHash: 'hash1',
          userAgent: 'TestAgent/1.0',
          referer: 'https://google.com',
        });
      }).not.toThrow();
    });
  });

  describe('countByCode', () => {
    it('returns 0 when no clicks', () => {
      expect(clickRepo.countByCode(db, 'abc')).toBe(0);
    });

    it('returns correct count after recording clicks', () => {
      clickRepo.record(db, { shortCode: 'abc', ipHash: 'h1' });
      clickRepo.record(db, { shortCode: 'abc', ipHash: 'h2' });
      expect(clickRepo.countByCode(db, 'abc')).toBe(2);
    });
  });

  describe('listByCode', () => {
    it('returns empty array when no clicks', () => {
      expect(clickRepo.listByCode(db, 'abc')).toHaveLength(0);
    });

    it('respects limit parameter', () => {
      for (let i = 0; i < 5; i += 1) {
        clickRepo.record(db, { shortCode: 'abc', ipHash: `h${i}` });
      }
      const list = clickRepo.listByCode(db, 'abc', 3);
      expect(list).toHaveLength(3);
    });

    it('returns records with expected fields', () => {
      clickRepo.record(db, {
        shortCode: 'abc',
        ipHash: 'hash1',
        userAgent: 'Mozilla/5.0',
        referer: 'https://ref.com',
      });
      const [click] = clickRepo.listByCode(db, 'abc');
      expect(click).toHaveProperty('short_code', 'abc');
      expect(click).toHaveProperty('user_agent', 'Mozilla/5.0');
      expect(click).toHaveProperty('referer', 'https://ref.com');
    });
  });

  describe('topN', () => {
    it('returns codes sorted by click count descending', () => {
      urlRepo.create(db, { shortCode: 'xyz', originalUrl: 'https://xyz.com' });
      clickRepo.record(db, { shortCode: 'abc', ipHash: 'h1' });
      clickRepo.record(db, { shortCode: 'abc', ipHash: 'h2' });
      clickRepo.record(db, { shortCode: 'xyz', ipHash: 'h3' });

      const top = clickRepo.topN(db, 10);
      expect(top[0].short_code).toBe('abc');
      expect(top[0].click_count).toBe(2);
      expect(top[1].short_code).toBe('xyz');
    });

    it('respects n limit', () => {
      for (let i = 0; i < 5; i += 1) {
        urlRepo.create(db, { shortCode: `c${i}`, originalUrl: `https://c${i}.com` });
        clickRepo.record(db, { shortCode: `c${i}`, ipHash: `h${i}` });
      }
      const top = clickRepo.topN(db, 3);
      expect(top).toHaveLength(3);
    });
  });
});
