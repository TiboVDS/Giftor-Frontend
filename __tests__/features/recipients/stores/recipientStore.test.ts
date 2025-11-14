import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRecipientStore } from '../../../../src/features/recipients/stores/recipientStore';
import * as sqliteService from '../../../../src/services/database/sqliteService';
import * as offlineQueue from '../../../../src/services/sync/offlineQueue';
import apiClient from '../../../../src/services/api/apiClient';

// Mock dependencies
jest.mock('../../../../src/services/database/sqliteService');
jest.mock('../../../../src/services/sync/offlineQueue');
jest.mock('../../../../src/services/api/apiClient');

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
      const apiRecipients = [{ ...mockRecipient, name: 'John Doe Updated' }];

      (sqliteService.getRecipients as jest.Mock).mockResolvedValue([mockRecipient]);
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: apiRecipients },
      });
      (sqliteService.upsertRecipients as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecipientStore());

      await act(async () => {
        await result.current.fetchRecipients('user-1', true); // Online
      });

      // First loads from SQLite
      expect(sqliteService.getRecipients).toHaveBeenCalledWith('user-1');

      // Then syncs with API
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/recipients');
        expect(sqliteService.upsertRecipients).toHaveBeenCalledWith(apiRecipients);
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
        userId: 'user-1',
        name: 'Jane Smith',
        relationship: 'Sister',
        hobbiesInterests: [],
      };

      const serverRecipient = {
        ...newRecipientData,
        id: 'server-123',
        createdAt: '2025-11-14T10:00:00Z',
        updatedAt: '2025-11-14T10:00:00Z',
      };

      (sqliteService.insertRecipient as jest.Mock).mockImplementation((r) =>
        Promise.resolve(r)
      );
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { data: serverRecipient },
      });
      (sqliteService.updateRecipient as jest.Mock).mockResolvedValue(serverRecipient);

      const { result } = renderHook(() => useRecipientStore());

      await act(async () => {
        await result.current.createRecipient(newRecipientData, true); // Online
      });

      // Should write to SQLite
      expect(sqliteService.insertRecipient).toHaveBeenCalled();

      // Should sync to API
      expect(apiClient.post).toHaveBeenCalledWith('/api/recipients', newRecipientData);

      // Should update with server response
      expect(sqliteService.updateRecipient).toHaveBeenCalledWith(serverRecipient);

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
});
