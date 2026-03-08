CREATE TABLE IF NOT EXISTS schema_version (
    version     INTEGER PRIMARY KEY,
    applied_at  TEXT NOT NULL DEFAULT (datetime('now')),
    description TEXT
);

CREATE TABLE IF NOT EXISTS favorites (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    word             TEXT NOT NULL,
    phonetic         TEXT,
    chinese_phonetic TEXT,
    translation      TEXT NOT NULL,
    source_text      TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    review_count     INTEGER NOT NULL DEFAULT 0,
    UNIQUE(word)
);
CREATE INDEX IF NOT EXISTS idx_favorites_word ON favorites(word);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);

CREATE TABLE IF NOT EXISTS history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    source_text TEXT NOT NULL,
    result_text TEXT NOT NULL,
    mode        TEXT NOT NULL,
    provider    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at);
CREATE INDEX IF NOT EXISTS idx_history_source_text ON history(source_text);

CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
