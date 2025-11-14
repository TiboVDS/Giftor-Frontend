import { create } from 'zustand';
import { Occasion } from '../../../types/database.types';
import * as sqliteService from '../../../services/database/sqliteService';
import * as offlineQueue from '../../../services/sync/offlineQueue';
import apiClient from '../../../services/api/apiClient';

interface OccasionStore {
  occasions: Occasion[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  fetchOccasions: (userId: string, isOnline: boolean) => Promise<void>;
  createOccasion: (data: Omit<Occasion, 'id' | 'createdAt' | 'updatedAt'>, isOnline: boolean) => Promise<void>;
  updateOccasion: (occasion: Occasion, isOnline: boolean) => Promise<void>;
  deleteOccasion: (id: string, isOnline: boolean) => Promise<void>;
  clearOccasions: () => void;
}

export const useOccasionStore = create<OccasionStore>((set, get) => ({
  occasions: [],
  isLoading: false,
  isSyncing: false,
  error: null,

  /**
   * Fetch occasions from local SQLite first, then sync with API if online
   */
  fetchOccasions: async (userId: string, isOnline: boolean) => {
    set({ isLoading: true, error: null });

    try {
      // Always read from SQLite first (instant response)
      const localOccasions = await sqliteService.getOccasions(userId);
      set({ occasions: localOccasions, isLoading: false });

      // If online, sync with API in background
      if (isOnline) {
        set({ isSyncing: true });
        try {
          const response = await apiClient.get<{ data: Occasion[] }>('/api/occasions');
          const apiOccasions = response.data.data;

          // Update SQLite with API data
          await sqliteService.upsertOccasions(apiOccasions);

          // Update store
          set({ occasions: apiOccasions, isSyncing: false });
        } catch (syncError) {
          console.warn('⚠️ Failed to sync occasions from API:', syncError);
          set({ isSyncing: false });
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch occasions:', error);
      set({ error: error.message, isLoading: false, isSyncing: false });
    }
  },

  /**
   * Create a new occasion
   */
  createOccasion: async (data, isOnline) => {
    try {
      const now = new Date().toISOString();
      const newOccasion: Occasion = {
        ...data,
        id: generateGuid(),
        createdAt: now,
        updatedAt: now,
      };

      // Write to SQLite immediately
      await sqliteService.insertOccasion(newOccasion);

      // Update store
      set({ occasions: [...get().occasions, newOccasion] });

      if (isOnline) {
        try {
          const response = await apiClient.post<{ data: Occasion }>('/api/occasions', data);
          const serverOccasion = response.data.data;

          await sqliteService.updateOccasion(serverOccasion);
          set({
            occasions: get().occasions.map(o =>
              o.id === newOccasion.id ? serverOccasion : o
            ),
          });
        } catch (apiError) {
          console.error('❌ Failed to create occasion on server:', apiError);
          await sqliteService.deleteOccasion(newOccasion.id);
          set({ occasions: get().occasions.filter(o => o.id !== newOccasion.id) });
          throw apiError;
        }
      } else {
        await offlineQueue.addToQueue('CREATE', 'Occasion', newOccasion.id, newOccasion);
      }
    } catch (error: any) {
      console.error('❌ Failed to create occasion:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Update an existing occasion
   */
  updateOccasion: async (occasion, isOnline) => {
    try {
      const updatedOccasion = {
        ...occasion,
        updatedAt: new Date().toISOString(),
      };

      await sqliteService.updateOccasion(updatedOccasion);
      set({
        occasions: get().occasions.map(o =>
          o.id === updatedOccasion.id ? updatedOccasion : o
        ),
      });

      if (isOnline) {
        try {
          const response = await apiClient.put<{ data: Occasion }>(
            `/api/occasions/${updatedOccasion.id}`,
            updatedOccasion
          );
          const serverOccasion = response.data.data;

          await sqliteService.updateOccasion(serverOccasion);
          set({
            occasions: get().occasions.map(o =>
              o.id === serverOccasion.id ? serverOccasion : o
            ),
          });
        } catch (apiError) {
          console.error('❌ Failed to update occasion on server:', apiError);
          await offlineQueue.addToQueue('UPDATE', 'Occasion', updatedOccasion.id, updatedOccasion);
        }
      } else {
        await offlineQueue.addToQueue('UPDATE', 'Occasion', updatedOccasion.id, updatedOccasion);
      }
    } catch (error: any) {
      console.error('❌ Failed to update occasion:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Delete an occasion
   */
  deleteOccasion: async (id, isOnline) => {
    try {
      await sqliteService.deleteOccasion(id);
      set({ occasions: get().occasions.filter(o => o.id !== id) });

      if (isOnline) {
        try {
          await apiClient.delete(`/api/occasions/${id}`);
        } catch (apiError) {
          console.error('❌ Failed to delete occasion on server:', apiError);
          await offlineQueue.addToQueue('DELETE', 'Occasion', id, {});
        }
      } else {
        await offlineQueue.addToQueue('DELETE', 'Occasion', id, {});
      }
    } catch (error: any) {
      console.error('❌ Failed to delete occasion:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Clear all occasions (used on logout)
   */
  clearOccasions: () => {
    set({ occasions: [], isLoading: false, isSyncing: false, error: null });
  },
}));

const generateGuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
