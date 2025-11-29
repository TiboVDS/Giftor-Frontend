import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SectionHeader } from '@/components/ui/SectionHeader';

describe('SectionHeader', () => {
  it('renders title correctly', () => {
    const { getByText } = render(
      <SectionHeader title="Occasions" />
    );

    expect(getByText('Occasions')).toBeTruthy();
  });

  it('renders action button when onAction is provided', () => {
    const mockOnAction = jest.fn();
    const { getByText } = render(
      <SectionHeader
        title="Gift Ideas"
        actionLabel="Add"
        onAction={mockOnAction}
      />
    );

    expect(getByText('Add')).toBeTruthy();
  });

  it('calls onAction when action button is pressed', () => {
    const mockOnAction = jest.fn();
    const { getByText } = render(
      <SectionHeader
        title="Occasions"
        actionLabel="Add"
        onAction={mockOnAction}
      />
    );

    const button = getByText('Add');
    fireEvent.press(button);

    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when onAction is not provided', () => {
    const { queryByText } = render(
      <SectionHeader
        title="Occasions"
        actionLabel="Add"
      />
    );

    expect(queryByText('Add')).toBeNull();
  });

  it('does not render action button when actionLabel is not provided', () => {
    const { queryByRole } = render(
      <SectionHeader
        title="Occasions"
        onAction={jest.fn()}
      />
    );

    // Should only find the header, no button
    const buttons = queryByRole('button');
    expect(buttons).toBeNull();
  });

  it('has correct accessibility role for header', () => {
    const { getByRole } = render(
      <SectionHeader title="Test Header" />
    );

    expect(getByRole('header')).toBeTruthy();
  });

  it('has correct accessibility label for action button', () => {
    const { getByLabelText } = render(
      <SectionHeader
        title="Occasions"
        actionLabel="Add"
        onAction={jest.fn()}
      />
    );

    expect(getByLabelText('Add occasions')).toBeTruthy();
  });
});
