import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OccasionsSection } from '@/features/recipients/components/OccasionsSection';
import { useOccasionStore } from '@/features/occasions/stores/occasionStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the stores and hooks
jest.mock('@/features/occasions/stores/occasionStore');
jest.mock('@/features/auth/stores/authStore');
jest.mock('@/hooks/useNetworkStatus');

const mockUseOccasionStore = useOccasionStore as jest.MockedFunction<typeof useOccasionStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;

describe('OccasionsSection', () => {
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

  it('shows empty state when no occasions', () => {
    mockUseOccasionStore.mockReturnValue({
      occasions: [],
      isLoading: false,
      error: null,
      fetchOccasions: jest.fn(),
    } as any);

    const { getByText } = render(
      <OccasionsSection recipientId="rec-1" />
    );

    expect(getByText('No occasions yet')).toBeTruthy();
    expect(getByText('Add birthdays, anniversaries, or custom occasions')).toBeTruthy();
  });

  it('renders OccasionCards when occasions are present', () => {
    mockUseOccasionStore.mockReturnValue({
      occasions: [
        {
          id: 'occ-1',
          recipientId: 'rec-1',
          userId: 'user-1',
          name: "Emma's Birthday",
          type: 'Birthday',
          date: '2025-06-15',
          isRecurring: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'occ-2',
          recipientId: 'rec-1',
          userId: 'user-1',
          name: "Christmas Gift",
          type: 'Holiday',
          date: '2025-12-25',
          isRecurring: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
      fetchOccasions: jest.fn(),
    } as any);

    const { getByText } = render(
      <OccasionsSection recipientId="rec-1" />
    );

    expect(getByText("Emma's Birthday")).toBeTruthy();
    expect(getByText("Christmas Gift")).toBeTruthy();
  });

  it('filters occasions by recipientId', () => {
    mockUseOccasionStore.mockReturnValue({
      occasions: [
        {
          id: 'occ-1',
          recipientId: 'rec-1',
          userId: 'user-1',
          name: "Emma's Special Day",
          type: 'Birthday',
          date: '2025-06-15',
          isRecurring: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'occ-2',
          recipientId: 'rec-2', // Different recipient
          userId: 'user-1',
          name: "Wedding Anniversary",
          type: 'Anniversary',
          date: '2025-07-20',
          isRecurring: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
      fetchOccasions: jest.fn(),
    } as any);

    const { getByText, queryByText } = render(
      <OccasionsSection recipientId="rec-1" />
    );

    expect(getByText("Emma's Special Day")).toBeTruthy();
    expect(queryByText("Wedding Anniversary")).toBeNull();
  });

  it('Add button navigates correctly', () => {
    mockUseOccasionStore.mockReturnValue({
      occasions: [],
      isLoading: false,
      error: null,
      fetchOccasions: jest.fn(),
    } as any);

    const { getByText } = render(
      <OccasionsSection recipientId="rec-1" />
    );

    const addButton = getByText('Add');
    fireEvent.press(addButton);

    expect(mockPush).toHaveBeenCalledWith('/add-occasion/rec-1');
  });

  it('shows loading state when fetching', () => {
    mockUseOccasionStore.mockReturnValue({
      occasions: [],
      isLoading: true,
      error: null,
      fetchOccasions: jest.fn(),
    } as any);

    const { getByText } = render(
      <OccasionsSection recipientId="rec-1" />
    );

    expect(getByText('Loading occasions...')).toBeTruthy();
  });

  it('shows error state when fetch fails', () => {
    mockUseOccasionStore.mockReturnValue({
      occasions: [],
      isLoading: false,
      error: 'Network error',
      fetchOccasions: jest.fn(),
    } as any);

    const { getByText } = render(
      <OccasionsSection recipientId="rec-1" />
    );

    expect(getByText("Couldn't load occasions")).toBeTruthy();
  });

  it('fetches occasions on mount', () => {
    const mockFetchOccasions = jest.fn();
    mockUseOccasionStore.mockReturnValue({
      occasions: [],
      isLoading: false,
      error: null,
      fetchOccasions: mockFetchOccasions,
    } as any);

    render(<OccasionsSection recipientId="rec-1" />);

    expect(mockFetchOccasions).toHaveBeenCalledWith('user-1', true);
  });
});
