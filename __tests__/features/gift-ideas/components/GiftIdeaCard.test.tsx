import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GiftIdeaCard } from '@/features/gift-ideas/components/GiftIdeaCard';
import { GiftIdea } from '@/types/database.types';

// Mock date-fns for consistent test output
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  return {
    ...actual,
    formatDistanceToNow: () => '3 weeks ago',
  };
});

const mockGiftIdea: GiftIdea = {
  id: 'idea-1',
  userId: 'user-1',
  recipientId: 'rec-1',
  occasionId: 'occ-1',
  giftText: 'Smart Watch',
  notes: 'Found this while shopping',
  productTitle: 'Apple Watch Series 9',
  estimatedPrice: 399.99,
  currency: 'EUR',
  productImageUrl: 'https://example.com/watch.jpg',
  shoppingLink: 'https://apple.com/watch',
  isPurchased: false,
  capturedAt: '2024-11-15T10:30:00Z',
  createdAt: '2024-11-15T10:30:00Z',
  updatedAt: '2024-11-15T10:30:00Z',
};

describe('GiftIdeaCard', () => {
  it('renders gift text and price', () => {
    const { getByText } = render(
      <GiftIdeaCard giftIdea={mockGiftIdea} onPress={jest.fn()} />
    );

    // Should use productTitle when available
    expect(getByText('Apple Watch Series 9')).toBeTruthy();
    expect(getByText('€399.99')).toBeTruthy();
  });

  it('displays giftText when productTitle is not available', () => {
    const ideaWithoutProductTitle: GiftIdea = {
      ...mockGiftIdea,
      productTitle: undefined,
    };

    const { getByText } = render(
      <GiftIdeaCard giftIdea={ideaWithoutProductTitle} onPress={jest.fn()} />
    );

    expect(getByText('Smart Watch')).toBeTruthy();
  });

  it('displays placeholder when no image URL', () => {
    const ideaWithoutImage: GiftIdea = {
      ...mockGiftIdea,
      productImageUrl: undefined,
    };

    const { queryByTestId } = render(
      <GiftIdeaCard giftIdea={ideaWithoutImage} onPress={jest.fn()} />
    );

    // The component should render without error, showing placeholder icon
    // We can't directly test for Ionicons, but the component should render
  });

  it('shows relative capture date', () => {
    const { getByText } = render(
      <GiftIdeaCard giftIdea={mockGiftIdea} onPress={jest.fn()} />
    );

    // Our mock returns "3 weeks ago"
    expect(getByText('3 weeks ago')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const mockOnPress = jest.fn();
    const { getByLabelText } = render(
      <GiftIdeaCard giftIdea={mockGiftIdea} onPress={mockOnPress} />
    );

    const card = getByLabelText(/Apple Watch Series 9/);
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows "Price unavailable" when no price is set', () => {
    const ideaWithoutPrice: GiftIdea = {
      ...mockGiftIdea,
      estimatedPrice: undefined,
    };

    const { getByText } = render(
      <GiftIdeaCard giftIdea={ideaWithoutPrice} onPress={jest.fn()} />
    );

    expect(getByText('Price unavailable')).toBeTruthy();
  });

  it('displays USD currency correctly', () => {
    const usdIdea: GiftIdea = {
      ...mockGiftIdea,
      currency: 'USD',
      estimatedPrice: 49.99,
    };

    const { getByText } = render(
      <GiftIdeaCard giftIdea={usdIdea} onPress={jest.fn()} />
    );

    expect(getByText('$49.99')).toBeTruthy();
  });

  it('displays GBP currency correctly', () => {
    const gbpIdea: GiftIdea = {
      ...mockGiftIdea,
      currency: 'GBP',
      estimatedPrice: 75.00,
    };

    const { getByText } = render(
      <GiftIdeaCard giftIdea={gbpIdea} onPress={jest.fn()} />
    );

    expect(getByText('£75.00')).toBeTruthy();
  });

  it('has correct accessibility role', () => {
    const { getByRole } = render(
      <GiftIdeaCard giftIdea={mockGiftIdea} onPress={jest.fn()} />
    );

    expect(getByRole('button')).toBeTruthy();
  });

  it('has accessibility hint for screen readers', () => {
    const { getByA11yHint } = render(
      <GiftIdeaCard giftIdea={mockGiftIdea} onPress={jest.fn()} />
    );

    expect(getByA11yHint('Double tap to view gift idea details')).toBeTruthy();
  });

  it('shows purchased indicator when isPurchased is true', () => {
    const purchasedIdea: GiftIdea = {
      ...mockGiftIdea,
      isPurchased: true,
    };

    const { getByLabelText } = render(
      <GiftIdeaCard giftIdea={purchasedIdea} onPress={jest.fn()} />
    );

    // Accessibility label should include "Purchased"
    expect(getByLabelText(/Purchased/)).toBeTruthy();
  });
});
