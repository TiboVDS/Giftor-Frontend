import { renderHook, waitFor } from '@testing-library/react-native';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import NetInfo from '@react-native-community/netinfo';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return online status when connected', async () => {
    const mockNetInfoState = {
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    };

    (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(jest.fn());

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.connectionType).toBe('wifi');
    });
  });

  it('should return offline status when disconnected', async () => {
    const mockNetInfoState = {
      isConnected: false,
      isInternetReachable: false,
      type: 'none',
    };

    (NetInfo.fetch as jest.Mock).mockResolvedValue(mockNetInfoState);
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(jest.fn());

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.connectionType).toBe('none');
    });
  });

  it('should subscribe to network changes', () => {
    const mockUnsubscribe = jest.fn();
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(mockUnsubscribe);
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });

    const { unmount } = renderHook(() => useNetworkStatus());

    expect(NetInfo.addEventListener).toHaveBeenCalled();

    // Cleanup should unsubscribe
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should update when network state changes', async () => {
    let networkChangeCallback: any;

    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkChangeCallback = callback;
      return jest.fn();
    });

    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });

    const { result } = renderHook(() => useNetworkStatus());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });

    // Simulate network disconnection
    networkChangeCallback({
      isConnected: false,
      isInternetReachable: false,
      type: 'none',
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
      expect(result.current.connectionType).toBe('none');
    });
  });
});
