import { create } from 'zustand';
import { Recipient } from '../../../types/database.types';
import * as sqliteService from '../../../services/database/sqliteService';
import * as offlineQueue from '../../../services/sync/offlineQueue';
import apiClient from '../../../services/api/apiClient';

interface RecipientStore {
  recipients: Recipient[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  fetchRecipients: (userId: string, isOnline: boolean) => Promise<void>;
  createRecipient: (data: Omit<Recipient, 'id' | 'createdAt' | 'updatedAt'>, isOnline: boolean) => Promise<void>;
  updateRecipient: (recipient: Recipient, isOnline: boolean) => Promise<void>;
  deleteRecipient: (id: string, isOnline: boolean) => Promise<void>;
  clearRecipients: () => void;
}

export const useRecipientStore = create<RecipientStore>((set, get) => ({
  recipients: [],
  isLoading: false,
  isSyncing: false,
  error: null,

  /**
   * Fetch recipients from local SQLite first, then sync with API if online
   */
  fetchRecipients: async (userId: string, isOnline: boolean) => {
    set({ isLoading: true, error: null });

    try {
      // Always read from SQLite first (instant response)
      const localRecipients = await sqliteService.getRecipients(userId);
      set({ recipients: localRecipients, isLoading: false });

      // If online, sync with API in background
      if (isOnline) {
        set({ isSyncing: true });
        try {
          const response = await apiClient.get<{ data: Recipient[] }>('/api/recipients');
          const apiRecipients = response.data.data;

          // Update SQLite with API data
          await sqliteService.upsertRecipients(apiRecipients);

          // Update store
          set({ recipients: apiRecipients, isSyncing: false });
        } catch (syncError) {
          console.warn('⚠️ Failed to sync recipients from API:', syncError);
          set({ isSyncing: false });
          // Continue with local data
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch recipients:', error);
      set({ error: error.message, isLoading: false, isSyncing: false });
    }
  },

  /**
   * Create a new recipient
   */
  createRecipient: async (data, isOnline) => {
    try {
      const now = new Date().toISOString();
      const newRecipient: Recipient = {
        ...data,
        id: generateGuid(), // Generate temporary GUID (will be replaced by server if online)
        createdAt: now,
        updatedAt: now,
      };

      // Write to SQLite immediately (optimistic update)
      await sqliteService.insertRecipient(newRecipient);

      // Update store (UI reflects change instantly)
      set({ recipients: [...get().recipients, newRecipient] });

      if (isOnline) {
        // Sync to server
        try {
          const response = await apiClient.post<{ data: Recipient }>('/api/recipients', data);
          const serverRecipient = response.data.data;

          // Update SQLite and store with server response (includes server ID and timestamp)
          await sqliteService.updateRecipient(serverRecipient);
          set({
            recipients: get().recipients.map(r =>
              r.id === newRecipient.id ? serverRecipient : r
            ),
          });
        } catch (apiError) {
          console.error('❌ Failed to create recipient on server:', apiError);
          // Revert optimistic update
          await sqliteService.deleteRecipient(newRecipient.id);
          set({ recipients: get().recipients.filter(r => r.id !== newRecipient.id) });
          throw apiError;
        }
      } else {
        // Queue for sync when online
        await offlineQueue.addToQueue('CREATE', 'Recipient', newRecipient.id, newRecipient);
      }
    } catch (error: any) {
      console.error('❌ Failed to create recipient:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Update an existing recipient
   */
  updateRecipient: async (recipient, isOnline) => {
    try {
      const updatedRecipient = {
        ...recipient,
        updatedAt: new Date().toISOString(),
      };

      // Write to SQLite immediately
      await sqliteService.updateRecipient(updatedRecipient);

      // Update store
      set({
        recipients: get().recipients.map(r =>
          r.id === updatedRecipient.id ? updatedRecipient : r
        ),
      });

      if (isOnline) {
        // Sync to server
        try {
          const response = await apiClient.put<{ data: Recipient }>(
            `/api/recipients/${updatedRecipient.id}`,
            updatedRecipient
          );
          const serverRecipient = response.data.data;

          // Update SQLite and store with server response
          await sqliteService.updateRecipient(serverRecipient);
          set({
            recipients: get().recipients.map(r =>
              r.id === serverRecipient.id ? serverRecipient : r
            ),
          });
        } catch (apiError) {
          console.error('❌ Failed to update recipient on server:', apiError);
          // Keep local changes (will sync later)
          await offlineQueue.addToQueue('UPDATE', 'Recipient', updatedRecipient.id, updatedRecipient);
        }
      } else {
        // Queue for sync when online
        await offlineQueue.addToQueue('UPDATE', 'Recipient', updatedRecipient.id, updatedRecipient);
      }
    } catch (error: any) {
      console.error('❌ Failed to update recipient:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Delete a recipient
   */
  deleteRecipient: async (id, isOnline) => {
    try {
      // Delete from SQLite immediately
      await sqliteService.deleteRecipient(id);

      // Update store
      set({ recipients: get().recipients.filter(r => r.id !== id) });

      if (isOnline) {
        // Sync to server
        try {
          await apiClient.delete(`/api/recipients/${id}`);
        } catch (apiError) {
          console.error('❌ Failed to delete recipient on server:', apiError);
          // Keep local deletion (will sync later)
          await offlineQueue.addToQueue('DELETE', 'Recipient', id, {});
        }
      } else {
        // Queue for sync when online
        await offlineQueue.addToQueue('DELETE', 'Recipient', id, {});
      }
    } catch (error: any) {
      console.error('❌ Failed to delete recipient:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Clear all recipients (used on logout)
   */
  clearRecipients: () => {
    set({ recipients: [], isLoading: false, isSyncing: false, error: null });
  },
}));

/**
 * Generate a temporary GUID for offline-created entities
 */
const generateGuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
