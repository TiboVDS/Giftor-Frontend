import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRecipientStore } from '../../../../src/features/recipients/stores/recipientStore';
import { useAuthStore } from '../../../../src/features/auth/stores/authStore';
import * as sqliteService from '../../../../src/services/database/sqliteService';
import * as offlineQueue from '../../../../src/services/sync/offlineQueue';
import apiClient from '../../../../src/services/api/apiClient';

// Mock dependencies
jest.mock('../../../../src/services/database/sqliteService');
jest.mock('../../../../src/services/sync/offlineQueue');
jest.mock('../../../../src/services/api/apiClient');
jest.mock('../../../../src/features/auth/stores/authStore');

describe('RecipientStore', () => {
  const mockRecipient = {
    id: '123',
    userId: 'user-1',
    name: 'John Doe',
    relationship: 'Friend',
    hobbiesInterests: ['gaming'],
    createdAt: '2025-11-14T10:00:00Z',
    updatedAt: '2025-11-14T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth store with authenticated user
    (useAuthStore.getState as jest.Mock) = jest.fn(() => ({
      user: { id: 'user-1', email: 'test@example.com' },
      token: 'mock-token',
    }));

    // Reset store state
    useRecipientStore.setState({
      recipients: [],
      isLoading: false,
      isSyncing: false,
      error: null,
    });
  });

  describe('fetchRecipients', () => {
    it('should fetch recipients from SQLite when offline', async () => {
      (sqliteService.getRecipients as jest.Mock).mockResolvedValue([mockRecipient]);

      const { result } = renderHook(() => useRecipientStore());

      await act(async () => {
        await result.current.fetchRecipients('user-1', false); // Offline
      });

      expect(sqliteService.getRecipients).toHaveBeenCalledWith('user-1');
      expect(result.current.recipients).toHaveLength(1);
      expect(result.current.recipients[0].name).toBe('John Doe');
      expect(result.current.isSyncing).toBe(false);
    });

    it('should sync with API when online', async () => {
      const apiRecipients = [{ ...mockRecipient, id: mockRecipient.id, name: 'John Doe Updated' }];

      (sqliteService.getRecipients as jest.Mock).mockResolvedValue([mockRecipient]);
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { success: true, data: apiRecipients },
      });
      (sqliteService.upsertRecipients as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecipientStore());

      await act(async () => {
        await result.current.fetchRecipients('user-1', true); // Online
      });

      // First loads from SQLite
      expect(sqliteService.getRecipients).toHaveBeenCalledWith('user-1');

      // Wait for async API sync to complete
      await waitFor(
        () => {
          expect(apiClient.get).toHaveBeenCalledWith('/api/recipients');
          expect(sqliteService.upsertRecipients).toHaveBeenCalledWith(
            expect.arrayContaining([
              expect.objectContaining({
                id: '123',
                name: 'John Doe Updated',
                relationship: 'Friend',
              }),
            ])
          );
        },
        { timeout: 3000 }
      );

      // Verify state updated
      await waitFor(() => {
        expect(result.current.recipients[0].name).toBe('John Doe Updated');
      });
    });
  });

  describe('createRecipient', () => {
    it('should queue action when offline', async () => {
      const newRecipientData = {
        userId: 'user-1',
        name: 'Jane Smith',
        relationship: 'Sister',
        hobbiesInterests: [],
      };

      (sqliteService.insertRecipient as jest.Mock).mockImplementation((r) =>
        Promise.resolve(r)
      );
      (offlineQueue.addToQueue as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecipientStore());

      await act(async () => {
        await result.current.createRecipient(newRecipientData, false); // Offline
      });

      // Should write to SQLite
      expect(sqliteService.insertRecipient).toHaveBeenCalled();

      // Should queue for sync
      expect(offlineQueue.addToQueue).toHaveBeenCalledWith(
        'CREATE',
        'Recipient',
        expect.any(String),
        expect.objectContaining({ name: 'Jane Smith' })
      );

      // Should update store
      expect(result.current.recipients).toHaveLength(1);
      expect(result.current.recipients[0].name).toBe('Jane Smith');
    });

    it('should sync to API when online', async () => {
      const newRecipientData = {
        name: 'Jane Smith',
        relationship: 'Sister',
        interests: [],
      };

      const serverRecipient = {
        ...newRecipientData,
        id: 'server-123',
        userId: 'user-1',
        hobbiesInterests: [],
        createdAt: '2025-11-14T10:00:00Z',
        updatedAt: '2025-11-14T10:00:00Z',
      };

      (sqliteService.insertRecipient as jest.Mock).mockImplementation((r) =>
        Promise.resolve(r)
      );
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { success: true, data: serverRecipient },
      });
      (sqliteService.updateRecipient as jest.Mock).mockResolvedValue(serverRecipient);

      const { result } = renderHook(() => useRecipientStore());

      await act(async () => {
        await result.current.createRecipient(newRecipientData, true); // Online
      });

      // Should write to SQLite with temp ID first
      expect(sqliteService.insertRecipient).toHaveBeenCalled();

      // Wait for API sync
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalled();
      });

      // Should delete temp ID and insert server ID (delete+insert pattern to replace UUID)
      expect(sqliteService.deleteRecipient).toHaveBeenCalled();
      expect(sqliteService.insertRecipient).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'server-123',
          userId: 'user-1',
          name: 'Jane Smith',
          relationship: 'Sister',
        })
      );

      // Should update store with server ID
      expect(result.current.recipients[0].id).toBe('server-123');
    });
  });

  describe('updateRecipient', () => {
    it('should queue update when offline', async () => {
      const updatedRecipient = {
        ...mockRecipient,
        name: 'John Doe Updated',
        updatedAt: '2025-11-14T11:00:00Z',
      };

      (sqliteService.updateRecipient as jest.Mock).mockResolvedValue(updatedRecipient);
      (offlineQueue.addToQueue as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecipientStore());
      useRecipientStore.setState({ recipients: [mockRecipient] });

      await act(async () => {
        await result.current.updateRecipient(updatedRecipient, false); // Offline
      });

      expect(sqliteService.updateRecipient).toHaveBeenCalled();
      expect(offlineQueue.addToQueue).toHaveBeenCalledWith(
        'UPDATE',
        'Recipient',
        mockRecipient.id,
        expect.objectContaining({ name: 'John Doe Updated' })
      );
    });
  });

  describe('deleteRecipient', () => {
    it('should queue deletion when offline', async () => {
      (sqliteService.deleteRecipient as jest.Mock).mockResolvedValue(undefined);
      (offlineQueue.addToQueue as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecipientStore());
      useRecipientStore.setState({ recipients: [mockRecipient] });

      await act(async () => {
        await result.current.deleteRecipient(mockRecipient.id, false); // Offline
      });

      expect(sqliteService.deleteRecipient).toHaveBeenCalledWith(mockRecipient.id);
      expect(offlineQueue.addToQueue).toHaveBeenCalledWith(
        'DELETE',
        'Recipient',
        mockRecipient.id,
        {}
      );
      expect(result.current.recipients).toHaveLength(0);
    });

    it('should sync deletion to API when online', async () => {
      (sqliteService.deleteRecipient as jest.Mock).mockResolvedValue(undefined);
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => useRecipientStore());
      useRecipientStore.setState({ recipients: [mockRecipient] });

      await act(async () => {
        await result.current.deleteRecipient(mockRecipient.id, true); // Online
      });

      expect(sqliteService.deleteRecipient).toHaveBeenCalledWith(mockRecipient.id);
      expect(apiClient.delete).toHaveBeenCalledWith(`/api/recipients/${mockRecipient.id}`);
      expect(result.current.recipients).toHaveLength(0);
    });
  });

  describe('clearRecipients', () => {
    it('should clear all recipients from store', () => {
      const { result } = renderHook(() => useRecipientStore());
      useRecipientStore.setState({
        recipients: [mockRecipient],
        isLoading: true,
        error: 'Some error',
      });

      act(() => {
        result.current.clearRecipients();
      });

      expect(result.current.recipients).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Search and Sort', () => {
    const recipients = [
      {
        id: '1',
        userId: 'user-1',
        name: 'Alice Smith',
        relationship: 'Friend',
        hobbiesInterests: [],
        birthday: '1995-03-15',
        createdAt: '2025-11-10T10:00:00Z',
        updatedAt: '2025-11-10T10:00:00Z',
      },
      {
        id: '2',
        userId: 'user-1',
        name: 'Bob Johnson',
        relationship: 'Family',
        hobbiesInterests: [],
        birthday: '1988-06-20',
        createdAt: '2025-11-12T10:00:00Z',
        updatedAt: '2025-11-12T10:00:00Z',
      },
      {
        id: '3',
        userId: 'user-1',
        name: 'Charlie Brown',
        relationship: 'Colleague',
        hobbiesInterests: [],
        createdAt: '2025-11-14T10:00:00Z',
        updatedAt: '2025-11-14T10:00:00Z',
      },
    ];

    describe('setSearchQuery', () => {
      it('should update search query', () => {
        const { result } = renderHook(() => useRecipientStore());

        act(() => {
          result.current.setSearchQuery('alice');
        });

        expect(result.current.searchQuery).toBe('alice');
      });
    });

    describe('setSortOption', () => {
      it('should update sort option', () => {
        const { result } = renderHook(() => useRecipientStore());

        act(() => {
          result.current.setSortOption('name-desc');
        });

        expect(result.current.sortOption).toBe('name-desc');
      });
    });

    describe('filteredRecipients', () => {
      beforeEach(() => {
        useRecipientStore.setState({
          recipients,
          searchQuery: '',
          sortOption: 'name-asc',
        });
      });

      it('should filter recipients by name (case-insensitive)', () => {
        const { result } = renderHook(() => useRecipientStore());

        act(() => {
          result.current.setSearchQuery('alice');
        });

        const filtered = result.current.filteredRecipients();
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Alice Smith');
      });

      it('should filter recipients with partial match', () => {
        const { result } = renderHook(() => useRecipientStore());

        act(() => {
          result.current.setSearchQuery('o'); // Matches Bob and Brown
        });

        const filtered = result.current.filteredRecipients();
        expect(filtered).toHaveLength(2);
        expect(filtered.map(r => r.name)).toContain('Bob Johnson');
        expect(filtered.map(r => r.name)).toContain('Charlie Brown');
      });

      it('should sort by name ascending (A-Z)', () => {
        const { result } = renderHook(() => useRecipientStore());

        act(() => {
          result.current.setSortOption('name-asc');
        });

        const filtered = result.current.filteredRecipients();
        expect(filtered[0].name).toBe('Alice Smith');
        expect(filtered[1].name).toBe('Bob Johnson');
        expect(filtered[2].name).toBe('Charlie Brown');
      });

      it('should sort by name descending (Z-A)', () => {
        const { result } = renderHook(() => useRecipientStore());

        act(() => {
          result.current.setSortOption('name-desc');
        });

        const filtered = result.current.filteredRecipients();
        expect(filtered[0].name).toBe('Charlie Brown');
        expect(filtered[1].name).toBe('Bob Johnson');
        expect(filtered[2].name).toBe('Alice Smith');
      });

      it('should sort by recently added (newest first)', () => {
        const { result } = renderHook(() => useRecipientStore());

        act(() => {
          result.current.setSortOption('recent');
        });

        const filtered = result.current.filteredRecipients();
        expect(filtered[0].name).toBe('Charlie Brown'); // 2025-11-14
        expect(filtered[1].name).toBe('Bob Johnson'); // 2025-11-12
        expect(filtered[2].name).toBe('Alice Smith'); // 2025-11-10
      });

      it('should apply both search and sort together', () => {
        const { result } = renderHook(() => useRecipientStore());

        act(() => {
          result.current.setSearchQuery('o'); // Matches Bob and Charlie
          result.current.setSortOption('name-desc'); // Sort Z-A
        });

        const filtered = result.current.filteredRecipients();
        expect(filtered).toHaveLength(2);
        expect(filtered[0].name).toBe('Charlie Brown'); // C before B
        expect(filtered[1].name).toBe('Bob Johnson');
      });

      it('should place recipients without birthdays at end when sorting by birthday', () => {
        const { result } = renderHook(() => useRecipientStore());

        act(() => {
          result.current.setSortOption('birthday');
        });

        const filtered = result.current.filteredRecipients();
        // Recipients with birthdays first, Charlie (no birthday) last
        expect(filtered[2].name).toBe('Charlie Brown');
      });
    });
  });
});
