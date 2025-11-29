import { renderHook } from '@testing-library/react-native';
import { useUpcomingOccasions } from '@/features/occasions/hooks/useUpcomingOccasions';
import { useOccasionStore } from '@/features/occasions/stores/occasionStore';
import { useRecipientStore } from '@/features/recipients/stores/recipientStore';
import { useGiftIdeaStore } from '@/features/gift-ideas/stores/giftIdeaStore';
import { Occasion, Recipient, GiftIdea } from '@/types/database.types';

// Mock the stores
jest.mock('@/features/occasions/stores/occasionStore');
jest.mock('@/features/recipients/stores/recipientStore');
jest.mock('@/features/gift-ideas/stores/giftIdeaStore');

const mockUseOccasionStore = useOccasionStore as jest.MockedFunction<typeof useOccasionStore>;
const mockUseRecipientStore = useRecipientStore as jest.MockedFunction<typeof useRecipientStore>;
const mockUseGiftIdeaStore = useGiftIdeaStore as jest.MockedFunction<typeof useGiftIdeaStore>;

// Get today's date for setting up test dates
const today = new Date();
today.setHours(0, 0, 0, 0);

// Helper to create date strings relative to today
const getDateString = (daysFromNow: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

const mockOccasions: Occasion[] = [
  {
    id: 'occ-1',
    recipientId: 'rec-1',
    userId: 'user-1',
    name: "Emma's Birthday",
    type: 'Birthday',
    date: getDateString(5), // 5 days from now
    reminderIntervals: [14, 7, 2],
    isRecurring: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occ-2',
    recipientId: 'rec-2',
    userId: 'user-1',
    name: 'Anniversary',
    type: 'Anniversary',
    date: getDateString(15), // 15 days from now
    reminderIntervals: [14, 7, 2],
    isRecurring: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occ-3',
    recipientId: 'rec-1',
    userId: 'user-1',
    name: 'Holiday Gift',
    type: 'Holiday',
    date: getDateString(45), // 45 days from now (outside 30-day window)
    reminderIntervals: [14, 7, 2],
    isRecurring: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'occ-4',
    recipientId: 'rec-2',
    userId: 'user-1',
    name: 'No Date Event',
    type: 'Custom',
    date: undefined, // No date
    reminderIntervals: [14, 7, 2],
    isRecurring: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockRecipients: Recipient[] = [
  {
    id: 'rec-1',
    userId: 'user-1',
    name: 'Emma',
    relationship: 'Friend',
    hobbiesInterests: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rec-2',
    userId: 'user-1',
    name: 'John',
    relationship: 'Family',
    hobbiesInterests: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockGiftIdeas: GiftIdea[] = [
  {
    id: 'gift-1',
    userId: 'user-1',
    recipientId: 'rec-1',
    occasionId: 'occ-1',
    giftText: 'Flowers',
    currency: 'EUR',
    isPurchased: false,
    capturedAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gift-2',
    userId: 'user-1',
    recipientId: 'rec-1',
    occasionId: 'occ-1',
    giftText: 'Book',
    currency: 'EUR',
    isPurchased: false,
    capturedAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gift-3',
    userId: 'user-1',
    recipientId: 'rec-2',
    occasionId: 'occ-2',
    giftText: 'Watch',
    currency: 'EUR',
    isPurchased: false,
    capturedAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('useUpcomingOccasions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseOccasionStore.mockReturnValue({
      occasions: mockOccasions,
      isLoading: false,
      isSyncing: false,
      error: null,
      getUpcomingOccasions: (daysAhead = 30) => {
        return mockOccasions
          .filter((o) => {
            if (!o.date) return false;
            const occasionDate = new Date(o.date);
            const diff = Math.floor(
              (occasionDate.getTime() - today.getTime()) / 86400000
            );
            return diff >= 0 && diff <= daysAhead;
          })
          .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
      },
      fetchOccasions: jest.fn(),
      createOccasion: jest.fn(),
      updateOccasion: jest.fn(),
      deleteOccasion: jest.fn(),
      clearOccasions: jest.fn(),
    });

    mockUseRecipientStore.mockReturnValue({
      recipients: mockRecipients,
      isLoading: false,
      isSyncing: false,
      error: null,
      fetchRecipients: jest.fn(),
      createRecipient: jest.fn(),
      updateRecipient: jest.fn(),
      deleteRecipient: jest.fn(),
      clearRecipients: jest.fn(),
    });

    mockUseGiftIdeaStore.mockReturnValue({
      giftIdeas: mockGiftIdeas,
      isLoading: false,
      isSyncing: false,
      error: null,
      fetchGiftIdeas: jest.fn(),
      createGiftIdea: jest.fn(),
      updateGiftIdea: jest.fn(),
      deleteGiftIdea: jest.fn(),
      clearGiftIdeas: jest.fn(),
    });
  });

  it('returns upcoming occasions sorted by date', () => {
    const { result } = renderHook(() => useUpcomingOccasions());

    expect(result.current.upcomingOccasions).toHaveLength(2); // Only 2 within 30 days
    expect(result.current.upcomingOccasions[0].occasion.id).toBe('occ-1'); // 5 days first
    expect(result.current.upcomingOccasions[1].occasion.id).toBe('occ-2'); // 15 days second
  });

  it('returns empty array when no upcoming occasions', () => {
    mockUseOccasionStore.mockReturnValue({
      ...mockUseOccasionStore(),
      occasions: [],
      getUpcomingOccasions: () => [],
    });

    const { result } = renderHook(() => useUpcomingOccasions());

    expect(result.current.upcomingOccasions).toHaveLength(0);
    expect(result.current.isEmpty).toBe(true);
  });

  it('includes recipient names correctly', () => {
    const { result } = renderHook(() => useUpcomingOccasions());

    expect(result.current.upcomingOccasions[0].recipientName).toBe('Emma');
    expect(result.current.upcomingOccasions[1].recipientName).toBe('John');
  });

  it('includes gift ideas count correctly', () => {
    const { result } = renderHook(() => useUpcomingOccasions());

    // occ-1 has 2 gift ideas, occ-2 has 1
    expect(result.current.upcomingOccasions[0].giftIdeasCount).toBe(2);
    expect(result.current.upcomingOccasions[1].giftIdeasCount).toBe(1);
  });

  it('returns loading state when any store is loading', () => {
    mockUseOccasionStore.mockReturnValue({
      ...mockUseOccasionStore(),
      isLoading: true,
    });

    const { result } = renderHook(() => useUpcomingOccasions());

    expect(result.current.isLoading).toBe(true);
  });

  it('returns error from occasion store', () => {
    mockUseOccasionStore.mockReturnValue({
      ...mockUseOccasionStore(),
      error: 'Failed to fetch occasions',
    });

    const { result } = renderHook(() => useUpcomingOccasions());

    expect(result.current.error).toBe('Failed to fetch occasions');
  });

  it('isEmpty is false when occasions exist', () => {
    const { result } = renderHook(() => useUpcomingOccasions());

    expect(result.current.isEmpty).toBe(false);
  });

  it('handles unknown recipient gracefully', () => {
    mockUseRecipientStore.mockReturnValue({
      ...mockUseRecipientStore(),
      recipients: [], // No recipients
    });

    const { result } = renderHook(() => useUpcomingOccasions());

    expect(result.current.upcomingOccasions[0].recipientName).toBe('Unknown');
  });

  it('excludes occasions without dates', () => {
    const { result } = renderHook(() => useUpcomingOccasions());

    // occ-4 has no date, should not be included
    const occasionIds = result.current.upcomingOccasions.map((d) => d.occasion.id);
    expect(occasionIds).not.toContain('occ-4');
  });

  it('excludes occasions outside the days ahead window', () => {
    const { result } = renderHook(() => useUpcomingOccasions());

    // occ-3 is 45 days away, outside default 30-day window
    const occasionIds = result.current.upcomingOccasions.map((d) => d.occasion.id);
    expect(occasionIds).not.toContain('occ-3');
  });
});
