import { create } from 'zustand';
import { Recipient } from '../../../types/database.types';
import * as sqliteService from '../../../services/database/sqliteService';
import * as offlineQueue from '../../../services/sync/offlineQueue';
import * as recipientService from '../services/recipientService';
import { RecipientDto, CreateRecipientRequest } from '../types/recipient.types';
import { useAuthStore } from '../../auth/stores/authStore';
import apiClient from '../../../services/api/apiClient';

interface RecipientStore {
  recipients: Recipient[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  fetchRecipients: (userId: string, isOnline: boolean) => Promise<void>;
  createRecipient: (data: CreateRecipientRequest, isOnline: boolean) => Promise<RecipientDto>;
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
          const apiRecipients = await recipientService.fetchRecipients();

          // Map RecipientDto to Recipient (database type)
          const mappedRecipients: Recipient[] = apiRecipients.map(dtoToRecipient);

          // Update SQLite with API data
          await sqliteService.upsertRecipients(mappedRecipients);

          // Update store
          set({ recipients: mappedRecipients, isSyncing: false });
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
  createRecipient: async (data: CreateRecipientRequest, isOnline: boolean): Promise<RecipientDto> => {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const now = new Date().toISOString();
      const tempId = generateGuid();

      // Create temporary recipient for optimistic update
      const tempRecipient: Recipient = {
        id: tempId,
        userId,
        name: data.name,
        relationship: data.relationship || 'Unknown',
        birthday: data.birthday,
        anniversary: data.anniversary,
        hobbiesInterests: data.interests || [],
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      };

      // Write to SQLite immediately (optimistic update)
      await sqliteService.insertRecipient(tempRecipient);

      // Update store (UI reflects change instantly)
      set({ recipients: [...get().recipients, tempRecipient] });

      if (isOnline) {
        // Sync to server
        try {
          const serverRecipient = await recipientService.createRecipient(data);
          const mappedRecipient = dtoToRecipient(serverRecipient);

          // Update SQLite and store with server response (includes server ID and timestamp)
          await sqliteService.updateRecipient(mappedRecipient);
          set({
            recipients: get().recipients.map(r =>
              r.id === tempId ? mappedRecipient : r
            ),
          });

          return serverRecipient;
        } catch (apiError) {
          console.error('❌ Failed to create recipient on server:', apiError);
          // Revert optimistic update
          await sqliteService.deleteRecipient(tempId);
          set({ recipients: get().recipients.filter(r => r.id !== tempId) });
          throw apiError;
        }
      } else {
        // Queue for sync when online
        await offlineQueue.addToQueue('CREATE', 'Recipient', tempId, tempRecipient);
        // Return temporary recipient as DTO
        return recipientToDto(tempRecipient);
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

/**
 * Map RecipientDto (API) to Recipient (database)
 */
const dtoToRecipient = (dto: RecipientDto): Recipient => {
  return {
    id: dto.id,
    userId: dto.userId,
    name: dto.name,
    relationship: dto.relationship,
    birthday: dto.birthday,
    anniversary: dto.anniversary,
    hobbiesInterests: dto.interests || [],
    notes: dto.notes,
    createdAt: new Date().toISOString(), // Not returned by API
    updatedAt: new Date().toISOString(), // Not returned by API
  };
};

/**
 * Map Recipient (database) to RecipientDto (API)
 */
const recipientToDto = (recipient: Recipient): RecipientDto => {
  return {
    id: recipient.id,
    userId: recipient.userId,
    name: recipient.name,
    relationship: recipient.relationship,
    birthday: recipient.birthday,
    anniversary: recipient.anniversary,
    interests: recipient.hobbiesInterests || [],
    notes: recipient.notes,
  };
};
