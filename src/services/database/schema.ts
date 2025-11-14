// SQLite database schema for offline persistence
// Mirrors backend PostgreSQL tables with subset of fields optimized for mobile

export const CREATE_RECIPIENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS recipients (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL DEFAULT 'Unknown',
    birthday TEXT,
    anniversary TEXT,
    hobbies_interests TEXT, -- JSON array stored as string
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const CREATE_RECIPIENTS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_recipients_user_id ON recipients(user_id);
  CREATE INDEX IF NOT EXISTS idx_recipients_created_at ON recipients(created_at DESC);
`;

export const CREATE_OCCASIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS occasions (
    id TEXT PRIMARY KEY NOT NULL,
    recipient_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    occasion_type TEXT NOT NULL,
    date TEXT,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE
  );
`;

export const CREATE_OCCASIONS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_occasions_user_id ON occasions(user_id);
  CREATE INDEX IF NOT EXISTS idx_occasions_recipient_id ON occasions(recipient_id);
  CREATE INDEX IF NOT EXISTS idx_occasions_date ON occasions(date);
`;

export const CREATE_GIFT_IDEAS_TABLE = `
  CREATE TABLE IF NOT EXISTS gift_ideas (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    occasion_id TEXT,
    gift_text TEXT NOT NULL,
    notes TEXT,
    product_title TEXT,
    estimated_price REAL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    product_image_url TEXT,
    shopping_link TEXT,
    is_purchased INTEGER NOT NULL DEFAULT 0,
    captured_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE,
    FOREIGN KEY (occasion_id) REFERENCES occasions(id) ON DELETE SET NULL
  );
`;

export const CREATE_GIFT_IDEAS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_gift_ideas_user_id ON gift_ideas(user_id);
  CREATE INDEX IF NOT EXISTS idx_gift_ideas_recipient_id ON gift_ideas(recipient_id);
  CREATE INDEX IF NOT EXISTS idx_gift_ideas_occasion_id ON gift_ideas(occasion_id);
  CREATE INDEX IF NOT EXISTS idx_gift_ideas_captured_at ON gift_ideas(captured_at DESC);
`;

export const CREATE_PENDING_SYNC_ACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS pending_sync_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL CHECK(action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    entity_type TEXT NOT NULL CHECK(entity_type IN ('Recipient', 'Occasion', 'GiftIdea')),
    entity_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0
  );
`;

export const CREATE_PENDING_SYNC_ACTIONS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_pending_sync_actions_timestamp ON pending_sync_actions(timestamp ASC);
  CREATE INDEX IF NOT EXISTS idx_pending_sync_actions_entity ON pending_sync_actions(entity_type, entity_id);
`;

// SQL statements to drop all tables (used on logout)
export const DROP_ALL_TABLES = `
  DROP TABLE IF EXISTS pending_sync_actions;
  DROP TABLE IF EXISTS gift_ideas;
  DROP TABLE IF EXISTS occasions;
  DROP TABLE IF EXISTS recipients;
`;
