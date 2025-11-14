import { Alert } from 'react-native';
import * as sqliteService from '../database/sqliteService';
import * as syncService from './syncService';
import { ActionType, EntityType } from '../../types/database.types';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s exponential backoff
const MAX_RETRY_DELAY = 30000; // 30s max delay

/**
 * Add an action to the pending sync queue
 *
 * @param actionType - CREATE, UPDATE, or DELETE
 * @param entityType - Recipient, Occasion, or GiftIdea
 * @param entityId - ID of the entity
 * @param payload - Entity data as object (will be stringified)
 */
export const addToQueue = async (
  actionType: ActionType,
  entityType: EntityType,
  entityId: string,
  payload: any
): Promise<void> => {
  try {
    await sqliteService.insertSyncAction(
      actionType,
      entityType,
      entityId,
      JSON.stringify(payload)
    );
    console.log(
      `📝 Queued ${actionType} ${entityType} (${entityId}) for sync when online`
    );
  } catch (error) {
    console.error('❌ Failed to add action to sync queue:', error);
    throw error;
  }
};

/**
 * Process the entire sync queue with retry logic
 * Called when network reconnects
 */
export const processQueue = async (): Promise<void> => {
  const pendingActions = await sqliteService.getPendingSyncActions();

  if (pendingActions.length === 0) {
    console.log('✅ No pending sync actions to process');
    return;
  }

  console.log(`🔄 Processing ${pendingActions.length} pending sync actions...`);

  for (const action of pendingActions) {
    let success = false;
    let lastError: any = null;

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Attempt to sync to server
        const serverData = await syncService.syncToServer(
          action.actionType,
          action.entityType,
          action.entityId,
          action.payload
        );

        // Success: Update local SQLite with server response (if applicable)
        if (serverData && action.actionType !== 'DELETE') {
          await updateLocalDatabase(action.entityType, serverData);
        }

        // Remove from queue
        await sqliteService.deleteSyncAction(action.id);
        console.log(
          `✅ Successfully synced ${action.actionType} ${action.entityType} (${action.entityId})`
        );
        success = true;
        break;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `⚠️ Sync attempt ${attempt + 1}/${MAX_RETRIES + 1} failed for ${
            action.actionType
          } ${action.entityType}:`,
          error.message
        );

        // Handle specific error cases
        if (error.response?.status === 404) {
          // Entity deleted on server - remove from queue
          await sqliteService.deleteSyncAction(action.id);
          await handleConflict('deleted', action.entityType, action.entityId);
          success = true; // Treated as "resolved" conflict
          break;
        } else if (error.response?.status === 409) {
          // Conflict - server has newer data
          await sqliteService.deleteSyncAction(action.id);
          await handleConflict('conflict', action.entityType, action.entityId);
          success = true; // Treated as "resolved" conflict
          break;
        }

        // Increment retry count
        await sqliteService.incrementSyncActionRetryCount(action.id);

        // Wait before retrying (exponential backoff)
        if (attempt < MAX_RETRIES) {
          const delay = Math.min(
            RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1],
            MAX_RETRY_DELAY
          );
          await sleep(delay);
        }
      }
    }

    // After max retries, mark as failed and alert user
    if (!success) {
      console.error(
        `❌ Failed to sync ${action.actionType} ${action.entityType} after ${
          MAX_RETRIES + 1
        } attempts`
      );
      await sqliteService.deleteSyncAction(action.id); // Remove from queue to prevent infinite retries
      Alert.alert(
        'Sync Failed',
        `Unable to sync ${action.actionType.toLowerCase()} for ${action.entityType}. Some changes may be lost.`,
        [{ text: 'OK' }]
      );
    }
  }

  console.log('✅ Sync queue processing complete');
};

/**
 * Handle conflict resolution
 *
 * @param conflictType - 'deleted' or 'conflict'
 * @param entityType - Entity type
 * @param entityId - Entity ID
 */
const handleConflict = async (
  conflictType: 'deleted' | 'conflict',
  entityType: string,
  entityId: string
): Promise<void> => {
  if (conflictType === 'deleted') {
    // Entity was deleted on server - delete from local SQLite
    console.log(`🗑️ Entity deleted on server: ${entityType} (${entityId})`);
    await deleteFromLocalDatabase(entityType, entityId);
  } else if (conflictType === 'conflict') {
    // Conflict detected - server wins (last-write-wins strategy)
    console.warn(
      `⚠️ Conflict detected for ${entityType} (${entityId}) - accepting server state`
    );
    Alert.alert(
      'Sync Conflict',
      'Some changes couldn\'t be synced. Data has been updated from the server.',
      [{ text: 'OK' }]
    );
    // Refresh from server will happen on next fetchAllData call
  }
};

/**
 * Update local SQLite database with server response
 */
const updateLocalDatabase = async (
  entityType: string,
  serverData: any
): Promise<void> => {
  switch (entityType) {
    case 'Recipient':
      await sqliteService.updateRecipient(serverData);
      break;
    case 'Occasion':
      await sqliteService.updateOccasion(serverData);
      break;
    case 'GiftIdea':
      await sqliteService.updateGiftIdea(serverData);
      break;
    default:
      console.warn(`Unknown entity type: ${entityType}`);
  }
};

/**
 * Delete entity from local SQLite database
 */
const deleteFromLocalDatabase = async (
  entityType: string,
  entityId: string
): Promise<void> => {
  switch (entityType) {
    case 'Recipient':
      await sqliteService.deleteRecipient(entityId);
      break;
    case 'Occasion':
      await sqliteService.deleteOccasion(entityId);
      break;
    case 'GiftIdea':
      await sqliteService.deleteGiftIdea(entityId);
      break;
    default:
      console.warn(`Unknown entity type: ${entityType}`);
  }
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
