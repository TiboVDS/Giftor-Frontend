import * as sqliteService from '../../../src/services/database/sqliteService';
import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('SQLiteService', () => {
  let mockDb: any;

  beforeEach(() => {
    // Setup mock database with common methods
    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };

    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initDatabase', () => {
    it('should initialize database and create all tables', async () => {
      // Mock PRAGMA table_info to return columns including reminder_intervals (no migration needed)
      mockDb.getAllAsync.mockResolvedValue([
        { name: 'id' },
        { name: 'recipient_id' },
        { name: 'user_id' },
        { name: 'name' },
        { name: 'occasion_type' },
        { name: 'date' },
        { name: 'reminder_intervals' },
        { name: 'is_recurring' },
        { name: 'created_at' },
        { name: 'updated_at' },
      ]);

      await sqliteService.initDatabase();

      // Verify database was opened
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('giftor.db');

      // Verify all tables were created (4 tables + 4 index sets = 8 calls)
      expect(mockDb.execAsync).toHaveBeenCalledTimes(8);

      // Verify recipients table creation
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS recipients')
      );

      // Verify occasions table creation
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS occasions')
      );

      // Verify gift_ideas table creation
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS gift_ideas')
      );

      // Verify pending_sync_actions table creation
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS pending_sync_actions')
      );

      // Verify migration check was performed
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        'PRAGMA table_info(occasions)'
      );
    });

    it('should run migration to add reminder_intervals column if missing', async () => {
      // Mock PRAGMA table_info to return columns WITHOUT reminder_intervals
      mockDb.getAllAsync.mockResolvedValue([
        { name: 'id' },
        { name: 'recipient_id' },
        { name: 'user_id' },
        { name: 'name' },
        { name: 'occasion_type' },
        { name: 'date' },
        { name: 'is_recurring' },
        { name: 'created_at' },
        { name: 'updated_at' },
      ]);

      await sqliteService.initDatabase();

      // Verify migration was run (8 table/index creates + 1 ALTER TABLE)
      expect(mockDb.execAsync).toHaveBeenCalledTimes(9);
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE occasions ADD COLUMN reminder_intervals')
      );
    });
  });

  describe('Recipient CRUD Operations', () => {
    beforeEach(async () => {
      // Mock PRAGMA for migration check
      mockDb.getAllAsync.mockResolvedValueOnce([{ name: 'reminder_intervals' }]);
      await sqliteService.initDatabase();
      mockDb.getAllAsync.mockReset();
    });

    it('should insert a recipient', async () => {
      const recipient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user-1',
        name: 'John Doe',
        relationship: 'Friend',
        hobbiesInterests: ['gaming', 'music'],
        createdAt: '2025-11-14T10:00:00Z',
        updatedAt: '2025-11-14T10:00:00Z',
      };

      const result = await sqliteService.insertRecipient(recipient);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO recipients'),
        expect.arrayContaining([recipient.id, recipient.userId, recipient.name])
      );
      expect(result).toEqual(recipient);
    });

    it('should get recipients for a user', async () => {
      const mockRecipients = [
        {
          id: '123',
          user_id: 'user-1',
          name: 'John Doe',
          relationship: 'Friend',
          birthday: null,
          anniversary: null,
          hobbies_interests: '["gaming","music"]',
          notes: null,
          created_at: '2025-11-14T10:00:00Z',
          updated_at: '2025-11-14T10:00:00Z',
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockRecipients);

      const recipients = await sqliteService.getRecipients('user-1');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM recipients WHERE user_id = ?'),
        ['user-1']
      );
      expect(recipients).toHaveLength(1);
      expect(recipients[0].hobbiesInterests).toEqual(['gaming', 'music']);
    });

    it('should update a recipient', async () => {
      const recipient = {
        id: '123',
        userId: 'user-1',
        name: 'John Doe Updated',
        relationship: 'Best Friend',
        hobbiesInterests: ['gaming'],
        createdAt: '2025-11-14T10:00:00Z',
        updatedAt: '2025-11-14T11:00:00Z',
      };

      const result = await sqliteService.updateRecipient(recipient);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE recipients'),
        expect.arrayContaining([recipient.name, recipient.relationship])
      );
      expect(result).toEqual(recipient);
    });

    it('should delete a recipient', async () => {
      await sqliteService.deleteRecipient('123');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM recipients WHERE id = ?',
        ['123']
      );
    });

    it('should upsert recipients (insert new, update existing)', async () => {
      const recipients = [
        {
          id: '123',
          userId: 'user-1',
          name: 'John Doe',
          relationship: 'Friend',
          hobbiesInterests: [],
          createdAt: '2025-11-14T10:00:00Z',
          updatedAt: '2025-11-14T10:00:00Z',
        },
        {
          id: '456',
          userId: 'user-1',
          name: 'Jane Smith',
          relationship: 'Sister',
          hobbiesInterests: [],
          createdAt: '2025-11-14T10:00:00Z',
          updatedAt: '2025-11-14T10:00:00Z',
        },
      ];

      // First recipient exists, second is new
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ id: '123' })
        .mockResolvedValueOnce(null);

      await sqliteService.upsertRecipients(recipients);

      // Should update first recipient
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE recipients'),
        expect.arrayContaining(['John Doe'])
      );

      // Should insert second recipient
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO recipients'),
        expect.arrayContaining(['456', 'user-1', 'Jane Smith'])
      );
    });
  });

  describe('Pending Sync Actions', () => {
    beforeEach(async () => {
      // Mock PRAGMA for migration check
      mockDb.getAllAsync.mockResolvedValueOnce([{ name: 'reminder_intervals' }]);
      await sqliteService.initDatabase();
      mockDb.getAllAsync.mockReset();
    });

    it('should insert a sync action', async () => {
      await sqliteService.insertSyncAction(
        'CREATE',
        'Recipient',
        '123',
        '{"name":"John Doe"}'
      );

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO pending_sync_actions'),
        expect.arrayContaining(['CREATE', 'Recipient', '123', '{"name":"John Doe"}'])
      );
    });

    it('should get pending sync actions in order', async () => {
      const mockActions = [
        {
          id: 1,
          action_type: 'CREATE',
          entity_type: 'Recipient',
          entity_id: '123',
          payload: '{"name":"John Doe"}',
          timestamp: '2025-11-14T10:00:00Z',
          retry_count: 0,
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockActions);

      const actions = await sqliteService.getPendingSyncActions();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY timestamp ASC')
      );
      expect(actions).toHaveLength(1);
      expect(actions[0].actionType).toBe('CREATE');
    });

    it('should delete a sync action', async () => {
      await sqliteService.deleteSyncAction(1);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM pending_sync_actions WHERE id = ?',
        [1]
      );
    });
  });

  describe('clearAllData', () => {
    beforeEach(async () => {
      // Mock PRAGMA for migration check
      mockDb.getAllAsync.mockResolvedValueOnce([{ name: 'reminder_intervals' }]);
      await sqliteService.initDatabase();
      mockDb.getAllAsync.mockReset();
    });

    it('should delete all data from all tables in correct order', async () => {
      await sqliteService.clearAllData();

      // Verify all DELETE statements were executed in reverse order (foreign keys)
      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM pending_sync_actions');
      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM gift_ideas');
      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM occasions');
      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM recipients');
    });
  });
});
