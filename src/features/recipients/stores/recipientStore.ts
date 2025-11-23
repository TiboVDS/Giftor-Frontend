import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipient } from '../../../types/database.types';
import * as sqliteService from '../../../services/database/sqliteService';
import * as offlineQueue from '../../../services/sync/offlineQueue';
import * as recipientService from '../services/recipientService';
import { RecipientDto, CreateRecipientRequest } from '../types/recipient.types';
import { useAuthStore } from '../../auth/stores/authStore';
import apiClient from '../../../services/api/apiClient';

export type SortOption = 'name-asc' | 'name-desc' | 'birthday' | 'recent';

interface RecipientStore {
  recipients: Recipient[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Search and Sort state
  searchQuery: string;
  sortOption: SortOption;

  // Computed properties
  filteredRecipients: () => Recipient[];

  // Actions
  fetchRecipients: (userId: string, isOnline: boolean) => Promise<void>;
  createRecipient: (data: CreateRecipientRequest, isOnline: boolean) => Promise<RecipientDto>;
  updateRecipient: (recipient: Recipient, isOnline: boolean) => Promise<void>;
  deleteRecipient: (id: string, isOnline: boolean) => Promise<void>;
  clearRecipients: () => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
}

export const useRecipientStore = create<RecipientStore>()(
  persist(
    (set, get) => ({
      recipients: [],
      isLoading: false,
      isSyncing: false,
      error: null,
      searchQuery: '',
      sortOption: 'name-asc',

      /**
       * Get filtered and sorted recipients based on current search and sort settings
       */
      filteredRecipients: () => {
        const { recipients, searchQuery, sortOption } = get();

        // Apply search filter
        let filtered = recipients;
        if (searchQuery.trim().length > 0) {
          const query = searchQuery.toLowerCase();
          filtered = recipients.filter((r) =>
            r.name.toLowerCase().includes(query)
          );
        }

        // Apply sort
        const sorted = [...filtered].sort((a, b) => {
          switch (sortOption) {
            case 'name-asc':
              return a.name.localeCompare(b.name);

            case 'name-desc':
              return b.name.localeCompare(a.name);

            case 'birthday':
              return sortByUpcomingBirthday(a, b);

            case 'recent':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

            default:
              return 0;
          }
        });

        return sorted;
      },

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

      console.log('🆕 CREATE RECIPIENT - Starting', {
        tempId,
        name: data.name,
        isOnline,
      });

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
      console.log('💾 Inserting to SQLite with temp ID:', tempId);
      await sqliteService.insertRecipient(tempRecipient);
      console.log('✅ SQLite insert successful');

      // Update store (UI reflects change instantly)
      set({ recipients: [...get().recipients, tempRecipient] });
      console.log('✅ Store updated with temp recipient');

      if (isOnline) {
        // Sync to server
        try {
          console.log('🌐 Calling backend API...');
          const serverRecipient = await recipientService.createRecipient(data);
          console.log('✅ Backend API success', {
            serverId: serverRecipient.recipientId,
            tempId,
            serverRecipient,
          });

          const mappedRecipient = dtoToRecipient(serverRecipient);
          console.log('🔄 Mapped recipient', {
            mappedId: mappedRecipient.id,
            mappedRecipient,
          });

          // Replace temp ID with server ID in SQLite
          // Must delete+insert because temp ID !== server ID
          console.log('🗑️ Deleting temp ID from SQLite:', tempId);
          await sqliteService.deleteRecipient(tempId);
          console.log('✅ Temp ID deleted');

          console.log('💾 Inserting server recipient to SQLite:', mappedRecipient.id);
          await sqliteService.insertRecipient(mappedRecipient);
          console.log('✅ Server recipient inserted to SQLite');

          // Update store with server response (replaces temp recipient with real one)
          set({
            recipients: get().recipients.map(r =>
              r.id === tempId ? mappedRecipient : r
            ),
          });
          console.log('✅ Store updated with server recipient');

          return serverRecipient;
        } catch (apiError) {
          console.error('❌ Backend API failed:', apiError);
          console.log('🔄 Reverting optimistic update - deleting temp ID:', tempId);
          // Revert optimistic update
          await sqliteService.deleteRecipient(tempId);
          set({ recipients: get().recipients.filter(r => r.id !== tempId) });
          console.log('✅ Optimistic update reverted');
          throw apiError;
        }
      } else {
        console.log('📴 Offline mode - queuing for sync');
        // Queue for sync when online
        await offlineQueue.addToQueue('CREATE', 'Recipient', tempId, tempRecipient);
        console.log('✅ Queued for offline sync');
        // Return temporary recipient as DTO
        return recipientToDto(tempRecipient);
      }
    } catch (error: any) {
      console.error('❌ CREATE RECIPIENT FAILED:', {
        error: error.message,
        stack: error.stack,
        data,
      });
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
   * Delete a recipient with optimistic UI and rollback
   */
  deleteRecipient: async (id, isOnline) => {
    const { recipients } = get();
    const recipientToDelete = recipients.find(r => r.id === id);

    if (!recipientToDelete) {
      throw new Error('Recipient not found');
    }

    // Optimistic update: Remove from store immediately
    set({ recipients: recipients.filter(r => r.id !== id) });

    try {
      if (isOnline) {
        // Sync to server immediately
        try {
          await apiClient.delete(`/api/recipients/${id}`);

          // Success: Delete from SQLite
          await sqliteService.deleteRecipient(id);

          // TODO: Delete profile picture from Supabase Storage (Story 2.4 AC-5)
          // if (recipientToDelete.profilePictureUrl) {
          //   await supabaseStorageClient.deleteProfilePicture(id);
          // }
        } catch (apiError: any) {
          console.error('❌ Failed to delete recipient on server:', apiError);

          // Rollback: Re-add recipient to store
          set({ recipients: [...recipients] });

          // Throw error to show retry dialog
          throw apiError;
        }
      } else {
        // Delete from SQLite immediately
        await sqliteService.deleteRecipient(id);

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

  /**
   * Set search query for filtering recipients
   */
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  /**
   * Set sort option for ordering recipients
   */
  setSortOption: (option: SortOption) => {
    set({ sortOption: option });
  },
    }),
    {
      name: 'recipient-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ sortOption: state.sortOption }), // Only persist sort preference
    }
  )
);

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
    id: dto.recipientId, // Backend uses 'recipientId' not 'id'
    userId: dto.userId,
    name: dto.name,
    relationship: dto.relationship,
    birthday: dto.birthday,
    anniversary: dto.anniversary,
    hobbiesInterests: dto.interests || [],
    notes: dto.notes,
    createdAt: dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updatedAt || new Date().toISOString(),
  };
};

/**
 * Map Recipient (database) to RecipientDto (API)
 */
const recipientToDto = (recipient: Recipient): RecipientDto => {
  return {
    recipientId: recipient.id, // Backend uses 'recipientId' not 'id'
    userId: recipient.userId,
    name: recipient.name,
    relationship: recipient.relationship,
    birthday: recipient.birthday,
    anniversary: recipient.anniversary,
    interests: recipient.hobbiesInterests || [],
    notes: recipient.notes,
    createdAt: recipient.createdAt,
    updatedAt: recipient.updatedAt,
  };
};

/**
 * Sort recipients by upcoming birthday (soonest first)
 * Recipients without birthdays are placed at the end
 */
const sortByUpcomingBirthday = (a: Recipient, b: Recipient): number => {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Calculate days until next birthday for recipient a
  const daysUntilA = a.birthday ? getDaysUntilBirthday(a.birthday, today, currentYear) : Infinity;

  // Calculate days until next birthday for recipient b
  const daysUntilB = b.birthday ? getDaysUntilBirthday(b.birthday, today, currentYear) : Infinity;

  return daysUntilA - daysUntilB;
};

/**
 * Calculate days until next birthday occurrence
 */
const getDaysUntilBirthday = (birthday: string, today: Date, currentYear: number): number => {
  const birthdayDate = new Date(birthday);
  const month = birthdayDate.getMonth();
  const day = birthdayDate.getDate();

  // Birthday this year
  const birthdayThisYear = new Date(currentYear, month, day);
  let daysUntil = Math.floor((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // If birthday already passed this year, calculate for next year
  if (daysUntil < 0) {
    const birthdayNextYear = new Date(currentYear + 1, month, day);
    daysUntil = Math.floor((birthdayNextYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  return daysUntil;
};
