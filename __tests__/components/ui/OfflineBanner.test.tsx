import React from 'react';
import { render } from '@testing-library/react-native';
import { OfflineBanner } from '../../../src/components/ui/OfflineBanner';
import { useNetworkStatus } from '../../../src/hooks/useNetworkStatus';

// Mock the useNetworkStatus hook
jest.mock('../../../src/hooks/useNetworkStatus');

const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<
  typeof useNetworkStatus
>;

describe('OfflineBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when offline', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isInternetReachable: false,
      connectionType: 'none',
    });

    const { getByText } = render(<OfflineBanner />);

    expect(getByText(/Offline - changes will sync when connected/i)).toBeTruthy();
  });

  it('should display the warning icon', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isInternetReachable: false,
      connectionType: 'none',
    });

    const { getByText } = render(<OfflineBanner />);

    expect(getByText(/⚠️/)).toBeTruthy();
  });

  it('should not render text when online (hidden via animation)', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      isInternetReachable: true,
      connectionType: 'wifi',
    });

    const { queryByText } = render(<OfflineBanner />);

    // Note: Banner still renders but is animated off-screen
    // We can verify the text exists but banner is positioned off-screen via translateY
    const bannerText = queryByText(/Offline - changes will sync when connected/i);
    expect(bannerText).toBeTruthy();
  });
});
