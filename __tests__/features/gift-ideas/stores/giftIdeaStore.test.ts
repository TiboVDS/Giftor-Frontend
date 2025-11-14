import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useGiftIdeaStore } from '../../../../src/features/gift-ideas/stores/giftIdeaStore';
import * as sqliteService from '../../../../src/services/database/sqliteService';
import * as offlineQueue from '../../../../src/services/sync/offlineQueue';
import apiClient from '../../../../src/services/api/apiClient';

// Mock dependencies
jest.mock('../../../../src/services/database/sqliteService');
jest.mock('../../../../src/services/sync/offlineQueue');
jest.mock('../../../../src/services/api/apiClient');

describe('GiftIdeaStore', () => {
  const mockGiftIdea = {
    id: '123',
    userId: 'user-1',
    recipientId: 'recipient-1',
    occasionId: 'occasion-1',
    giftText: 'Wireless headphones',
    notes: 'Loves music',
    productTitle: 'Sony WH-1000XM5',
    estimatedPrice: 399.99,
    currency: 'USD',
    isPurchased: false,
    capturedAt: '2025-11-14T10:00:00Z',
    createdAt: '2025-11-14T10:00:00Z',
    updatedAt: '2025-11-14T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useGiftIdeaStore.setState({
      giftIdeas: [],
      isLoading: false,
      isSyncing: false,
      error: null,
    });
  });

  describe('fetchGiftIdeas', () => {
    it('should fetch gift ideas from SQLite when offline', async () => {
      (sqliteService.getGiftIdeas as jest.Mock).mockResolvedValue([mockGiftIdea]);

      const { result } = renderHook(() => useGiftIdeaStore());

      await act(async () => {
        await result.current.fetchGiftIdeas('user-1', false); // Offline
      });

      expect(sqliteService.getGiftIdeas).toHaveBeenCalledWith('user-1');
      expect(result.current.giftIdeas).toHaveLength(1);
      expect(result.current.giftIdeas[0].giftText).toBe('Wireless headphones');
      expect(result.current.isSyncing).toBe(false);
    });

    it('should sync with API when online', async () => {
      const apiGiftIdeas = [{ ...mockGiftIdea, giftText: 'Wireless headphones Updated' }];

      (sqliteService.getGiftIdeas as jest.Mock).mockResolvedValue([mockGiftIdea]);
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: apiGiftIdeas },
      });
      (sqliteService.upsertGiftIdeas as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGiftIdeaStore());

      await act(async () => {
        await result.current.fetchGiftIdeas('user-1', true); // Online
      });

      // First loads from SQLite
      expect(sqliteService.getGiftIdeas).toHaveBeenCalledWith('user-1');

      // Then syncs with API
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/giftideas');
        expect(sqliteService.upsertGiftIdeas).toHaveBeenCalledWith(apiGiftIdeas);
        expect(result.current.giftIdeas[0].giftText).toBe('Wireless headphones Updated');
      });
    });
  });

  describe('createGiftIdea', () => {
    it('should queue action when offline', async () => {
      const newGiftIdeaData = {
        userId: 'user-1',
        recipientId: 'recipient-1',
        occasionId: 'occasion-1',
        giftText: 'Book collection',
        notes: 'Fantasy series',
        isPurchased: false,
        capturedAt: '2025-11-14T12:00:00Z',
      };

      (sqliteService.insertGiftIdea as jest.Mock).mockImplementation((g) =>
        Promise.resolve(g)
      );
      (offlineQueue.addToQueue as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGiftIdeaStore());

      await act(async () => {
        await result.current.createGiftIdea(newGiftIdeaData, false); // Offline
      });

      // Should write to SQLite
      expect(sqliteService.insertGiftIdea).toHaveBeenCalled();

      // Should queue for sync
      expect(offlineQueue.addToQueue).toHaveBeenCalledWith(
        'CREATE',
        'GiftIdea',
        expect.any(String),
        expect.objectContaining({ giftText: 'Book collection' })
      );

      // Should update store
      expect(result.current.giftIdeas).toHaveLength(1);
      expect(result.current.giftIdeas[0].giftText).toBe('Book collection');
    });

    it('should sync to API when online', async () => {
      const newGiftIdeaData = {
        userId: 'user-1',
        recipientId: 'recipient-1',
        occasionId: 'occasion-1',
        giftText: 'Book collection',
        notes: 'Fantasy series',
        isPurchased: false,
        capturedAt: '2025-11-14T12:00:00Z',
      };

      const serverGiftIdea = {
        ...newGiftIdeaData,
        id: 'server-123',
        createdAt: '2025-11-14T10:00:00Z',
        updatedAt: '2025-11-14T10:00:00Z',
      };

      (sqliteService.insertGiftIdea as jest.Mock).mockImplementation((g) =>
        Promise.resolve(g)
      );
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { data: serverGiftIdea },
      });
      (sqliteService.updateGiftIdea as jest.Mock).mockResolvedValue(serverGiftIdea);

      const { result } = renderHook(() => useGiftIdeaStore());

      await act(async () => {
        await result.current.createGiftIdea(newGiftIdeaData, true); // Online
      });

      // Should write to SQLite
      expect(sqliteService.insertGiftIdea).toHaveBeenCalled();

      // Should sync to API
      expect(apiClient.post).toHaveBeenCalledWith('/api/giftideas', newGiftIdeaData);

      // Should update with server response
      expect(sqliteService.updateGiftIdea).toHaveBeenCalledWith(serverGiftIdea);

      // Should update store with server ID
      expect(result.current.giftIdeas[0].id).toBe('server-123');
    });
  });

  describe('updateGiftIdea', () => {
    it('should update gift idea when offline and queue for sync', async () => {
      const updatedGiftIdea = { ...mockGiftIdea, notes: 'Updated notes' };

      (sqliteService.updateGiftIdea as jest.Mock).mockResolvedValue(updatedGiftIdea);
      (offlineQueue.addToQueue as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGiftIdeaStore());
      useGiftIdeaStore.setState({ giftIdeas: [mockGiftIdea] });

      await act(async () => {
        await result.current.updateGiftIdea(updatedGiftIdea, false); // Offline
      });

      expect(sqliteService.updateGiftIdea).toHaveBeenCalled();
      expect(offlineQueue.addToQueue).toHaveBeenCalledWith(
        'UPDATE',
        'GiftIdea',
        mockGiftIdea.id,
        expect.objectContaining({ notes: 'Updated notes' })
      );
      expect(result.current.giftIdeas[0].notes).toBe('Updated notes');
    });
  });

  describe('deleteGiftIdea', () => {
    it('should queue deletion when offline', async () => {
      (sqliteService.deleteGiftIdea as jest.Mock).mockResolvedValue(undefined);
      (offlineQueue.addToQueue as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useGiftIdeaStore());
      useGiftIdeaStore.setState({ giftIdeas: [mockGiftIdea] });

      await act(async () => {
        await result.current.deleteGiftIdea(mockGiftIdea.id, false); // Offline
      });

      expect(sqliteService.deleteGiftIdea).toHaveBeenCalledWith(mockGiftIdea.id);
      expect(offlineQueue.addToQueue).toHaveBeenCalledWith(
        'DELETE',
        'GiftIdea',
        mockGiftIdea.id,
        {}
      );
      expect(result.current.giftIdeas).toHaveLength(0);
    });
  });

  describe('clearGiftIdeas', () => {
    it('should clear all gift ideas from store', () => {
      const { result } = renderHook(() => useGiftIdeaStore());
      useGiftIdeaStore.setState({
        giftIdeas: [mockGiftIdea],
        isLoading: true,
        error: 'Some error',
      });

      act(() => {
        result.current.clearGiftIdeas();
      });

      expect(result.current.giftIdeas).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
