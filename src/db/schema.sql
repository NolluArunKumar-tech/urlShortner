-- URL shortener schema

CREATE TABLE IF NOT EXISTS urls (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code  TEXT    NOT NULL UNIQUE,
  original_url TEXT   NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT    NULL,
  created_by  TEXT    NOT NULL DEFAULT 'anonymous'
);

CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);

CREATE TABLE IF NOT EXISTS clicks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code  TEXT    NOT NULL,
  clicked_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  ip_hash     TEXT    NOT NULL DEFAULT '',
  user_agent  TEXT    NOT NULL DEFAULT '',
  referer     TEXT    NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_clicks_short_code ON clicks(short_code);
