import apiClient from '../api/apiClient';
import {
  Recipient,
  Occasion,
  GiftIdea,
  ApiResponse,
  ActionType,
} from '../../types/database.types';
import * as sqliteService from '../database/sqliteService';

/**
 * Fetch all data from backend API and update local SQLite database
 * Called on app launch when online
 *
 * @param userId - User ID to fetch data for
 */
export const fetchAllData = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Fetching all data from backend...');

    // Fetch all entities in parallel
    const [recipientsResponse, occasionsResponse, giftIdeasResponse] = await Promise.allSettled([
      apiClient.get<ApiResponse<Recipient[]>>('/api/recipients'),
      apiClient.get<ApiResponse<Occasion[]>>('/api/occasions'),
      apiClient.get<ApiResponse<GiftIdea[]>>('/api/giftideas'),
    ]);

    // Process recipients
    if (recipientsResponse.status === 'fulfilled') {
      const recipients = recipientsResponse.value.data.data;
      await sqliteService.upsertRecipients(recipients);
      console.log(`✅ Synced ${recipients.length} recipients`);
    } else {
      const error = recipientsResponse.reason;
      if (error?.response?.status === 404) {
        console.log('ℹ️ Recipients endpoint not yet implemented (will be created in Epic 2)');
      } else {
        console.warn('⚠️ Failed to fetch recipients:', error);
      }
    }

    // Process occasions
    if (occasionsResponse.status === 'fulfilled') {
      const occasions = occasionsResponse.value.data.data;
      await sqliteService.upsertOccasions(occasions);
      console.log(`✅ Synced ${occasions.length} occasions`);
    } else {
      const error = occasionsResponse.reason;
      if (error?.response?.status === 404) {
        console.log('ℹ️ Occasions endpoint not yet implemented (will be created in Epic 2)');
      } else {
        console.warn('⚠️ Failed to fetch occasions:', error);
      }
    }

    // Process gift ideas
    if (giftIdeasResponse.status === 'fulfilled') {
      const giftIdeas = giftIdeasResponse.value.data.data;
      await sqliteService.upsertGiftIdeas(giftIdeas);
      console.log(`✅ Synced ${giftIdeas.length} gift ideas`);
    } else {
      const error = giftIdeasResponse.reason;
      if (error?.response?.status === 404) {
        console.log('ℹ️ Gift ideas endpoint not yet implemented (will be created in Epic 3)');
      } else {
        console.warn('⚠️ Failed to fetch gift ideas:', error);
      }
    }

    console.log('✅ Initial data sync complete');
  } catch (error) {
    console.error('❌ Error fetching all data:', error);
    // Don't throw - allow app to continue with cached data
  }
};

/**
 * Sync a single action to the server
 *
 * @param actionType - CREATE, UPDATE, or DELETE
 * @param entityType - Recipient, Occasion, or GiftIdea
 * @param entityId - ID of the entity
 * @param payload - JSON payload (entity data for CREATE/UPDATE)
 * @returns Server response data
 */
export const syncToServer = async (
  actionType: ActionType,
  entityType: string,
  entityId: string,
  payload: string
): Promise<any> => {
  const endpoint = getEndpoint(entityType);
  const data = JSON.parse(payload);

  switch (actionType) {
    case 'CREATE':
      const createResponse = await apiClient.post<ApiResponse<any>>(endpoint, data);
      return createResponse.data.data;

    case 'UPDATE':
      const updateResponse = await apiClient.put<ApiResponse<any>>(
        `${endpoint}/${entityId}`,
        data
      );
      return updateResponse.data.data;

    case 'DELETE':
      await apiClient.delete(`${endpoint}/${entityId}`);
      return null;

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
};

/**
 * Get API endpoint for entity type
 */
const getEndpoint = (entityType: string): string => {
  switch (entityType) {
    case 'Recipient':
      return '/api/recipients';
    case 'Occasion':
      return '/api/occasions';
    case 'GiftIdea':
      return '/api/giftideas';
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
};

/**
 * Process the pending sync queue
 * Called when network reconnects
 */
export const processSyncQueue = async (): Promise<void> => {
  const pendingActions = await sqliteService.getPendingSyncActions();

  if (pendingActions.length === 0) {
    console.log('✅ No pending sync actions');
    return;
  }

  console.log(`🔄 Processing ${pendingActions.length} pending sync actions...`);

  for (const action of pendingActions) {
    try {
      await syncToServer(
        action.actionType,
        action.entityType,
        action.entityId,
        action.payload
      );
      await sqliteService.deleteSyncAction(action.id);
      console.log(
        `✅ Synced ${action.actionType} ${action.entityType} (${action.entityId})`
      );
    } catch (error) {
      console.error(
        `❌ Failed to sync ${action.actionType} ${action.entityType}:`,
        error
      );
      // Error handling is delegated to offlineQueue (retry logic)
    }
  }

  console.log('✅ Sync queue processing complete');
};
