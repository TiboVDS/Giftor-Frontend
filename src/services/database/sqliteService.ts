import * as SQLite from 'expo-sqlite';
import {
  Recipient,
  Occasion,
  GiftIdea,
  PendingSyncAction,
  ActionType,
  EntityType,
} from '../../types/database.types';
import {
  CREATE_RECIPIENTS_TABLE,
  CREATE_RECIPIENTS_INDEXES,
  CREATE_OCCASIONS_TABLE,
  CREATE_OCCASIONS_INDEXES,
  CREATE_GIFT_IDEAS_TABLE,
  CREATE_GIFT_IDEAS_INDEXES,
  CREATE_PENDING_SYNC_ACTIONS_TABLE,
  CREATE_PENDING_SYNC_ACTIONS_INDEXES,
  DROP_ALL_TABLES,
} from './schema';

const DATABASE_NAME = 'giftor.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize SQLite database and create tables
 */
export const initDatabase = async (): Promise<void> => {
  try {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    // Create tables in order (respecting foreign keys)
    await db.execAsync(CREATE_RECIPIENTS_TABLE);
    await db.execAsync(CREATE_RECIPIENTS_INDEXES);

    await db.execAsync(CREATE_OCCASIONS_TABLE);
    await db.execAsync(CREATE_OCCASIONS_INDEXES);

    await db.execAsync(CREATE_GIFT_IDEAS_TABLE);
    await db.execAsync(CREATE_GIFT_IDEAS_INDEXES);

    await db.execAsync(CREATE_PENDING_SYNC_ACTIONS_TABLE);
    await db.execAsync(CREATE_PENDING_SYNC_ACTIONS_INDEXES);

    console.log('✅ SQLite database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

/**
 * Get database instance (ensures database is initialized)
 */
const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// ===================================
// RECIPIENT CRUD OPERATIONS
// ===================================

export const getRecipients = async (userId: string): Promise<Recipient[]> => {
  const database = getDb();
  const result = await database.getAllAsync<any>(
    'SELECT * FROM recipients WHERE user_id = ? ORDER BY name ASC',
    [userId]
  );

  return result.map(row => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    relationship: row.relationship,
    birthday: row.birthday || undefined,
    anniversary: row.anniversary || undefined,
    hobbiesInterests: row.hobbies_interests ? JSON.parse(row.hobbies_interests) : [],
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

export const insertRecipient = async (recipient: Recipient): Promise<Recipient> => {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO recipients (id, user_id, name, relationship, birthday, anniversary, hobbies_interests, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recipient.id,
      recipient.userId,
      recipient.name,
      recipient.relationship,
      recipient.birthday || null,
      recipient.anniversary || null,
      JSON.stringify(recipient.hobbiesInterests),
      recipient.notes || null,
      recipient.createdAt,
      recipient.updatedAt,
    ]
  );
  return recipient;
};

export const updateRecipient = async (recipient: Recipient): Promise<Recipient> => {
  const database = getDb();
  await database.runAsync(
    `UPDATE recipients
     SET name = ?, relationship = ?, birthday = ?, anniversary = ?, hobbies_interests = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [
      recipient.name,
      recipient.relationship,
      recipient.birthday || null,
      recipient.anniversary || null,
      JSON.stringify(recipient.hobbiesInterests),
      recipient.notes || null,
      recipient.updatedAt,
      recipient.id,
    ]
  );
  return recipient;
};

export const deleteRecipient = async (id: string): Promise<void> => {
  const database = getDb();
  await database.runAsync('DELETE FROM recipients WHERE id = ?', [id]);
};

export const upsertRecipients = async (recipients: Recipient[]): Promise<void> => {
  const database = getDb();

  for (const recipient of recipients) {
    // Check if recipient exists
    const existing = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM recipients WHERE id = ?',
      [recipient.id]
    );

    if (existing) {
      await updateRecipient(recipient);
    } else {
      await insertRecipient(recipient);
    }
  }
};

// ===================================
// OCCASION CRUD OPERATIONS
// ===================================

export const getOccasions = async (userId: string): Promise<Occasion[]> => {
  const database = getDb();
  const result = await database.getAllAsync<any>(
    'SELECT * FROM occasions WHERE user_id = ? ORDER BY date ASC',
    [userId]
  );

  return result.map(row => ({
    id: row.id,
    recipientId: row.recipient_id,
    userId: row.user_id,
    name: row.name,
    occasionType: row.occasion_type,
    date: row.date || undefined,
    isRecurring: row.is_recurring === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

export const insertOccasion = async (occasion: Occasion): Promise<Occasion> => {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO occasions (id, recipient_id, user_id, name, occasion_type, date, is_recurring, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      occasion.id,
      occasion.recipientId,
      occasion.userId,
      occasion.name,
      occasion.occasionType,
      occasion.date || null,
      occasion.isRecurring ? 1 : 0,
      occasion.createdAt,
      occasion.updatedAt,
    ]
  );
  return occasion;
};

export const updateOccasion = async (occasion: Occasion): Promise<Occasion> => {
  const database = getDb();
  await database.runAsync(
    `UPDATE occasions
     SET name = ?, occasion_type = ?, date = ?, is_recurring = ?, updated_at = ?
     WHERE id = ?`,
    [
      occasion.name,
      occasion.occasionType,
      occasion.date || null,
      occasion.isRecurring ? 1 : 0,
      occasion.updatedAt,
      occasion.id,
    ]
  );
  return occasion;
};

export const deleteOccasion = async (id: string): Promise<void> => {
  const database = getDb();
  await database.runAsync('DELETE FROM occasions WHERE id = ?', [id]);
};

export const upsertOccasions = async (occasions: Occasion[]): Promise<void> => {
  const database = getDb();

  for (const occasion of occasions) {
    const existing = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM occasions WHERE id = ?',
      [occasion.id]
    );

    if (existing) {
      await updateOccasion(occasion);
    } else {
      await insertOccasion(occasion);
    }
  }
};

// ===================================
// GIFT IDEA CRUD OPERATIONS
// ===================================

export const getGiftIdeas = async (userId: string): Promise<GiftIdea[]> => {
  const database = getDb();
  const result = await database.getAllAsync<any>(
    'SELECT * FROM gift_ideas WHERE user_id = ? ORDER BY captured_at DESC',
    [userId]
  );

  return result.map(row => ({
    id: row.id,
    userId: row.user_id,
    recipientId: row.recipient_id,
    occasionId: row.occasion_id || undefined,
    giftText: row.gift_text,
    notes: row.notes || undefined,
    productTitle: row.product_title || undefined,
    estimatedPrice: row.estimated_price || undefined,
    currency: row.currency,
    productImageUrl: row.product_image_url || undefined,
    shoppingLink: row.shopping_link || undefined,
    isPurchased: row.is_purchased === 1,
    capturedAt: row.captured_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

export const insertGiftIdea = async (giftIdea: GiftIdea): Promise<GiftIdea> => {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO gift_ideas (id, user_id, recipient_id, occasion_id, gift_text, notes, product_title, estimated_price, currency, product_image_url, shopping_link, is_purchased, captured_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      giftIdea.id,
      giftIdea.userId,
      giftIdea.recipientId,
      giftIdea.occasionId || null,
      giftIdea.giftText,
      giftIdea.notes || null,
      giftIdea.productTitle || null,
      giftIdea.estimatedPrice || null,
      giftIdea.currency,
      giftIdea.productImageUrl || null,
      giftIdea.shoppingLink || null,
      giftIdea.isPurchased ? 1 : 0,
      giftIdea.capturedAt,
      giftIdea.createdAt,
      giftIdea.updatedAt,
    ]
  );
  return giftIdea;
};

export const updateGiftIdea = async (giftIdea: GiftIdea): Promise<GiftIdea> => {
  const database = getDb();
  await database.runAsync(
    `UPDATE gift_ideas
     SET gift_text = ?, notes = ?, product_title = ?, estimated_price = ?, currency = ?, product_image_url = ?, shopping_link = ?, is_purchased = ?, updated_at = ?
     WHERE id = ?`,
    [
      giftIdea.giftText,
      giftIdea.notes || null,
      giftIdea.productTitle || null,
      giftIdea.estimatedPrice || null,
      giftIdea.currency,
      giftIdea.productImageUrl || null,
      giftIdea.shoppingLink || null,
      giftIdea.isPurchased ? 1 : 0,
      giftIdea.updatedAt,
      giftIdea.id,
    ]
  );
  return giftIdea;
};

export const deleteGiftIdea = async (id: string): Promise<void> => {
  const database = getDb();
  await database.runAsync('DELETE FROM gift_ideas WHERE id = ?', [id]);
};

export const upsertGiftIdeas = async (giftIdeas: GiftIdea[]): Promise<void> => {
  const database = getDb();

  for (const giftIdea of giftIdeas) {
    const existing = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM gift_ideas WHERE id = ?',
      [giftIdea.id]
    );

    if (existing) {
      await updateGiftIdea(giftIdea);
    } else {
      await insertGiftIdea(giftIdea);
    }
  }
};

// ===================================
// PENDING SYNC ACTIONS OPERATIONS
// ===================================

export const getPendingSyncActions = async (): Promise<PendingSyncAction[]> => {
  const database = getDb();
  const result = await database.getAllAsync<any>(
    'SELECT * FROM pending_sync_actions ORDER BY timestamp ASC'
  );

  return result.map(row => ({
    id: row.id,
    actionType: row.action_type as ActionType,
    entityType: row.entity_type as EntityType,
    entityId: row.entity_id,
    payload: row.payload,
    timestamp: row.timestamp,
    retryCount: row.retry_count,
  }));
};

export const insertSyncAction = async (
  actionType: ActionType,
  entityType: EntityType,
  entityId: string,
  payload: string
): Promise<void> => {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO pending_sync_actions (action_type, entity_type, entity_id, payload, timestamp, retry_count)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [actionType, entityType, entityId, payload, new Date().toISOString()]
  );
};

export const incrementSyncActionRetryCount = async (id: number): Promise<void> => {
  const database = getDb();
  await database.runAsync(
    'UPDATE pending_sync_actions SET retry_count = retry_count + 1 WHERE id = ?',
    [id]
  );
};

export const deleteSyncAction = async (id: number): Promise<void> => {
  const database = getDb();
  await database.runAsync('DELETE FROM pending_sync_actions WHERE id = ?', [id]);
};

// ===================================
// UTILITY OPERATIONS
// ===================================

/**
 * Clear all data from all tables (used on logout)
 */
export const clearAllData = async (): Promise<void> => {
  const database = getDb();

  // Delete in reverse order to respect foreign keys
  await database.runAsync('DELETE FROM pending_sync_actions');
  await database.runAsync('DELETE FROM gift_ideas');
  await database.runAsync('DELETE FROM occasions');
  await database.runAsync('DELETE FROM recipients');

  console.log('✅ All offline data cleared');
};

/**
 * Drop and recreate all tables (nuclear option for logout)
 */
export const resetDatabase = async (): Promise<void> => {
  const database = getDb();
  await database.execAsync(DROP_ALL_TABLES);
  await initDatabase();
  console.log('✅ Database reset complete');
};
