const { openDb } = require('../../src/db');
const urlRepo = require('../../src/db/urlRepository');

describe('urlRepository', () => {
  let db;

  beforeEach(() => {
    db = openDb(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('inserts a URL and returns the record', () => {
      const record = urlRepo.create(db, {
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        createdBy: 'test',
      });
      expect(record.short_code).toBe('abc123');
      expect(record.original_url).toBe('https://example.com');
      expect(record.created_by).toBe('test');
      expect(record.id).toBeGreaterThan(0);
    });

    it('throws on duplicate short code', () => {
      urlRepo.create(db, { shortCode: 'dup', originalUrl: 'https://a.com' });
      expect(() => {
        urlRepo.create(db, { shortCode: 'dup', originalUrl: 'https://b.com' });
      }).toThrow();
    });
  });

  describe('findByCode', () => {
    it('returns the matching record', () => {
      urlRepo.create(db, { shortCode: 'find1', originalUrl: 'https://find.com' });
      const found = urlRepo.findByCode(db, 'find1');
      expect(found).toBeDefined();
      expect(found.short_code).toBe('find1');
    });

    it('returns undefined for unknown code', () => {
      expect(urlRepo.findByCode(db, 'nope')).toBeUndefined();
    });
  });

  describe('findByOriginalUrl', () => {
    it('returns record matching the original URL', () => {
      urlRepo.create(db, { shortCode: 'xyz', originalUrl: 'https://orig.com' });
      const found = urlRepo.findByOriginalUrl(db, 'https://orig.com');
      expect(found).toBeDefined();
      expect(found.short_code).toBe('xyz');
    });
  });

  describe('listAll', () => {
    it('returns all records ordered by created_at DESC', () => {
      urlRepo.create(db, { shortCode: 'a1', originalUrl: 'https://a1.com' });
      urlRepo.create(db, { shortCode: 'b2', originalUrl: 'https://b2.com' });
      const all = urlRepo.listAll(db);
      expect(all.length).toBe(2);
    });
  });

  describe('deleteByCode', () => {
    it('deletes an existing record', () => {
      urlRepo.create(db, { shortCode: 'del1', originalUrl: 'https://del.com' });
      const result = urlRepo.deleteByCode(db, 'del1');
      expect(result.changes).toBe(1);
      expect(urlRepo.findByCode(db, 'del1')).toBeUndefined();
    });

    it('returns changes=0 for unknown code', () => {
      const result = urlRepo.deleteByCode(db, 'ghost');
      expect(result.changes).toBe(0);
    });
  });
});
