import { create } from 'zustand';
import { GiftIdea } from '../../../types/database.types';
import * as sqliteService from '../../../services/database/sqliteService';
import * as offlineQueue from '../../../services/sync/offlineQueue';
import apiClient from '../../../services/api/apiClient';

interface GiftIdeaStore {
  giftIdeas: GiftIdea[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  fetchGiftIdeas: (userId: string, isOnline: boolean) => Promise<void>;
  createGiftIdea: (data: Omit<GiftIdea, 'id' | 'createdAt' | 'updatedAt'>, isOnline: boolean) => Promise<void>;
  updateGiftIdea: (giftIdea: GiftIdea, isOnline: boolean) => Promise<void>;
  deleteGiftIdea: (id: string, isOnline: boolean) => Promise<void>;
  clearGiftIdeas: () => void;
}

export const useGiftIdeaStore = create<GiftIdeaStore>((set, get) => ({
  giftIdeas: [],
  isLoading: false,
  isSyncing: false,
  error: null,

  /**
   * Fetch gift ideas from local SQLite first, then sync with API if online
   */
  fetchGiftIdeas: async (userId: string, isOnline: boolean) => {
    set({ isLoading: true, error: null });

    try {
      // Always read from SQLite first (instant response)
      const localGiftIdeas = await sqliteService.getGiftIdeas(userId);
      set({ giftIdeas: localGiftIdeas, isLoading: false });

      // If online, sync with API in background
      if (isOnline) {
        set({ isSyncing: true });
        try {
          const response = await apiClient.get<{ data: GiftIdea[] }>('/api/giftideas');
          const apiGiftIdeas = response.data.data;

          // Update SQLite with API data
          await sqliteService.upsertGiftIdeas(apiGiftIdeas);

          // Update store
          set({ giftIdeas: apiGiftIdeas, isSyncing: false });
        } catch (syncError) {
          console.warn('⚠️ Failed to sync gift ideas from API:', syncError);
          set({ isSyncing: false });
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch gift ideas:', error);
      set({ error: error.message, isLoading: false, isSyncing: false });
    }
  },

  /**
   * Create a new gift idea
   */
  createGiftIdea: async (data, isOnline) => {
    try {
      const now = new Date().toISOString();
      const newGiftIdea: GiftIdea = {
        ...data,
        id: generateGuid(),
        capturedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      // Write to SQLite immediately (optimistic capture - <100ms response)
      await sqliteService.insertGiftIdea(newGiftIdea);

      // Update store
      set({ giftIdeas: [newGiftIdea, ...get().giftIdeas] }); // Newest first

      if (isOnline) {
        try {
          const response = await apiClient.post<{ data: GiftIdea }>('/api/giftideas', data);
          const serverGiftIdea = response.data.data;

          await sqliteService.updateGiftIdea(serverGiftIdea);
          set({
            giftIdeas: get().giftIdeas.map(g =>
              g.id === newGiftIdea.id ? serverGiftIdea : g
            ),
          });
        } catch (apiError) {
          console.error('❌ Failed to create gift idea on server:', apiError);
          await sqliteService.deleteGiftIdea(newGiftIdea.id);
          set({ giftIdeas: get().giftIdeas.filter(g => g.id !== newGiftIdea.id) });
          throw apiError;
        }
      } else {
        await offlineQueue.addToQueue('CREATE', 'GiftIdea', newGiftIdea.id, newGiftIdea);
      }
    } catch (error: any) {
      console.error('❌ Failed to create gift idea:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Update an existing gift idea
   */
  updateGiftIdea: async (giftIdea, isOnline) => {
    try {
      const updatedGiftIdea = {
        ...giftIdea,
        updatedAt: new Date().toISOString(),
      };

      await sqliteService.updateGiftIdea(updatedGiftIdea);
      set({
        giftIdeas: get().giftIdeas.map(g =>
          g.id === updatedGiftIdea.id ? updatedGiftIdea : g
        ),
      });

      if (isOnline) {
        try {
          const response = await apiClient.put<{ data: GiftIdea }>(
            `/api/giftideas/${updatedGiftIdea.id}`,
            updatedGiftIdea
          );
          const serverGiftIdea = response.data.data;

          await sqliteService.updateGiftIdea(serverGiftIdea);
          set({
            giftIdeas: get().giftIdeas.map(g =>
              g.id === serverGiftIdea.id ? serverGiftIdea : g
            ),
          });
        } catch (apiError) {
          console.error('❌ Failed to update gift idea on server:', apiError);
          await offlineQueue.addToQueue('UPDATE', 'GiftIdea', updatedGiftIdea.id, updatedGiftIdea);
        }
      } else {
        await offlineQueue.addToQueue('UPDATE', 'GiftIdea', updatedGiftIdea.id, updatedGiftIdea);
      }
    } catch (error: any) {
      console.error('❌ Failed to update gift idea:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Delete a gift idea
   */
  deleteGiftIdea: async (id, isOnline) => {
    try {
      await sqliteService.deleteGiftIdea(id);
      set({ giftIdeas: get().giftIdeas.filter(g => g.id !== id) });

      if (isOnline) {
        try {
          await apiClient.delete(`/api/giftideas/${id}`);
        } catch (apiError) {
          console.error('❌ Failed to delete gift idea on server:', apiError);
          await offlineQueue.addToQueue('DELETE', 'GiftIdea', id, {});
        }
      } else {
        await offlineQueue.addToQueue('DELETE', 'GiftIdea', id, {});
      }
    } catch (error: any) {
      console.error('❌ Failed to delete gift idea:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Clear all gift ideas (used on logout)
   */
  clearGiftIdeas: () => {
    set({ giftIdeas: [], isLoading: false, isSyncing: false, error: null });
  },
}));

const generateGuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
