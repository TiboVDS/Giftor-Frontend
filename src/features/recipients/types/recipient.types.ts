// Recipient types for API integration
// These match the backend RecipientDto contract exactly

/**
 * Recipient response from backend (RecipientDto)
 * Returned by GET /api/recipients and POST /api/recipients
 */
export interface RecipientDto {
  id: string; // UUID from backend (primary key)
  userId: string; // UUID from backend
  name: string;
  relationship: string; // Family, Friend, Colleague, Other, Unknown
  profilePictureUrl?: string; // Optional URL
  birthday?: string; // ISO date string (date only, no time)
  anniversary?: string; // ISO date string (date only, no time)
  interests: string[]; // Array of interest tags
  notes?: string; // Optional multiline text
  createdAt?: string; // ISO timestamp from backend
  updatedAt?: string; // ISO timestamp from backend
}

/**
 * Request DTO for creating a new recipient
 * Used by POST /api/recipients
 */
export interface CreateRecipientRequest {
  name: string; // Required
  relationship?: string; // Optional - defaults to "Unknown" if not provided
  profilePictureUrl?: string; // Optional URL
  birthday?: string; // Optional ISO date string
  anniversary?: string; // Optional ISO date string
  interests: string[]; // Required array (can be empty)
  notes?: string; // Optional multiline text
}

/**
 * Request DTO for updating an existing recipient
 * Used by PUT /api/recipients/{id}
 */
export interface UpdateRecipientRequest {
  name: string; // Required
  relationship?: string; // Optional - defaults to "Unknown" if not provided
  profilePictureUrl?: string; // Optional URL
  birthday?: string; // Optional ISO date string
  anniversary?: string; // Optional ISO date string
  interests: string[]; // Required array (can be empty)
  notes?: string; // Optional multiline text
}

/**
 * API response wrapper format
 * Backend wraps all responses in ApiResponse<T>
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string; // e.g., "VALIDATION_ERROR", "NOT_FOUND"
    message: string; // Human-readable message
    details?: Record<string, string[]>; // Field-level validation errors
  };
}

/**
 * Relationship options for dropdown
 */
export const RELATIONSHIP_OPTIONS = [
  { label: 'Family', value: 'Family' },
  { label: 'Friend', value: 'Friend' },
  { label: 'Colleague', value: 'Colleague' },
  { label: 'Other', value: 'Other' },
  { label: 'Unknown', value: 'Unknown' },
] as const;

export type RelationshipType = typeof RELATIONSHIP_OPTIONS[number]['value'];
