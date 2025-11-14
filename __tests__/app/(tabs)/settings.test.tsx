import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SettingsScreen from '@/app/(tabs)/settings';
import { useAuthStore } from '@/features/auth/stores/authStore';

// Mock the auth store
jest.mock('@/features/auth/stores/authStore');

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock safe area insets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('SettingsScreen', () => {
  const mockLogout = jest.fn();
  const mockUser = {
    id: 'test-user-id-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
  });

  it('renders with correct header', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('displays user email from auth store', () => {
    render(<SettingsScreen />);
    expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0);
  });

  it('displays user ID', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('test-user-id-123')).toBeTruthy();
  });

  it('displays placeholder text "More settings coming soon"', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('More settings coming soon')).toBeTruthy();
  });

  it('displays logout button', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Logout')).toBeTruthy();
  });

  it('shows confirmation alert when logout button is pressed', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    render(<SettingsScreen />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.press(logoutButton);

    expect(alertSpy).toHaveBeenCalledWith(
      'Logout',
      'Are you sure you want to logout?',
      expect.any(Array)
    );
  });

  it('calls logout and redirects on confirmation', async () => {
    mockLogout.mockResolvedValue(undefined);

    // Mock Alert.alert to automatically call the onPress of "Logout" option
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    render(<SettingsScreen />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('matches snapshot', () => {
    const tree = render(<SettingsScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
