import * as recipientService from '@/features/recipients/services/recipientService';
import apiClient from '@/services/api/apiClient';
import { CreateRecipientRequest, RecipientDto } from '@/features/recipients/types/recipient.types';

// Mock apiClient
jest.mock('@/services/api/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('recipientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRecipient', () => {
    it('should send correct payload to POST /api/recipients', async () => {
      const requestData: CreateRecipientRequest = {
        name: 'Emma Johnson',
        relationship: 'Friend',
        interests: ['cooking', 'hiking'],
        notes: 'Met at tech meetup',
      };

      const responseData: RecipientDto = {
        id: 'abc-123',
        userId: 'user-123',
        name: 'Emma Johnson',
        relationship: 'Friend',
        interests: ['cooking', 'hiking'],
        notes: 'Met at tech meetup',
      };

      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: responseData,
        },
      } as any);

      const result = await recipientService.createRecipient(requestData);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/recipients',
        requestData
      );
      expect(result).toEqual(responseData);
    });

    it('should unwrap ApiResponse and return RecipientDto', async () => {
      const responseData: RecipientDto = {
        id: 'abc-123',
        userId: 'user-123',
        name: 'John Doe',
        relationship: 'Family',
        interests: [],
      };

      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: responseData,
        },
      } as any);

      const result = await recipientService.createRecipient({
        name: 'John Doe',
        interests: [],
      });

      expect(result).toEqual(responseData);
      expect(result.id).toBe('abc-123');
    });

    it('should throw error if response.success is false', async () => {
      mockedApiClient.post.mockResolvedValue({
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name is required',
          },
        },
      } as any);

      await expect(
        recipientService.createRecipient({ name: '', interests: [] })
      ).rejects.toThrow('Name is required');
    });
  });

  describe('fetchRecipients', () => {
    it('should fetch all recipients from GET /api/recipients', async () => {
      const recipients: RecipientDto[] = [
        {
          id: '1',
          userId: 'user-123',
          name: 'Alice',
          relationship: 'Friend',
          interests: [],
        },
        {
          id: '2',
          userId: 'user-123',
          name: 'Bob',
          relationship: 'Family',
          interests: ['sports'],
        },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: recipients,
        },
      } as any);

      const result = await recipientService.fetchRecipients();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/recipients');
      expect(result).toEqual(recipients);
      expect(result).toHaveLength(2);
    });

    it('should throw error if response.success is false', async () => {
      mockedApiClient.get.mockResolvedValue({
        data: {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Recipients not found',
          },
        },
      } as any);

      await expect(recipientService.fetchRecipients()).rejects.toThrow(
        'Recipients not found'
      );
    });
  });
});
