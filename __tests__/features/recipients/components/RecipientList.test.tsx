import React from 'react';
import { render } from '@testing-library/react-native';
import { RecipientList } from '@/features/recipients/components/RecipientList';
import { Recipient } from '@/types/database.types';

// Mock RecipientCard component
jest.mock('@/features/recipients/components/RecipientCard', () => {
  const { Text } = require('react-native');
  return {
    RecipientCard: ({ recipient }: any) => <Text>{recipient.name}</Text>,
  };
});

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

describe('RecipientList', () => {
  const mockRecipients: Recipient[] = [
    {
      id: '1',
      userId: 'user-1',
      name: 'Emma Johnson',
      relationship: 'Friend',
      hobbiesInterests: [],
      createdAt: '2025-11-10T10:00:00Z',
      updatedAt: '2025-11-10T10:00:00Z',
    },
    {
      id: '2',
      userId: 'user-1',
      name: 'John Doe',
      relationship: 'Family',
      hobbiesInterests: [],
      createdAt: '2025-11-10T10:00:00Z',
      updatedAt: '2025-11-10T10:00:00Z',
    },
  ];

  const mockGetGiftIdeaCount = jest.fn(() => 0);
  const mockOnRecipientPress = jest.fn();

  it('renders FlatList with recipients', () => {
    const { getByText } = render(
      <RecipientList
        recipients={mockRecipients}
        onRecipientPress={mockOnRecipientPress}
        getGiftIdeaCount={mockGetGiftIdeaCount}
      />
    );

    expect(getByText('Emma Johnson')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('shows empty state when no recipients', () => {
    const { Text } = require('react-native');
    const EmptyComponent = () => <Text>No recipients</Text>;

    const { getByText } = render(
      <RecipientList
        recipients={[]}
        onRecipientPress={mockOnRecipientPress}
        getGiftIdeaCount={mockGetGiftIdeaCount}
        ListEmptyComponent={<EmptyComponent />}
      />
    );

    expect(getByText('No recipients')).toBeTruthy();
  });
});
