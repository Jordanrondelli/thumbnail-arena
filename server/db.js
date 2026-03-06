const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'arena.db');

// Ensure data directory exists
const fs = require('fs');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS thumbnails (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS test_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    is_active INTEGER DEFAULT 0,
    admin_password TEXT DEFAULT 'admin123',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  INSERT OR IGNORE INTO test_config (id, is_active, admin_password) VALUES (1, 0, 'admin123');

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    is_valid INTEGER DEFAULT 1,
    median_reaction_time REAL
  );

  CREATE TABLE IF NOT EXISTS duels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    thumb_left_id TEXT NOT NULL REFERENCES thumbnails(id),
    thumb_right_id TEXT NOT NULL REFERENCES thumbnails(id),
    winner_id TEXT REFERENCES thumbnails(id),
    reaction_time_ms INTEGER,
    position_order INTEGER NOT NULL,
    timed_out INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mouse_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    duel_id INTEGER NOT NULL REFERENCES duels(id),
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS memory_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    thumbnail_id TEXT NOT NULL REFERENCES thumbnails(id),
    was_recognized INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_duels_session ON duels(session_id);
  CREATE INDEX IF NOT EXISTS idx_duels_winner ON duels(winner_id);
  CREATE INDEX IF NOT EXISTS idx_duels_thumbs ON duels(thumb_left_id, thumb_right_id);
  CREATE INDEX IF NOT EXISTS idx_memory_session ON memory_tests(session_id);
  CREATE INDEX IF NOT EXISTS idx_memory_thumb ON memory_tests(thumbnail_id);
`);

module.exports = db;
