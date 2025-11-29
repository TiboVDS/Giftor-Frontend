import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UpcomingOccasionCard } from '@/features/occasions/components/UpcomingOccasionCard';
import { Occasion } from '@/types/database.types';

// Mock the store functions
jest.mock('@/features/occasions/stores/occasionStore', () => ({
  getDaysUntil: jest.fn((dateString: string) => {
    // Mock implementation for testing
    const occasionDate = new Date(dateString);
    const today = new Date('2025-01-01');
    today.setHours(0, 0, 0, 0);
    occasionDate.setHours(0, 0, 0, 0);
    return Math.floor((occasionDate.getTime() - today.getTime()) / 86400000);
  }),
  formatDaysUntil: jest.fn((days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return `${Math.abs(days)} days ago`;
    return `in ${days} days`;
  }),
}));

const mockOccasion: Occasion = {
  id: 'occ-1',
  recipientId: 'rec-1',
  userId: 'user-1',
  name: "Birthday Party",
  type: 'Birthday',
  date: '2025-01-15',
  reminderIntervals: [14, 7, 2],
  isRecurring: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('UpcomingOccasionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders recipient name, occasion name, and date', () => {
    const { getByText } = render(
      <UpcomingOccasionCard
        occasion={mockOccasion}
        recipientName="Emma"
        giftIdeasCount={3}
        onPress={jest.fn()}
      />
    );

    expect(getByText('Emma')).toBeTruthy();
    expect(getByText('Birthday Party')).toBeTruthy();
    expect(getByText(/January 15/)).toBeTruthy();
  });

  it('shows correct "in X days" countdown', () => {
    const { getByText } = render(
      <UpcomingOccasionCard
        occasion={mockOccasion}
        recipientName="Emma"
        giftIdeasCount={3}
        onPress={jest.fn()}
      />
    );

    // 2025-01-15 is 14 days from 2025-01-01
    expect(getByText('in 14 days')).toBeTruthy();
  });

  it('shows "Today" for today\'s occasion', () => {
    const todayOccasion: Occasion = {
      ...mockOccasion,
      date: '2025-01-01', // Same as mocked today
    };

    const { getByText } = render(
      <UpcomingOccasionCard
        occasion={todayOccasion}
        recipientName="Emma"
        giftIdeasCount={3}
        onPress={jest.fn()}
      />
    );

    expect(getByText('Today')).toBeTruthy();
  });

  it('shows "Tomorrow" for tomorrow\'s occasion', () => {
    const tomorrowOccasion: Occasion = {
      ...mockOccasion,
      date: '2025-01-02', // One day from mocked today
    };

    const { getByText } = render(
      <UpcomingOccasionCard
        occasion={tomorrowOccasion}
        recipientName="Emma"
        giftIdeasCount={3}
        onPress={jest.fn()}
      />
    );

    expect(getByText('Tomorrow')).toBeTruthy();
  });

  it('shows gift ideas count correctly', () => {
    const { getByText } = render(
      <UpcomingOccasionCard
        occasion={mockOccasion}
        recipientName="Emma"
        giftIdeasCount={3}
        onPress={jest.fn()}
      />
    );

    expect(getByText('3 gift ideas ready')).toBeTruthy();
  });

  it('shows singular "1 gift idea ready" for single idea', () => {
    const { getByText } = render(
      <UpcomingOccasionCard
        occasion={mockOccasion}
        recipientName="Emma"
        giftIdeasCount={1}
        onPress={jest.fn()}
      />
    );

    expect(getByText('1 gift idea ready')).toBeTruthy();
  });

  it('shows "No ideas yet" when count is 0', () => {
    const { getByText } = render(
      <UpcomingOccasionCard
        occasion={mockOccasion}
        recipientName="Emma"
        giftIdeasCount={0}
        onPress={jest.fn()}
      />
    );

    expect(getByText('No ideas yet')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <UpcomingOccasionCard
        occasion={mockOccasion}
        recipientName="Emma"
        giftIdeasCount={3}
        onPress={mockOnPress}
      />
    );

    const card = getByRole('button');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('displays occasion type badge', () => {
    const { getByText } = render(
      <UpcomingOccasionCard
        occasion={mockOccasion}
        recipientName="Emma"
        giftIdeasCount={3}
        onPress={jest.fn()}
      />
    );

    expect(getByText('Birthday')).toBeTruthy();
  });

  it('has correct accessibility label', () => {
    const { getByLabelText } = render(
      <UpcomingOccasionCard
        occasion={mockOccasion}
        recipientName="Emma"
        giftIdeasCount={3}
        onPress={jest.fn()}
      />
    );

    // Label should include recipient name and occasion name
    expect(getByLabelText(/Emma's Birthday Party/)).toBeTruthy();
  });

  it('has accessibility hint for screen readers', () => {
    const { getByA11yHint } = render(
      <UpcomingOccasionCard
        occasion={mockOccasion}
        recipientName="Emma"
        giftIdeasCount={3}
        onPress={jest.fn()}
      />
    );

    expect(getByA11yHint('Double tap to view occasion details')).toBeTruthy();
  });
});
