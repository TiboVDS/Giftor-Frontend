// Database types for offline persistence
// These mirror the backend entities with a subset of fields for mobile use

export interface Recipient {
  id: string; // Maps to RecipientId (GUID)
  userId: string; // Maps to UserId (GUID)
  name: string;
  relationship: string;
  birthday?: string; // ISO date string
  anniversary?: string; // ISO date string
  hobbiesInterests: string[]; // Maps to Interests array
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Occasion {
  id: string; // Maps to OccasionId (GUID)
  recipientId: string; // Maps to RecipientId (GUID)
  userId: string; // Maps to UserId (GUID)
  name: string;
  occasionType: string;
  date?: string; // Maps to OccasionDate, ISO date string, nullable for unscheduled
  isRecurring: boolean; // Derived from business logic (will be implemented later)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface GiftIdea {
  id: string; // Maps to GiftIdeaId (GUID)
  userId: string; // Maps to UserId (GUID)
  recipientId: string; // Maps to RecipientId (GUID)
  occasionId?: string; // Maps to OccasionId (GUID), nullable for floating ideas
  giftText: string; // Maps to IdeaText
  notes?: string;
  productTitle?: string; // Will be enriched from product API (future)
  estimatedPrice?: number;
  currency: string;
  productImageUrl?: string;
  shoppingLink?: string;
  isPurchased: boolean;
  capturedAt: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';
export type EntityType = 'Recipient' | 'Occasion' | 'GiftIdea';

export interface PendingSyncAction {
  id: number; // Auto-increment local ID
  actionType: ActionType;
  entityType: EntityType;
  entityId: string; // GUID of the entity being synced
  payload: string; // JSON string of the entity data
  timestamp: string; // ISO date string
  retryCount: number;
}

// API Response format (standardized across all backend endpoints)
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
  };
}
