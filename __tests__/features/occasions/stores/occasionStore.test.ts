import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useOccasionStore } from '../../../../src/features/occasions/stores/occasionStore';
import * as sqliteService from '../../../../src/services/database/sqliteService';
import * as offlineQueue from '../../../../src/services/sync/offlineQueue';
import apiClient from '../../../../src/services/api/apiClient';

// Mock dependencies
jest.mock('../../../../src/services/database/sqliteService');
jest.mock('../../../../src/services/sync/offlineQueue');
jest.mock('../../../../src/services/api/apiClient');

describe('OccasionStore', () => {
  const mockOccasion = {
    id: '123',
    recipientId: 'recipient-1',
    userId: 'user-1',
    name: 'Birthday',
    occasionType: 'birthday',
    date: '2025-12-25',
    isRecurring: true,
    createdAt: '2025-11-14T10:00:00Z',
    updatedAt: '2025-11-14T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useOccasionStore.setState({
      occasions: [],
      isLoading: false,
      isSyncing: false,
      error: null,
    });
  });

  describe('fetchOccasions', () => {
    it('should fetch occasions from SQLite when offline', async () => {
      (sqliteService.getOccasions as jest.Mock).mockResolvedValue([mockOccasion]);

      const { result } = renderHook(() => useOccasionStore());

      await act(async () => {
        await result.current.fetchOccasions('user-1', false); // Offline
      });

      expect(sqliteService.getOccasions).toHaveBeenCalledWith('user-1');
      expect(result.current.occasions).toHaveLength(1);
      expect(result.current.occasions[0].name).toBe('Birthday');
      expect(result.current.isSyncing).toBe(false);
    });

    it('should sync with API when online', async () => {
      const apiOccasions = [{ ...mockOccasion, name: 'Birthday Updated' }];

      (sqliteService.getOccasions as jest.Mock).mockResolvedValue([mockOccasion]);
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: apiOccasions },
      });
      (sqliteService.upsertOccasions as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useOccasionStore());

      await act(async () => {
        await result.current.fetchOccasions('user-1', true); // Online
      });

      // First loads from SQLite
      expect(sqliteService.getOccasions).toHaveBeenCalledWith('user-1');

      // Then syncs with API
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/occasions');
        expect(sqliteService.upsertOccasions).toHaveBeenCalledWith(apiOccasions);
        expect(result.current.occasions[0].name).toBe('Birthday Updated');
      });
    });
  });

  describe('createOccasion', () => {
    it('should queue action when offline', async () => {
      const newOccasionData = {
        recipientId: 'recipient-1',
        userId: 'user-1',
        name: 'Anniversary',
        occasionType: 'anniversary',
        date: '2026-01-01',
        isRecurring: false,
      };

      (sqliteService.insertOccasion as jest.Mock).mockImplementation((o) =>
        Promise.resolve(o)
      );
      (offlineQueue.addToQueue as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useOccasionStore());

      await act(async () => {
        await result.current.createOccasion(newOccasionData, false); // Offline
      });

      // Should write to SQLite
      expect(sqliteService.insertOccasion).toHaveBeenCalled();

      // Should queue for sync
      expect(offlineQueue.addToQueue).toHaveBeenCalledWith(
        'CREATE',
        'Occasion',
        expect.any(String),
        expect.objectContaining({ name: 'Anniversary' })
      );

      // Should update store
      expect(result.current.occasions).toHaveLength(1);
      expect(result.current.occasions[0].name).toBe('Anniversary');
    });

    it('should sync to API when online', async () => {
      const newOccasionData = {
        recipientId: 'recipient-1',
        userId: 'user-1',
        name: 'Anniversary',
        occasionType: 'anniversary',
        date: '2026-01-01',
        isRecurring: false,
      };

      const serverOccasion = {
        ...newOccasionData,
        id: 'server-123',
        createdAt: '2025-11-14T10:00:00Z',
        updatedAt: '2025-11-14T10:00:00Z',
      };

      (sqliteService.insertOccasion as jest.Mock).mockImplementation((o) =>
        Promise.resolve(o)
      );
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { data: serverOccasion },
      });
      (sqliteService.updateOccasion as jest.Mock).mockResolvedValue(serverOccasion);

      const { result } = renderHook(() => useOccasionStore());

      await act(async () => {
        await result.current.createOccasion(newOccasionData, true); // Online
      });

      // Should write to SQLite
      expect(sqliteService.insertOccasion).toHaveBeenCalled();

      // Should sync to API
      expect(apiClient.post).toHaveBeenCalledWith('/api/occasions', newOccasionData);

      // Should update with server response
      expect(sqliteService.updateOccasion).toHaveBeenCalledWith(serverOccasion);

      // Should update store with server ID
      expect(result.current.occasions[0].id).toBe('server-123');
    });
  });

  describe('deleteOccasion', () => {
    it('should queue deletion when offline', async () => {
      (sqliteService.deleteOccasion as jest.Mock).mockResolvedValue(undefined);
      (offlineQueue.addToQueue as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useOccasionStore());
      useOccasionStore.setState({ occasions: [mockOccasion] });

      await act(async () => {
        await result.current.deleteOccasion(mockOccasion.id, false); // Offline
      });

      expect(sqliteService.deleteOccasion).toHaveBeenCalledWith(mockOccasion.id);
      expect(offlineQueue.addToQueue).toHaveBeenCalledWith(
        'DELETE',
        'Occasion',
        mockOccasion.id,
        {}
      );
      expect(result.current.occasions).toHaveLength(0);
    });
  });

  describe('clearOccasions', () => {
    it('should clear all occasions from store', () => {
      const { result } = renderHook(() => useOccasionStore());
      useOccasionStore.setState({
        occasions: [mockOccasion],
        isLoading: true,
        error: 'Some error',
      });

      act(() => {
        result.current.clearOccasions();
      });

      expect(result.current.occasions).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
