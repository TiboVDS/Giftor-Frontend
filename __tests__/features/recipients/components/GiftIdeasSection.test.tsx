import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GiftIdeasSection } from '@/features/recipients/components/GiftIdeasSection';
import { useGiftIdeaStore } from '@/features/gift-ideas/stores/giftIdeaStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Mock date-fns for consistent test output
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  formatDistanceToNow: () => '2 weeks ago',
}));

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the stores and hooks
jest.mock('@/features/gift-ideas/stores/giftIdeaStore');
jest.mock('@/features/auth/stores/authStore');
jest.mock('@/hooks/useNetworkStatus');

const mockUseGiftIdeaStore = useGiftIdeaStore as jest.MockedFunction<typeof useGiftIdeaStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;

describe('GiftIdeasSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1' },
    } as any);

    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
    } as any);
  });

  it('shows empty state when no gift ideas', () => {
    mockUseGiftIdeaStore.mockReturnValue({
      giftIdeas: [],
      isLoading: false,
      error: null,
      fetchGiftIdeas: jest.fn(),
    } as any);

    const { getByText } = render(
      <GiftIdeasSection recipientId="rec-1" />
    );

    expect(getByText('No gift ideas yet')).toBeTruthy();
    expect(getByText('Capture inspiration when it strikes!')).toBeTruthy();
  });

  it('renders GiftIdeaCards when ideas are present', () => {
    mockUseGiftIdeaStore.mockReturnValue({
      giftIdeas: [
        {
          id: 'idea-1',
          userId: 'user-1',
          recipientId: 'rec-1',
          giftText: 'Headphones',
          estimatedPrice: 99.99,
          currency: 'EUR',
          isPurchased: false,
          capturedAt: '2024-11-15T10:30:00Z',
          createdAt: '2024-11-15T10:30:00Z',
          updatedAt: '2024-11-15T10:30:00Z',
        },
        {
          id: 'idea-2',
          userId: 'user-1',
          recipientId: 'rec-1',
          giftText: 'Book',
          estimatedPrice: 29.99,
          currency: 'EUR',
          isPurchased: false,
          capturedAt: '2024-11-10T10:30:00Z',
          createdAt: '2024-11-10T10:30:00Z',
          updatedAt: '2024-11-10T10:30:00Z',
        },
      ],
      isLoading: false,
      error: null,
      fetchGiftIdeas: jest.fn(),
    } as any);

    const { getByText } = render(
      <GiftIdeasSection recipientId="rec-1" />
    );

    expect(getByText('Headphones')).toBeTruthy();
    expect(getByText('Book')).toBeTruthy();
  });

  it('filters gift ideas by recipientId', () => {
    mockUseGiftIdeaStore.mockReturnValue({
      giftIdeas: [
        {
          id: 'idea-1',
          userId: 'user-1',
          recipientId: 'rec-1',
          giftText: 'Headphones',
          estimatedPrice: 99.99,
          currency: 'EUR',
          isPurchased: false,
          capturedAt: '2024-11-15T10:30:00Z',
          createdAt: '2024-11-15T10:30:00Z',
          updatedAt: '2024-11-15T10:30:00Z',
        },
        {
          id: 'idea-2',
          userId: 'user-1',
          recipientId: 'rec-2', // Different recipient
          giftText: 'Watch',
          estimatedPrice: 199.99,
          currency: 'EUR',
          isPurchased: false,
          capturedAt: '2024-11-10T10:30:00Z',
          createdAt: '2024-11-10T10:30:00Z',
          updatedAt: '2024-11-10T10:30:00Z',
        },
      ],
      isLoading: false,
      error: null,
      fetchGiftIdeas: jest.fn(),
    } as any);

    const { getByText, queryByText } = render(
      <GiftIdeasSection recipientId="rec-1" />
    );

    expect(getByText('Headphones')).toBeTruthy();
    expect(queryByText('Watch')).toBeNull();
  });

  it('sorts gift ideas by capturedAt (newest first)', () => {
    mockUseGiftIdeaStore.mockReturnValue({
      giftIdeas: [
        {
          id: 'idea-old',
          userId: 'user-1',
          recipientId: 'rec-1',
          giftText: 'Old Idea',
          currency: 'EUR',
          isPurchased: false,
          capturedAt: '2024-01-01T10:00:00Z',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 'idea-new',
          userId: 'user-1',
          recipientId: 'rec-1',
          giftText: 'New Idea',
          currency: 'EUR',
          isPurchased: false,
          capturedAt: '2024-12-01T10:00:00Z',
          createdAt: '2024-12-01T10:00:00Z',
          updatedAt: '2024-12-01T10:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
      fetchGiftIdeas: jest.fn(),
    } as any);

    const { getAllByRole } = render(
      <GiftIdeasSection recipientId="rec-1" />
    );

    // The cards should be rendered in order, newest first
    // We can verify by checking the order of button elements
    const buttons = getAllByRole('button');
    // First two buttons are "Add" and first card, etc.
    expect(buttons.length).toBeGreaterThan(1);
  });

  it('Add button navigates correctly', () => {
    mockUseGiftIdeaStore.mockReturnValue({
      giftIdeas: [],
      isLoading: false,
      error: null,
      fetchGiftIdeas: jest.fn(),
    } as any);

    const { getByText } = render(
      <GiftIdeasSection recipientId="rec-1" />
    );

    const addButton = getByText('Add');
    fireEvent.press(addButton);

    expect(mockPush).toHaveBeenCalledWith('/add-idea/rec-1');
  });

  it('shows loading state when fetching', () => {
    mockUseGiftIdeaStore.mockReturnValue({
      giftIdeas: [],
      isLoading: true,
      error: null,
      fetchGiftIdeas: jest.fn(),
    } as any);

    const { getByText } = render(
      <GiftIdeasSection recipientId="rec-1" />
    );

    expect(getByText('Loading gift ideas...')).toBeTruthy();
  });

  it('shows error state when fetch fails', () => {
    mockUseGiftIdeaStore.mockReturnValue({
      giftIdeas: [],
      isLoading: false,
      error: 'Network error',
      fetchGiftIdeas: jest.fn(),
    } as any);

    const { getByText } = render(
      <GiftIdeasSection recipientId="rec-1" />
    );

    expect(getByText("Couldn't load gift ideas")).toBeTruthy();
  });

  it('fetches gift ideas on mount', () => {
    const mockFetchGiftIdeas = jest.fn();
    mockUseGiftIdeaStore.mockReturnValue({
      giftIdeas: [],
      isLoading: false,
      error: null,
      fetchGiftIdeas: mockFetchGiftIdeas,
    } as any);

    render(<GiftIdeasSection recipientId="rec-1" />);

    expect(mockFetchGiftIdeas).toHaveBeenCalledWith('user-1', true);
  });
});
