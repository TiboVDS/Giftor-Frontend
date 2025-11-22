import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecipientCard } from '@/features/recipients/components/RecipientCard';
import { RecipientDto } from '@/features/recipients/types/recipient.types';

// Mock expo-image
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: View,
  };
});

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => 'Jan 15'),
  parseISO: jest.fn((str) => new Date(str)),
}));

describe('RecipientCard', () => {
  const mockRecipient: RecipientDto = {
    id: '123',
    userId: 'user-1',
    name: 'Emma Johnson',
    relationship: 'Friend',
    interests: ['Reading', 'Cooking'],
    profilePictureUrl: 'https://example.com/photo.jpg',
    birthday: '1990-01-15',
  };

  it('renders all recipient fields', () => {
    const { getByText } = render(
      <RecipientCard recipient={mockRecipient} giftIdeaCount={3} onPress={jest.fn()} />
    );

    expect(getByText('Emma Johnson')).toBeTruthy();
    expect(getByText('Friend')).toBeTruthy();
    expect(getByText(/Birthday:/)).toBeTruthy();
    expect(getByText('3 gift ideas')).toBeTruthy();
  });

  it('shows "No ideas yet" when giftIdeaCount is 0', () => {
    const { getByText } = render(
      <RecipientCard recipient={mockRecipient} giftIdeaCount={0} onPress={jest.fn()} />
    );

    expect(getByText('No ideas yet')).toBeTruthy();
  });

  it('shows "1 gift idea" when giftIdeaCount is 1', () => {
    const { getByText } = render(
      <RecipientCard recipient={mockRecipient} giftIdeaCount={1} onPress={jest.fn()} />
    );

    expect(getByText('1 gift idea')).toBeTruthy();
  });

  it('shows "X gift ideas" when giftIdeaCount is > 1', () => {
    const { getByText } = render(
      <RecipientCard recipient={mockRecipient} giftIdeaCount={5} onPress={jest.fn()} />
    );

    expect(getByText('5 gift ideas')).toBeTruthy();
  });

  it('shows initials placeholder when no profilePictureUrl', () => {
    const recipientWithoutPhoto = { ...mockRecipient, profilePictureUrl: undefined };
    const { getByText } = render(
      <RecipientCard recipient={recipientWithoutPhoto} giftIdeaCount={0} onPress={jest.fn()} />
    );

    // Initials "EJ" should be displayed
    expect(getByText('EJ')).toBeTruthy();
  });

  it('does not show birthday indicator when birthday is not set', () => {
    const recipientWithoutBirthday = { ...mockRecipient, birthday: undefined };
    const { queryByText } = render(
      <RecipientCard recipient={recipientWithoutBirthday} giftIdeaCount={0} onPress={jest.fn()} />
    );

    expect(queryByText(/Birthday:/)).toBeNull();
  });

  it('calls onPress when card is tapped', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <RecipientCard recipient={mockRecipient} giftIdeaCount={0} onPress={mockOnPress} />
    );

    const card = getByText('Emma Johnson').parent?.parent;
    if (card) {
      fireEvent.press(card);
    }

    expect(mockOnPress).toHaveBeenCalled();
  });
});
