import apiClient from '../../../services/api/apiClient';
import {
  RecipientDto,
  CreateRecipientRequest,
  UpdateRecipientRequest,
  ApiResponse,
} from '../types/recipient.types';

/**
 * Create a new recipient
 * POST /api/recipients
 */
export const createRecipient = async (
  data: CreateRecipientRequest
): Promise<RecipientDto> => {
  const response = await apiClient.post<ApiResponse<RecipientDto>>(
    '/api/recipients',
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.error?.message || 'Failed to create recipient'
    );
  }

  return response.data.data;
};

/**
 * Fetch all recipients for authenticated user
 * GET /api/recipients
 */
export const fetchRecipients = async (): Promise<RecipientDto[]> => {
  const response = await apiClient.get<ApiResponse<RecipientDto[]>>(
    '/api/recipients'
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.error?.message || 'Failed to fetch recipients'
    );
  }

  return response.data.data;
};

/**
 * Fetch a single recipient by ID
 * GET /api/recipients/{id}
 */
export const fetchRecipientById = async (id: string): Promise<RecipientDto> => {
  const response = await apiClient.get<ApiResponse<RecipientDto>>(
    `/api/recipients/${id}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.error?.message || 'Failed to fetch recipient'
    );
  }

  return response.data.data;
};

/**
 * Update an existing recipient
 * PUT /api/recipients/{id}
 */
export const updateRecipient = async (
  id: string,
  data: UpdateRecipientRequest
): Promise<RecipientDto> => {
  const response = await apiClient.put<ApiResponse<RecipientDto>>(
    `/api/recipients/${id}`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.error?.message || 'Failed to update recipient'
    );
  }

  return response.data.data;
};

/**
 * Delete a recipient
 * DELETE /api/recipients/{id}
 */
export const deleteRecipient = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/recipients/${id}`);
  // DELETE returns 204 No Content, no response body to check
};
