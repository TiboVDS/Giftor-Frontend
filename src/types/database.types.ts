// Database types for offline persistence
// These mirror the backend entities with a subset of fields for mobile use

export interface Recipient {
  id: string; // Maps to Id (GUID) - primary key
  userId: string; // Foreign key to User.Id
  name: string;
  relationship: string;
  profilePictureUrl?: string; // URL to profile picture in Supabase Storage
  birthday?: string; // ISO date string
  anniversary?: string; // ISO date string
  hobbiesInterests: string[]; // Maps to Interests array
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Occasion {
  id: string; // Maps to Id (GUID) - primary key
  recipientId: string; // Foreign key to Recipient.Id
  userId: string; // Foreign key to User.Id
  name: string;
  type: string; // Occasion type (Birthday, Anniversary, etc.)
  date?: string; // ISO date string (yyyy-MM-dd), nullable for unscheduled
  reminderIntervals: number[]; // Days before occasion to send reminders, e.g., [14, 7, 2]
  isRecurring: boolean; // Derived from business logic (will be implemented later)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface GiftIdea {
  id: string; // Maps to Id (GUID) - primary key
  userId: string; // Foreign key to User.Id
  recipientId: string; // Foreign key to Recipient.Id
  occasionId?: string; // Foreign key to Occasion.Id, nullable for floating ideas
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
