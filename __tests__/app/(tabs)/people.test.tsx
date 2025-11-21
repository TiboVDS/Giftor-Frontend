import { render, screen } from '@testing-library/react-native';
import PeopleScreen from '@/app/(tabs)/people';
import { useRecipientStore } from '@/features/recipients/stores/recipientStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Mock dependencies
jest.mock('@/features/recipients/stores/recipientStore');
jest.mock('@/features/auth/stores/authStore');
jest.mock('@/hooks/useNetworkStatus');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback) => {
    // Call the callback immediately in tests
    callback();
  }),
}));

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
      fetchRecipients: jest.fn(),
      createRecipient: jest.fn(),
      updateRecipient: jest.fn(),
      deleteRecipient: jest.fn(),
      clearRecipients: jest.fn(),
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

  it('renders with correct header', () => {
    render(<PeopleScreen />);
    expect(screen.getByText('Your Recipients')).toBeTruthy();
  });

  it('displays placeholder text when no recipients', () => {
    render(<PeopleScreen />);
    expect(screen.getByText('No recipients yet')).toBeTruthy();
  });

  it('displays add button', () => {
    const { getByLabelText } = render(<PeopleScreen />);
    expect(getByLabelText('Add recipient')).toBeTruthy();
  });
});
