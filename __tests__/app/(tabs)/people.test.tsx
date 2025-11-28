import { render, screen, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import PeopleScreen from '@/app/(tabs)/people';
import { useRecipientStore } from '@/features/recipients/stores/recipientStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Mock dependencies
jest.mock('@/features/recipients/stores/recipientStore');
jest.mock('@/features/auth/stores/authStore');
jest.mock('@/hooks/useNetworkStatus');

// Mock expo-router with a proper useFocusEffect that uses useEffect internally
jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return {
    useRouter: () => ({
      push: jest.fn(),
      back: jest.fn(),
    }),
    // Implement useFocusEffect as a useEffect wrapper that runs callback once
    useFocusEffect: (callback: () => void | (() => void)) => {
      useEffect(() => {
        const cleanup = callback();
        return typeof cleanup === 'function' ? cleanup : undefined;
        // Empty deps = run once on mount, matching focus behavior
      }, []);
    },
  };
});

// Mock components
jest.mock('@/features/recipients/components/RecipientSearchBar', () => ({
  RecipientSearchBar: () => null,
}));
jest.mock('@/features/recipients/components/RecipientSortMenu', () => ({
  RecipientSortMenu: () => null,
}));
jest.mock('@/features/recipients/components/RecipientList', () => ({
  RecipientList: () => null,
}));
jest.mock('@/components/ui/EmptyState', () => {
  const { Text } = require('react-native');
  return {
    EmptyState: ({ title, message }: any) => (
      <>
        <Text>{title}</Text>
        <Text>{message}</Text>
      </>
    ),
  };
});

const mockedUseRecipientStore = useRecipientStore as jest.MockedFunction<
  typeof useRecipientStore
>;
const mockedUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockedUseNetworkStatus = useNetworkStatus as jest.MockedFunction<
  typeof useNetworkStatus
>;

describe('PeopleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockedUseRecipientStore.mockReturnValue({
      recipients: [],
      isLoading: false,
      isSyncing: false,
      error: null,
      searchQuery: '',
      sortOption: 'name-asc' as any,
      filteredRecipients: jest.fn(() => []),
      fetchRecipients: jest.fn().mockResolvedValue(undefined),
      createRecipient: jest.fn(),
      updateRecipient: jest.fn(),
      deleteRecipient: jest.fn(),
      clearRecipients: jest.fn(),
      setSearchQuery: jest.fn(),
      setSortOption: jest.fn(),
    });

    mockedUseAuthStore.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      session: null,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      restoreSession: jest.fn(),
    });

    mockedUseNetworkStatus.mockReturnValue({
      isOnline: true,
      isConnected: true,
    });
  });

  it('renders with correct header', async () => {
    render(<PeopleScreen />);

    // Wait for async state updates to settle
    await waitFor(() => {
      expect(screen.getByText('People')).toBeTruthy();
    });
  });

  it('displays placeholder text when no recipients', async () => {
    render(<PeopleScreen />);

    // Wait for loading to complete and empty state to render
    await waitFor(() => {
      expect(screen.getByText('No recipients yet')).toBeTruthy();
    });
  });

  it('displays add button', async () => {
    const { getByLabelText } = render(<PeopleScreen />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(getByLabelText('Add recipient')).toBeTruthy();
    });
  });
});
