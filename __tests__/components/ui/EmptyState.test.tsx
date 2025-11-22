import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title and message', () => {
    const { getByText } = render(
      <EmptyState title="No items" message="Add some items to get started" />
    );

    expect(getByText('No items')).toBeTruthy();
    expect(getByText('Add some items to get started')).toBeTruthy();
  });

  it('renders optional icon', () => {
    const { getByText } = render(
      <EmptyState
        title="No items"
        message="Add some items"
        icon={<Text>Icon</Text>}
      />
    );

    expect(getByText('Icon')).toBeTruthy();
  });

  it('calls onAction when button is pressed', () => {
    const mockOnAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="No items"
        message="Add some items"
        actionLabel="Add Item"
        onAction={mockOnAction}
      />
    );

    const button = getByText('Add Item');
    fireEvent.press(button);

    expect(mockOnAction).toHaveBeenCalled();
  });

  it('does not render button if onAction is not provided', () => {
    const { queryByText } = render(
      <EmptyState
        title="No items"
        message="Add some items"
        actionLabel="Add Item"
      />
    );

    expect(queryByText('Add Item')).toBeNull();
  });

  it('does not render button if actionLabel is not provided', () => {
    const { queryByRole } = render(
      <EmptyState
        title="No items"
        message="Add some items"
        onAction={jest.fn()}
      />
    );

    // Should not find any button (Pressable has button role)
    expect(queryByRole('button')).toBeNull();
  });
});
