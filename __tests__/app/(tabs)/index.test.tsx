import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)/index';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Get today's date for setting up test dates
const today = new Date();
today.setHours(0, 0, 0, 0);

// Helper to create date strings relative to today
const getDateString = (daysFromNow: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

const mockUpcomingOccasions = [
  {
    occasion: {
      id: 'occ-1',
      recipientId: 'rec-1',
      userId: 'user-1',
      name: "Emma's Birthday",
      type: 'Birthday',
      date: getDateString(5),
      reminderIntervals: [14, 7, 2],
      isRecurring: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    recipientName: 'Emma',
    giftIdeasCount: 3,
  },
  {
    occasion: {
      id: 'occ-2',
      recipientId: 'rec-2',
      userId: 'user-1',
      name: 'Anniversary',
      type: 'Anniversary',
      date: getDateString(15),
      reminderIntervals: [14, 7, 2],
      isRecurring: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    recipientName: 'John',
    giftIdeasCount: 0,
  },
];

// Mock the hook
const mockUseUpcomingOccasions = jest.fn();
jest.mock('@/features/occasions/hooks/useUpcomingOccasions', () => ({
  useUpcomingOccasions: () => mockUseUpcomingOccasions(),
}));

// Mock the UpcomingOccasionCard component
jest.mock('@/features/occasions/components/UpcomingOccasionCard', () => ({
  UpcomingOccasionCard: ({ occasion, recipientName, giftIdeasCount, onPress }: any) => {
    const { TouchableOpacity, Text, View } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={`occasion-card-${occasion.id}`}>
        <Text>{recipientName}</Text>
        <Text>{occasion.name}</Text>
        <Text>{`${giftIdeasCount} gift ideas`}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUpcomingOccasions.mockReturnValue({
      upcomingOccasions: mockUpcomingOccasions,
      isLoading: false,
      isEmpty: false,
      error: null,
    });
  });

  it('renders header', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Upcoming Occasions')).toBeTruthy();
  });

  it('renders occasion cards when data exists', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Emma')).toBeTruthy();
    expect(getByText("Emma's Birthday")).toBeTruthy();
    expect(getByText('John')).toBeTruthy();
    expect(getByText('Anniversary')).toBeTruthy();
  });

  it('shows empty state when no upcoming occasions', () => {
    mockUseUpcomingOccasions.mockReturnValue({
      upcomingOccasions: [],
      isLoading: false,
      isEmpty: true,
      error: null,
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('No upcoming occasions - add birthdays and events to get started')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseUpcomingOccasions.mockReturnValue({
      upcomingOccasions: [],
      isLoading: true,
      isEmpty: false,
      error: null,
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Loading occasions...')).toBeTruthy();
  });

  it('navigates to occasion detail when card is tapped', () => {
    const { getByTestId } = render(<HomeScreen />);

    const card = getByTestId('occasion-card-occ-1');
    fireEvent.press(card);

    expect(mockPush).toHaveBeenCalledWith('/occasion/occ-1');
  });

  it('navigates to people tab when empty state button is pressed', () => {
    mockUseUpcomingOccasions.mockReturnValue({
      upcomingOccasions: [],
      isLoading: false,
      isEmpty: true,
      error: null,
    });

    const { getByLabelText } = render(<HomeScreen />);

    const viewPeopleButton = getByLabelText('Go to People tab');
    fireEvent.press(viewPeopleButton);

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/people');
  });

  it('displays correct gift ideas count', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('3 gift ideas')).toBeTruthy();
    expect(getByText('0 gift ideas')).toBeTruthy();
  });

  it('shows "more occasions" indicator when over limit', () => {
    // Create 12 occasions (more than the 10 limit)
    const manyOccasions = Array.from({ length: 12 }, (_, i) => ({
      occasion: {
        id: `occ-${i}`,
        recipientId: `rec-${i}`,
        userId: 'user-1',
        name: `Occasion ${i}`,
        type: 'Birthday',
        date: getDateString(i + 1),
        reminderIntervals: [14, 7, 2],
        isRecurring: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      recipientName: `Person ${i}`,
      giftIdeasCount: i,
    }));

    mockUseUpcomingOccasions.mockReturnValue({
      upcomingOccasions: manyOccasions,
      isLoading: false,
      isEmpty: false,
      error: null,
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('+2 more occasions')).toBeTruthy();
  });
});
